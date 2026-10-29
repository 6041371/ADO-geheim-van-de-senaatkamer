import { randomUUID } from "node:crypto";
import { DOSSIER2_LAST_STEP } from "../level2";
import { MemoryStore } from "./memory-store";
import { createCode, joinDecision, normalizeCode, normalizeTeamName, progressAllowed, startBlockers } from "./rules";
import type { EventStore } from "./store";
import { createHostToken, hashMatches, hashToken, participantToken, randomCodeByte } from "./tokens";
import { FlowError, type EventRecord, type HostRow, type ParticipantRecord, type Phase, type TeamRow } from "./types";

const LAST_STEP = DOSSIER2_LAST_STEP;
const EVENT_HOURS = 12;

export class EventService {
  constructor(
    private readonly store: EventStore,
    private readonly pepper: string,
    private readonly now: () => number = Date.now,
    private readonly codeByte: () => number = randomCodeByte,
  ) {}

  async create(accessCode: string, confirm: string) {
    const chosen = requireAccessCode(accessCode, confirm);
    const hostToken = createHostToken();
    const createdAt = new Date(this.now()).toISOString();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const event: EventRecord = {
        id: randomUUID(),
        code: createCode(this.codeByte),
        status: "lobby",
        hostTokenHash: hashToken(hostToken),
        accessCodeHash: hashToken(chosen),
        createdAt,
        expiresAt: new Date(this.now() + EVENT_HOURS * 60 * 60 * 1000).toISOString(),
        startedAt: null,
        endedAt: null,
      };
      const inserted = await this.store.insertEvent(event);
      if (inserted === "ok") return { event, hostToken, rows: this.hostRows(event, []) };
    }
    throw new FlowError("server", "Er kon geen evenementcode worden gemaakt.", 500);
  }

  async claim(accessCode: string, codeInput: string) {
    const event = await this.eventByCode(codeInput);
    if (!event.accessCodeHash || !hashMatches(accessCode.trim(), event.accessCodeHash)) {
      throw new FlowError("unauthorized", "De instructeurscode klopt niet.", 401);
    }
    if (event.status === "ended") {
      throw new FlowError("invalid_status", "Dit evenement is beëindigd.", 409);
    }
    const hostToken = createHostToken();
    const updated = await this.store.rotateHostToken(event.id, hashToken(hostToken));
    if (!updated) throw new FlowError("invalid", "Deze code bestaat niet.", 404);
    const participants = await this.store.listParticipants(updated.id);
    return { event: updated, hostToken, rows: this.hostRows(updated, participants) };
  }

  async join(codeInput: string, clientId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
      throw new FlowError("invalid", "Dit scherm kon niet worden aangemeld.", 400);
    }
    const event = await this.eventByCode(codeInput);
    const existing = await this.store.findParticipantByClient(event.id, clientId);
    if (existing) return this.teamSession(event, existing, false);
    const decision = joinDecision(event, this.now());
    if (decision === "expired") throw new FlowError("expired", "Deze code is verlopen.", 410);
    if (decision === "closed") {
      throw new FlowError("closed", "Deelname is niet meer mogelijk. Het evenement is al gestart of beëindigd.", 409);
    }
    const token = participantToken(this.pepper, event.id, clientId);
    const timestamp = new Date(this.now()).toISOString();
    const participant: ParticipantRecord = {
      id: randomUUID(),
      eventId: event.id,
      clientId,
      teamName: null,
      teamNameKey: null,
      tokenHash: hashToken(token),
      stepIndex: 0,
      phase: "intro",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const inserted = await this.store.insertParticipant(participant);
    if (inserted === "duplicate_client") {
      const raced = await this.store.findParticipantByClient(event.id, clientId);
      if (!raced) throw new FlowError("server", "Er ging iets mis. Probeer het opnieuw.", 500);
      return this.teamSession(event, raced, false);
    }
    return this.teamSession(event, participant, true);
  }

  async setName(teamToken: string, teamName: string) {
    const loaded = await this.teamOrThrow(teamToken);
    if (loaded.event.status !== "lobby") {
      throw new FlowError("closed", "De teamnaam kan niet meer worden gewijzigd.", 409);
    }
    const normalized = normalizeTeamName(teamName);
    if (!normalized) throw new FlowError("invalid", "Kies een teamnaam van 2 tot 24 tekens.", 400);
    const updated = await this.store.setTeamName(
      loaded.participant.id,
      normalized.name,
      normalized.key,
      new Date(this.now()).toISOString(),
    );
    if (updated === "duplicate_name") throw new FlowError("duplicate", "Die teamnaam is al in gebruik.", 409);
    if (!updated) throw new FlowError("invalid", "Dit team hoort niet meer bij het evenement.", 404);
    return this.teamSession(loaded.event, updated, false);
  }

  async start(hostToken: string) {
    const event = await this.hostEvent(hostToken);
    const participants = await this.store.listParticipants(event.id);
    if (event.status === "started") return { event, rows: this.hostRows(event, participants), started: false };
    if (event.status === "ended") throw new FlowError("invalid_status", "Dit evenement is beëindigd.", 409);
    const missing = startBlockers(event, participants, this.now());
    if (missing.length > 0) throw new FlowError("missing", "Het evenement kan nog niet starten.", 409, missing);
    const startedAt = new Date(this.now()).toISOString();
    const updated = await this.store.startIfLobby(event.id, startedAt);
    if (!updated) {
      const again = await this.store.findEventById(event.id);
      if (again?.status === "started") {
        const current = await this.store.listParticipants(again.id);
        return { event: again, rows: this.hostRows(again, current), started: false };
      }
      throw new FlowError("invalid_status", "Dit evenement kan niet meer starten.", 409);
    }
    return { event: updated, rows: this.hostRows(updated, participants), started: true };
  }

  async end(hostToken: string) {
    const event = await this.hostEvent(hostToken);
    if (event.status === "ended") {
      const participants = await this.store.listParticipants(event.id);
      return { event, rows: this.hostRows(event, participants) };
    }
    const updated = await this.store.endIfOpen(event.id, new Date(this.now()).toISOString());
    if (!updated) throw new FlowError("invalid_status", "Dit evenement is al beëindigd.", 409);
    const participants = await this.store.listParticipants(updated.id);
    return { event: updated, rows: this.hostRows(updated, participants) };
  }

  async removeParticipant(hostToken: string, participantId: string) {
    const event = await this.hostEvent(hostToken);
    if (event.status !== "lobby") {
      throw new FlowError("invalid_status", "Teams kunnen alleen vóór de start worden verwijderd.", 409);
    }
    const participant = await this.store.findParticipantById(participantId);
    if (!participant || participant.eventId !== event.id) {
      throw new FlowError("invalid", "Dit team hoort niet bij het evenement.", 404);
    }
    await this.store.removeParticipant(participant.id);
    const participants = await this.store.listParticipants(event.id);
    return { rows: this.hostRows(event, participants) };
  }

  async progress(teamToken: string, stepIndex: number, phase: Phase) {
    const loaded = await this.teamOrThrow(teamToken);
    if (loaded.event.status !== "started") {
      throw new FlowError("invalid_status", "De opdrachten starten pas als de instructeur het evenement start.", 409);
    }
    if (!progressAllowed(loaded.participant, { stepIndex, phase }, LAST_STEP)) {
      throw new FlowError("invalid_status", "Die voortgang hoort niet bij dit team.", 409);
    }
    const updated = await this.store.setProgress(loaded.participant.id, {
      stepIndex,
      phase,
      updatedAt: new Date(this.now()).toISOString(),
    });
    if (!updated) throw new FlowError("invalid_status", "De voortgang kon niet worden opgeslagen.", 409);
    return this.teamSession(loaded.event, updated, false);
  }

  /** Test-only: zet voortgang vrij naar elke geldige stap, zonder volgorde-check. */
  async jump(teamToken: string, stepIndex: number, phase: Phase) {
    const loaded = await this.teamOrThrow(teamToken);
    if (loaded.event.status !== "started") {
      throw new FlowError("invalid_status", "De opdrachten starten pas als de instructeur het evenement start.", 409);
    }
    if (stepIndex < 0 || stepIndex > LAST_STEP) {
      throw new FlowError("invalid_status", "Die voortgang hoort niet bij dit team.", 409);
    }
    if (phase !== "intro" && phase !== "playing" && phase !== "done") {
      throw new FlowError("invalid_status", "Die voortgang hoort niet bij dit team.", 409);
    }
    const updated = await this.store.setProgress(loaded.participant.id, {
      stepIndex,
      phase,
      updatedAt: new Date(this.now()).toISOString(),
    });
    if (!updated) throw new FlowError("invalid_status", "De voortgang kon niet worden opgeslagen.", 409);
    return this.teamSession(loaded.event, updated, false);
  }

  async replay(teamToken: string) {
    const loaded = await this.teamOrThrow(teamToken);
    if (loaded.event.status !== "started") {
      throw new FlowError("invalid_status", "De opdrachten starten pas als de instructeur het evenement start.", 409);
    }
    const updated = await this.store.setProgress(loaded.participant.id, {
      stepIndex: 0,
      phase: "intro",
      updatedAt: new Date(this.now()).toISOString(),
    });
    if (!updated) throw new FlowError("invalid_status", "De voortgang kon niet worden gewist.", 409);
    return this.teamSession(loaded.event, updated, false);
  }

  async hostSnapshot(hostToken: string) {
    const event = await this.hostEvent(hostToken);
    const participants = await this.store.listParticipants(event.id);
    return { event, rows: this.hostRows(event, participants) };
  }

  async teamSnapshot(teamToken: string) {
    const loaded = await this.teamOrThrow(teamToken);
    return this.teamSession(loaded.event, loaded.participant, false);
  }

  private async hostEvent(hostToken: string) {
    const event = await this.store.findEventByHostHash(hashToken(hostToken));
    if (!event) throw new FlowError("unauthorized", "Dit scherm mag het evenement niet bedienen.", 401);
    return event;
  }

  private async eventByCode(codeInput: string) {
    const code = normalizeCode(codeInput);
    if (!code) throw new FlowError("invalid", "Deze code bestaat niet.", 404);
    const event = await this.store.findEventByCode(code);
    if (!event) throw new FlowError("invalid", "Deze code bestaat niet.", 404);
    return event;
  }

  private async teamOrThrow(teamToken: string) {
    const participant = await this.store.findParticipantByTokenHash(hashToken(teamToken));
    if (!participant) throw new FlowError("unauthorized", "Dit team is niet aangemeld.", 401);
    const event = await this.store.findEventById(participant.eventId);
    if (!event) throw new FlowError("invalid", "Deze code bestaat niet.", 404);
    const token = participantToken(this.pepper, event.id, participant.clientId);
    if (hashToken(token) !== participant.tokenHash) {
      throw new FlowError("unauthorized", "Dit team is niet aangemeld.", 401);
    }
    return { event, participant, token };
  }

  private teamSession(event: EventRecord, participant: ParticipantRecord, created: boolean) {
    const token = participantToken(this.pepper, event.id, participant.clientId);
    return {
      created,
      token,
      row: toTeamRow(event, participant),
    };
  }

  private hostRows(event: EventRecord, participants: ParticipantRecord[]): HostRow[] {
    if (participants.length === 0) {
      return [
        {
          id: event.id,
          code: event.code,
          status: event.status,
          started_at: event.startedAt,
          expires_at: event.expiresAt,
          team_name: null,
          step_index: null,
          phase: null,
          joined_at: null,
        },
      ];
    }
    return participants.map((participant) => ({
      id: participant.id,
      code: event.code,
      status: event.status,
      started_at: event.startedAt,
      expires_at: event.expiresAt,
      team_name: participant.teamName,
      step_index: participant.stepIndex,
      phase: participant.phase,
      joined_at: participant.createdAt,
    }));
  }
}

function toTeamRow(event: EventRecord, participant: ParticipantRecord): TeamRow {
  return {
    id: participant.id,
    code: event.code,
    status: event.status,
    started_at: event.startedAt,
    team_name: participant.teamName,
    step_index: participant.stepIndex,
    phase: participant.phase,
  };
}

export function serviceFromEnv(store: EventStore) {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) {
    throw new FlowError("server", "De instructeursconfiguratie ontbreekt op de server.", 500);
  }
  return new EventService(store, pepper);
}

export function memoryService(pepper = "test-pepper") {
  return new EventService(new MemoryStore(), pepper);
}

function requireAccessCode(accessCode: string, confirm: string) {
  const chosen = accessCode.trim();
  if (chosen.length < 6 || chosen.length > 64) {
    throw new FlowError("invalid", "Kies een instructeurscode van minstens 6 tekens.", 400);
  }
  if (chosen !== confirm.trim()) {
    throw new FlowError("invalid", "De instructeurscodes komen niet overeen.", 400);
  }
  return chosen;
}
