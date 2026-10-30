import type { EventStatus, Phase } from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeCode(input: string) {
  const code = input.replace(/[\s-]/g, "").toUpperCase();
  if (code.length !== 5 || [...code].some((character) => !CODE_ALPHABET.includes(character))) return null;
  return code;
}

export function createCode(randomByte: () => number) {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[randomByte() % CODE_ALPHABET.length]).join("");
}

export function normalizeTeamName(input: string) {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 24) return null;
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return null;
  return { name, key: name.toLocaleLowerCase("nl") };
}

export function joinDecision(event: { status: EventStatus; expiresAt: string }, now: number) {
  if (event.status !== "lobby") return "closed" as const;
  if (Date.parse(event.expiresAt) <= now) return "expired" as const;
  return "ok" as const;
}

export function startBlockers(
  event: { status: EventStatus; expiresAt: string },
  participants: { teamName: string | null }[],
  now: number,
) {
  if (event.status === "ended") return ["Dit evenement is beëindigd."];
  if (event.status === "started") return [];
  if (Date.parse(event.expiresAt) <= now) return ["Deze code is verlopen."];
  const missing: string[] = [];
  if (participants.length === 0) missing.push("Er is nog geen team aangesloten.");
  const unnamed = participants.filter((participant) => !participant.teamName).length;
  if (unnamed === 1) missing.push("Er is nog 1 aangesloten team zonder naam.");
  if (unnamed > 1) missing.push(`Er zijn nog ${unnamed} aangesloten teams zonder naam.`);
  return missing;
}

export function progressAllowed(
  current: { stepIndex: number; phase: Phase },
  next: { stepIndex: number; phase: Phase },
  lastStep: number,
  doneMilestones: readonly number[] = [2, lastStep],
) {
  if (next.stepIndex < 0 || next.stepIndex > lastStep) return false;
  // Van een afgerond dossier naar de volgende mijlpaal (bijv. d2 klaar → d3 klaar).
  if (current.phase === "done" && next.stepIndex === current.stepIndex + 1) {
    return next.phase === "playing" || next.phase === "done";
  }
  if (next.stepIndex < current.stepIndex || next.stepIndex > current.stepIndex + 1) return false;
  if (current.phase === "done") return next.phase === "done" && next.stepIndex === current.stepIndex;
  if (current.phase === "playing" && next.phase === "intro") return false;
  if (next.phase === "intro") return current.phase === "intro" && next.stepIndex === 0;
  if (next.phase === "done") {
    return doneMilestones.includes(next.stepIndex) && (next.stepIndex === current.stepIndex || next.stepIndex === current.stepIndex + 1);
  }
  return true;
}
