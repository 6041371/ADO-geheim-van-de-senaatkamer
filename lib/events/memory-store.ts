import type { EventStore, ParticipantPatch } from "./store";
import type { EventRecord, ParticipantRecord, Phase } from "./types";

function copyEvent(event: EventRecord): EventRecord {
  return { ...event };
}

function copyParticipant(participant: ParticipantRecord): ParticipantRecord {
  return { ...participant };
}

export class MemoryStore implements EventStore {
  private events = new Map<string, EventRecord>();
  private participants = new Map<string, ParticipantRecord>();

  async insertEvent(event: EventRecord) {
    if ([...this.events.values()].some((item) => item.code === event.code)) return "duplicate_code" as const;
    this.events.set(event.id, copyEvent(event));
    return "ok" as const;
  }

  async findEventByCode(code: string) {
    return copyEventOrNull([...this.events.values()].find((event) => event.code === code));
  }

  async findEventById(id: string) {
    return copyEventOrNull(this.events.get(id));
  }

  async findEventByHostHash(hash: string) {
    return copyEventOrNull([...this.events.values()].find((event) => event.hostTokenHash === hash));
  }

  async startIfLobby(id: string, startedAt: string) {
    const event = this.events.get(id);
    if (!event || event.status !== "lobby") return null;
    event.status = "started";
    event.startedAt = startedAt;
    return copyEvent(event);
  }

  async endIfOpen(id: string, endedAt: string) {
    const event = this.events.get(id);
    if (!event || event.status === "ended") return null;
    event.status = "ended";
    event.endedAt = endedAt;
    return copyEvent(event);
  }

  async rotateHostToken(id: string, hostTokenHash: string) {
    const event = this.events.get(id);
    if (!event) return null;
    event.hostTokenHash = hostTokenHash;
    return copyEvent(event);
  }

  async insertParticipant(participant: ParticipantRecord) {
    const rows = [...this.participants.values()];
    if (rows.some((item) => item.eventId === participant.eventId && item.clientId === participant.clientId)) {
      return "duplicate_client" as const;
    }
    if (
      participant.teamNameKey &&
      rows.some((item) => item.eventId === participant.eventId && item.teamNameKey === participant.teamNameKey)
    ) {
      return "duplicate_name" as const;
    }
    this.participants.set(participant.id, copyParticipant(participant));
    return "ok" as const;
  }

  async findParticipantByClient(eventId: string, clientId: string) {
    return copyParticipantOrNull(
      [...this.participants.values()].find((item) => item.eventId === eventId && item.clientId === clientId),
    );
  }

  async findParticipantByTokenHash(hash: string) {
    return copyParticipantOrNull([...this.participants.values()].find((item) => item.tokenHash === hash));
  }

  async findParticipantById(id: string) {
    return copyParticipantOrNull(this.participants.get(id));
  }

  async listParticipants(eventId: string) {
    return [...this.participants.values()]
      .filter((item) => item.eventId === eventId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(copyParticipant);
  }

  async nameTaken(eventId: string, key: string, exceptId?: string) {
    return [...this.participants.values()].some(
      (item) => item.eventId === eventId && item.teamNameKey === key && item.id !== exceptId,
    );
  }

  async setTeamName(id: string, name: string, key: string, updatedAt: string) {
    const participant = this.participants.get(id);
    if (!participant) return null;
    if (await this.nameTaken(participant.eventId, key, id)) return "duplicate_name" as const;
    applyParticipant(participant, { teamName: name, teamNameKey: key, updatedAt });
    return copyParticipant(participant);
  }

  async setProgress(id: string, progress: { stepIndex: number; phase: Phase; updatedAt: string }) {
    const participant = this.participants.get(id);
    if (!participant) return null;
    const event = this.events.get(participant.eventId);
    if (!event || event.status !== "started") return null;
    applyParticipant(participant, progress);
    return copyParticipant(participant);
  }

  async removeParticipant(id: string) {
    return this.participants.delete(id);
  }

  async deleteEvent(id: string) {
    this.events.delete(id);
    for (const [participantId, participant] of this.participants) {
      if (participant.eventId === id) this.participants.delete(participantId);
    }
  }
}

function applyParticipant(participant: ParticipantRecord, patch: ParticipantPatch) {
  Object.assign(participant, patch);
}

function copyEventOrNull(event: EventRecord | undefined) {
  return event ? copyEvent(event) : null;
}

function copyParticipantOrNull(participant: ParticipantRecord | undefined) {
  return participant ? copyParticipant(participant) : null;
}
