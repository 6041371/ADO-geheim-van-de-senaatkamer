import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createHostToken() {
  return randomBytes(32).toString("hex");
}

export function participantToken(pepper: string, eventId: string, clientId: string) {
  return createHmac("sha256", pepper).update(`${eventId}:${clientId}`).digest("hex");
}

export function pinMatches(input: string, expected: string) {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function hashMatches(input: string, storedHash: string) {
  const actual = Buffer.from(hashToken(input), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (actual.length === 0 || actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function randomCodeByte() {
  return randomInt(0, 256);
}
