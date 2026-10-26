import assert from "node:assert/strict";
import test from "node:test";
import { createCode, joinDecision, normalizeCode, normalizeTeamName, progressAllowed, startBlockers } from "./rules";

test("normaliseert een evenementcode en weigert verwarrende tekens", () => {
  assert.equal(normalizeCode(" ab-cde "), "ABCDE");
  assert.equal(normalizeCode("ABCDO"), null);
  assert.equal(normalizeCode("AB1"), null);
});

test("maakt een code van vijf leesbare tekens", () => {
  const code = createCode(() => 0);
  assert.equal(code, "AAAAA");
  assert.equal(normalizeCode(code), code);
});

test("normaliseert teamnamen en ziet hoofdletters als dezelfde naam", () => {
  assert.equal(normalizeTeamName("  De   Leeuwen ")?.key, "de leeuwen");
  assert.equal(normalizeTeamName("A"), null);
  assert.equal(normalizeTeamName("Team <1>"), null);
});

test("weigert deelname aan een verlopen of al gestart evenement", () => {
  const now = Date.parse("2026-10-23T10:00:00.000Z");
  assert.equal(joinDecision({ status: "lobby", expiresAt: "2026-10-23T09:00:00.000Z" }, now), "expired");
  assert.equal(joinDecision({ status: "started", expiresAt: "2026-10-23T12:00:00.000Z" }, now), "closed");
  assert.equal(joinDecision({ status: "lobby", expiresAt: "2026-10-23T12:00:00.000Z" }, now), "ok");
});

test("houdt de start tegen zolang namen ontbreken", () => {
  const event = { status: "lobby" as const, expiresAt: "2026-10-23T12:00:00.000Z" };
  const now = Date.parse("2026-10-23T10:00:00.000Z");
  assert.deepEqual(startBlockers(event, [], now), ["Er is nog geen team aangesloten."]);
  assert.match(startBlockers(event, [{ teamName: null }, { teamName: "A" }], now).join(" "), /zonder naam/);
  assert.deepEqual(startBlockers(event, [{ teamName: "A" }], now), []);
  assert.deepEqual(startBlockers({ ...event, status: "started" }, [], now), []);
});

test("staat alleen eigen vooruitgang toe", () => {
  assert.equal(progressAllowed({ stepIndex: 0, phase: "intro" }, { stepIndex: 0, phase: "playing" }, 3), true);
  assert.equal(progressAllowed({ stepIndex: 0, phase: "playing" }, { stepIndex: 2, phase: "playing" }, 3), false);
  assert.equal(progressAllowed({ stepIndex: 1, phase: "playing" }, { stepIndex: 0, phase: "playing" }, 3), false);
  assert.equal(progressAllowed({ stepIndex: 3, phase: "playing" }, { stepIndex: 3, phase: "done" }, 3), true);
  assert.equal(progressAllowed({ stepIndex: 1, phase: "playing" }, { stepIndex: 1, phase: "done" }, 3), false);
  assert.equal(progressAllowed({ stepIndex: 2, phase: "playing" }, { stepIndex: 2, phase: "done" }, 5), true);
  assert.equal(progressAllowed({ stepIndex: 2, phase: "done" }, { stepIndex: 3, phase: "playing" }, 5), true);
  assert.equal(progressAllowed({ stepIndex: 4, phase: "playing" }, { stepIndex: 5, phase: "done" }, 5), true);
  assert.equal(progressAllowed({ stepIndex: 5, phase: "done" }, { stepIndex: 5, phase: "playing" }, 5), false);
});
