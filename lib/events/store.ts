import type { EventRecord, ParticipantRecord, Phase } from "./types";

export type EventPatch = Partial<Pick<EventRecord, "status" | "hostTokenHash" | "startedAt" | "endedAt">>;
export type ParticipantPatch = Partial<
  Pick<ParticipantRecord, "teamName" | "teamNameKey" | "stepIndex" | "phase" | "updatedAt">
>;

export interface EventStore {
  insertEvent(event: EventRecord): Promise<"ok" | "duplicate_code">;
  findEventByCode(code: string): Promise<EventRecord | null>;
  findEventById(id: string): Promise<EventRecord | null>;
  findEventByHostHash(hash: string): Promise<EventRecord | null>;
  startIfLobby(id: string, startedAt: string): Promise<EventRecord | null>;
  endIfOpen(id: string, endedAt: string): Promise<EventRecord | null>;
  rotateHostToken(id: string, hostTokenHash: string): Promise<EventRecord | null>;
  insertParticipant(participant: ParticipantRecord): Promise<"ok" | "duplicate_client" | "duplicate_name">;
  findParticipantByClient(eventId: string, clientId: string): Promise<ParticipantRecord | null>;
  findParticipantByTokenHash(hash: string): Promise<ParticipantRecord | null>;
  findParticipantById(id: string): Promise<ParticipantRecord | null>;
  listParticipants(eventId: string): Promise<ParticipantRecord[]>;
  nameTaken(eventId: string, key: string, exceptId?: string): Promise<boolean>;
  setTeamName(id: string, name: string, key: string, updatedAt: string): Promise<ParticipantRecord | "duplicate_name" | null>;
  setProgress(
    id: string,
    progress: { stepIndex: number; phase: Phase; updatedAt: string },
  ): Promise<ParticipantRecord | null>;
  removeParticipant(id: string): Promise<boolean>;
  deleteEvent(id: string): Promise<void>;
}
