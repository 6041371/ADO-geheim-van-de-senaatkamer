export type EventStatus = "lobby" | "started" | "ended";
export type Phase = "intro" | "playing" | "done";

export type EventRecord = {
  id: string;
  code: string;
  status: EventStatus;
  hostTokenHash: string;
  accessCodeHash: string | null;
  createdAt: string;
  expiresAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

export type ParticipantRecord = {
  id: string;
  eventId: string;
  clientId: string;
  teamName: string | null;
  teamNameKey: string | null;
  tokenHash: string;
  stepIndex: number;
  phase: Phase;
  createdAt: string;
  updatedAt: string;
};

export type HostRow = {
  id: string;
  code: string;
  status: EventStatus;
  started_at: string | null;
  expires_at: string;
  team_name: string | null;
  step_index: number | null;
  phase: Phase | null;
  joined_at: string | null;
};

export type TeamRow = {
  id: string;
  code: string;
  status: EventStatus;
  started_at: string | null;
  team_name: string | null;
  step_index: number;
  phase: Phase;
};

export class FlowError extends Error {
  readonly missing?: string[];

  constructor(
    readonly code: "invalid" | "expired" | "closed" | "duplicate" | "missing" | "unauthorized" | "invalid_status" | "server",
    message: string,
    readonly status: number,
    missing?: string[],
  ) {
    super(message);
    this.name = "FlowError";
    this.missing = missing;
  }
}
