import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { EventStore } from "./store";
import type { EventRecord, EventStatus, ParticipantRecord, Phase } from "./types";

type Sql = NeonQueryFunction<false, false>;

let schema: Promise<void> | null = null;

export function createNeonStore(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL ontbreekt");
  return new NeonStore(neon(databaseUrl));
}

export class NeonStore implements EventStore {
  constructor(private readonly sql: Sql) {}

  private ready() {
    schema ??= ensureSchema(this.sql);
    return schema;
  }

  async insertEvent(event: EventRecord) {
    await this.ready();
    try {
      await this.sql`
        INSERT INTO events (
          id, code, status, host_token_hash, access_code_hash, created_at, expires_at, started_at, ended_at
        )
        VALUES (
          ${event.id}::uuid,
          ${event.code},
          ${event.status},
          ${event.hostTokenHash},
          ${event.accessCodeHash},
          ${event.createdAt}::timestamptz,
          ${event.expiresAt}::timestamptz,
          ${event.startedAt}::timestamptz,
          ${event.endedAt}::timestamptz
        )
      `;
      return "ok" as const;
    } catch (error) {
      if (pgCode(error) === "23505") return "duplicate_code" as const;
      throw error;
    }
  }

  async findEventByCode(code: string) {
    await this.ready();
    const rows = await this.sql`SELECT * FROM events WHERE code = ${code} LIMIT 1`;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async findEventById(id: string) {
    await this.ready();
    const rows = await this.sql`SELECT * FROM events WHERE id = ${id}::uuid LIMIT 1`;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async findEventByHostHash(hash: string) {
    await this.ready();
    const rows = await this.sql`SELECT * FROM events WHERE host_token_hash = ${hash} LIMIT 1`;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async startIfLobby(id: string, startedAt: string) {
    await this.ready();
    const rows = await this.sql`
      UPDATE events
      SET status = 'started', started_at = ${startedAt}::timestamptz
      WHERE id = ${id}::uuid AND status = 'lobby'
      RETURNING *
    `;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async endIfOpen(id: string, endedAt: string) {
    await this.ready();
    const rows = await this.sql`
      UPDATE events
      SET status = 'ended', ended_at = ${endedAt}::timestamptz
      WHERE id = ${id}::uuid AND status <> 'ended'
      RETURNING *
    `;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async rotateHostToken(id: string, hostTokenHash: string) {
    await this.ready();
    const rows = await this.sql`
      UPDATE events
      SET host_token_hash = ${hostTokenHash}
      WHERE id = ${id}::uuid
      RETURNING *
    `;
    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async insertParticipant(participant: ParticipantRecord) {
    await this.ready();
    try {
      await this.sql`
        INSERT INTO participants (
          id, event_id, client_id, team_name, team_name_key, token_hash, step_index, phase, created_at, updated_at
        )
        VALUES (
          ${participant.id}::uuid,
          ${participant.eventId}::uuid,
          ${participant.clientId},
          ${participant.teamName},
          ${participant.teamNameKey},
          ${participant.tokenHash},
          ${participant.stepIndex},
          ${participant.phase},
          ${participant.createdAt}::timestamptz,
          ${participant.updatedAt}::timestamptz
        )
      `;
      return "ok" as const;
    } catch (error) {
      if (pgCode(error) !== "23505") throw error;
      const existing = await this.findParticipantByClient(participant.eventId, participant.clientId);
      return existing ? ("duplicate_client" as const) : ("duplicate_name" as const);
    }
  }

  async findParticipantByClient(eventId: string, clientId: string) {
    await this.ready();
    const rows = await this.sql`
      SELECT * FROM participants WHERE event_id = ${eventId}::uuid AND client_id = ${clientId} LIMIT 1
    `;
    return rows[0] ? mapParticipant(rows[0]) : null;
  }

  async findParticipantByTokenHash(hash: string) {
    await this.ready();
    const rows = await this.sql`SELECT * FROM participants WHERE token_hash = ${hash} LIMIT 1`;
    return rows[0] ? mapParticipant(rows[0]) : null;
  }

  async findParticipantById(id: string) {
    await this.ready();
    const rows = await this.sql`SELECT * FROM participants WHERE id = ${id}::uuid LIMIT 1`;
    return rows[0] ? mapParticipant(rows[0]) : null;
  }

  async listParticipants(eventId: string) {
    await this.ready();
    const rows = await this.sql`
      SELECT * FROM participants WHERE event_id = ${eventId}::uuid ORDER BY created_at ASC, id ASC
    `;
    return rows.map(mapParticipant);
  }

  async nameTaken(eventId: string, key: string, exceptId?: string) {
    await this.ready();
    const rows = exceptId
      ? await this.sql`
          SELECT id FROM participants
          WHERE event_id = ${eventId}::uuid AND team_name_key = ${key} AND id <> ${exceptId}::uuid
          LIMIT 1
        `
      : await this.sql`
          SELECT id FROM participants
          WHERE event_id = ${eventId}::uuid AND team_name_key = ${key}
          LIMIT 1
        `;
    return rows.length > 0;
  }

  async setTeamName(id: string, name: string, key: string, updatedAt: string) {
    await this.ready();
    const current = await this.findParticipantById(id);
    if (!current) return null;
    if (await this.nameTaken(current.eventId, key, id)) return "duplicate_name" as const;
    try {
      const rows = await this.sql`
        UPDATE participants
        SET team_name = ${name}, team_name_key = ${key}, updated_at = ${updatedAt}::timestamptz
        WHERE id = ${id}::uuid
        RETURNING *
      `;
      return rows[0] ? mapParticipant(rows[0]) : null;
    } catch (error) {
      if (pgCode(error) === "23505") return "duplicate_name" as const;
      throw error;
    }
  }

  async setProgress(id: string, progress: { stepIndex: number; phase: Phase; updatedAt: string }) {
    await this.ready();
    const rows = await this.sql`
      UPDATE participants AS participant
      SET step_index = ${progress.stepIndex}, phase = ${progress.phase}, updated_at = ${progress.updatedAt}::timestamptz
      FROM events
      WHERE participant.id = ${id}::uuid
        AND events.id = participant.event_id
        AND events.status = 'started'
      RETURNING participant.id, participant.event_id, participant.client_id, participant.team_name,
        participant.team_name_key, participant.token_hash, participant.step_index, participant.phase,
        participant.created_at, participant.updated_at
    `;
    return rows[0] ? mapParticipant(rows[0]) : null;
  }

  async removeParticipant(id: string) {
    await this.ready();
    const rows = await this.sql`DELETE FROM participants WHERE id = ${id}::uuid RETURNING id`;
    return rows.length > 0;
  }

  async deleteEvent(id: string) {
    await this.ready();
    await this.sql`DELETE FROM participants WHERE event_id = ${id}::uuid`;
    await this.sql`DELETE FROM events WHERE id = ${id}::uuid`;
  }
}

async function ensureSchema(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id uuid PRIMARY KEY,
      code text NOT NULL UNIQUE,
      status text NOT NULL CHECK (status IN ('lobby', 'started', 'ended')),
      host_token_hash text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL,
      started_at timestamptz,
      ended_at timestamptz
    )
  `;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS access_code_hash text`;
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id uuid PRIMARY KEY,
      event_id uuid NOT NULL REFERENCES events(id),
      client_id text NOT NULL,
      team_name text,
      team_name_key text,
      token_hash text NOT NULL UNIQUE,
      step_index integer NOT NULL,
      phase text NOT NULL CHECK (phase IN ('intro', 'playing', 'done')),
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      UNIQUE (event_id, client_id)
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS participants_event_name_key
    ON participants (event_id, team_name_key)
    WHERE team_name_key IS NOT NULL
  `;
}

function mapEvent(row: Record<string, unknown>): EventRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    status: String(row.status) as EventStatus,
    hostTokenHash: String(row.host_token_hash),
    accessCodeHash: row.access_code_hash == null ? null : String(row.access_code_hash),
    createdAt: iso(row.created_at),
    expiresAt: iso(row.expires_at),
    startedAt: isoOrNull(row.started_at),
    endedAt: isoOrNull(row.ended_at),
  };
}

function mapParticipant(row: Record<string, unknown>): ParticipantRecord {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    clientId: String(row.client_id),
    teamName: row.team_name == null ? null : String(row.team_name),
    teamNameKey: row.team_name_key == null ? null : String(row.team_name_key),
    tokenHash: String(row.token_hash),
    stepIndex: Number(row.step_index),
    phase: String(row.phase) as Phase,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function isoOrNull(value: unknown) {
  if (value == null) return null;
  return iso(value);
}

function pgCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) return String(error.code);
  return "";
}
