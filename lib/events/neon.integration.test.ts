import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createNeonStore } from "./neon-store";
import { EventService } from "./service";
import { FlowError } from "./types";

loadEnv();

test("bewaart evenementen, teams en voortgang in Postgres", { skip: process.env.DATABASE_URL ? false : "DATABASE_URL ontbreekt" }, async () => {
  const service = new EventService(createNeonStore(), `integration-${randomUUID()}`);
  const created = await service.create("246810", "246810");
  try {
    await assert.rejects(() => service.join("ABCDE", randomUUID()), (error: unknown) => {
      assert.ok(error instanceof FlowError);
      assert.equal(error.code, "invalid");
      return true;
    });
    const firstClient = randomUUID();
    const first = await service.join(created.event.code, firstClient);
    const named = await service.setName(first.token, "De Leeuwen");
    const duplicate = await service.join(created.event.code, firstClient);
    assert.equal(duplicate.row.id, named.row.id);
    const extra = await service.join(created.event.code, randomUUID());
    await assert.rejects(() => service.setName(extra.token, "de leeuwen"), (error: unknown) => {
      assert.ok(error instanceof FlowError);
      assert.equal(error.code, "duplicate");
      return true;
    });
    await service.removeParticipant(created.hostToken, extra.row.id);
    const second = await service.join(created.event.code, randomUUID());
    await service.setName(second.token, "De Ooievaars");
    const beforeStart = await service.hostSnapshot(created.hostToken);
    assert.equal(beforeStart.rows.length, 2);
    await assert.rejects(() => service.start(named.token), (error: unknown) => {
      assert.ok(error instanceof FlowError);
      assert.equal(error.code, "unauthorized");
      return true;
    });
    const started = await service.start(created.hostToken);
    const restarted = await service.start(created.hostToken);
    assert.equal(restarted.started, false);
    assert.equal(restarted.event.startedAt, started.event.startedAt);
    await service.progress(named.token, 0, "playing");
    const resumed = await service.join(created.event.code, firstClient);
    assert.equal(resumed.row.step_index, 0);
    assert.equal(resumed.row.phase, "playing");
    const other = await service.teamSnapshot(second.token);
    assert.equal(other.row.phase, "intro");
    await assert.rejects(() => service.join(created.event.code, randomUUID()), (error: unknown) => {
      assert.ok(error instanceof FlowError);
      assert.equal(error.code, "closed");
      return true;
    });
    const ended = await service.end(created.hostToken);
    assert.equal(ended.event.status, "ended");
    const afterEnd = await service.teamSnapshot(named.token);
    assert.equal(afterEnd.row.status, "ended");
    assert.equal(afterEnd.row.phase, "playing");
  } finally {
    await createNeonStore().deleteEvent(created.event.id);
  }
});

function loadEnv() {
  try {
    const text = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  } catch {
    // De integratietest slaat zichzelf over als de database niet is ingesteld.
  }
}
