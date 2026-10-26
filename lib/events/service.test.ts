import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { MemoryStore } from "./memory-store";
import { EventService } from "./service";
import { FlowError } from "./types";

function serviceAt(start = Date.parse("2026-10-23T10:00:00.000Z")) {
  let now = start;
  const clock = {
    now: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
  return { clock, service: new EventService(new MemoryStore(), "pepper", () => now) };
}

async function namedTeam(service: EventService, code: string, name: string) {
  const clientId = randomUUID();
  const joined = await service.join(code, clientId);
  const named = await service.setName(joined.token, name);
  return { clientId, ...named };
}

test("bewaart een zelfgekozen instructeurscode bij het evenement", async () => {
  const { service } = serviceAt();
  const created = await service.create("246810", "246810");
  assert.equal(created.event.status, "lobby");
  assert.equal(created.event.code.length, 5);
  await assert.rejects(() => service.create("kort", "kort"), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "invalid");
    return true;
  });
  await assert.rejects(() => service.create("246810", "anders"), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "invalid");
    return true;
  });
  await assert.rejects(() => service.claim("verkeerd", created.event.code), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "unauthorized");
    return true;
  });
  const claimed = await service.claim("246810", created.event.code);
  assert.equal(claimed.event.id, created.event.id);
});

test("weigert een onbekende, verlopen of gesloten code", async () => {
  const { service, clock } = serviceAt();
  const created = await service.create("246810", "246810");
  await assert.rejects(() => service.join("ABCDE", randomUUID()), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "invalid");
    return true;
  });
  clock.advance(13 * 60 * 60 * 1000);
  await assert.rejects(() => service.join(created.event.code, randomUUID()), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "expired");
    return true;
  });
});

test("meldt meerdere teams, voorkomt dubbele namen en dubbele registratie", async () => {
  const { service } = serviceAt();
  const created = await service.create("246810", "246810");
  const first = await namedTeam(service, created.event.code, "De Leeuwen");
  const again = await service.join(created.event.code, first.clientId);
  assert.equal(again.row.id, first.row.id);
  assert.equal(again.created, false);
  const extra = await service.join(created.event.code, randomUUID());
  await assert.rejects(() => service.setName(extra.token, "de leeuwen"), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "duplicate");
    return true;
  });
  await service.removeParticipant(created.hostToken, extra.row.id);
  await namedTeam(service, created.event.code, "De Ooievaars");
  const host = await service.hostSnapshot(created.hostToken);
  const names = host.rows.map((row) => row.team_name).sort();
  assert.deepEqual(names, ["De Leeuwen", "De Ooievaars"]);
});

test("start pas als elke deelnemer een naam heeft en start niet opnieuw", async () => {
  const { service, clock } = serviceAt();
  const created = await service.create("246810", "246810");
  await assert.rejects(() => service.start(created.hostToken), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "missing");
    assert.match(error.missing?.join(" ") ?? "", /geen team/);
    return true;
  });
  const unnamed = await service.join(created.event.code, randomUUID());
  await assert.rejects(() => service.start(created.hostToken), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.match(error.missing?.join(" ") ?? "", /zonder naam/);
    return true;
  });
  await service.setName(unnamed.token, "Tribune");
  const started = await service.start(created.hostToken);
  assert.equal(started.started, true);
  clock.advance(5000);
  const second = await service.start(created.hostToken);
  assert.equal(second.started, false);
  assert.equal(second.event.startedAt, started.event.startedAt);
  await assert.rejects(() => service.join(created.event.code, randomUUID()), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "closed");
    return true;
  });
});

test("laat een team niet starten en houdt voortgang per team", async () => {
  const { service } = serviceAt();
  const created = await service.create("246810", "246810");
  const lions = await namedTeam(service, created.event.code, "De Leeuwen");
  const storks = await namedTeam(service, created.event.code, "De Ooievaars");
  await assert.rejects(() => service.start(lions.token), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "unauthorized");
    return true;
  });
  await assert.rejects(() => service.removeParticipant(lions.token, storks.row.id), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "unauthorized");
    return true;
  });
  await service.start(created.hostToken);
  const playing = await service.progress(lions.token, 0, "playing");
  assert.equal(playing.row.phase, "playing");
  const next = await service.progress(lions.token, 1, "playing");
  assert.equal(next.row.step_index, 1);
  const replayed = await service.replay(lions.token);
  assert.equal(replayed.row.phase, "intro");
  assert.equal(replayed.row.step_index, 0);
  const again = await service.progress(lions.token, 0, "playing");
  assert.equal(again.row.phase, "playing");
  await service.progress(lions.token, 1, "playing");
  const other = await service.teamSnapshot(storks.token);
  assert.equal(other.row.phase, "intro");
  assert.equal(other.row.step_index, 0);
  const resumed = await service.join(created.event.code, lions.clientId);
  assert.equal(resumed.row.step_index, 1);
  assert.equal(resumed.row.code, created.event.code);
  const host = await service.hostSnapshot(created.hostToken);
  assert.equal(host.rows.find((row) => row.id === lions.row.id)?.step_index, 1);
  assert.equal(host.rows.find((row) => row.id === storks.row.id)?.phase, "intro");
});

test("beëindigt een evenement één keer en hervat een bestaande sessie", async () => {
  const { service } = serviceAt();
  const created = await service.create("246810", "246810");
  const team = await namedTeam(service, created.event.code, "De Leeuwen");
  await service.start(created.hostToken);
  await service.progress(team.token, 0, "playing");
  const ended = await service.end(created.hostToken);
  assert.equal(ended.event.status, "ended");
  const again = await service.end(created.hostToken);
  assert.equal(again.event.endedAt, ended.event.endedAt);
  await assert.rejects(() => service.start(created.hostToken), (error: unknown) => {
    assert.ok(error instanceof FlowError);
    assert.equal(error.code, "invalid_status");
    return true;
  });
  const resumed = await service.teamSnapshot(team.token);
  assert.equal(resumed.row.status, "ended");
  assert.equal(resumed.row.phase, "playing");
});
