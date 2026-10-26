import type { EventStatus, HostRow, Phase, TeamRow } from "@/lib/events/types";

export function asText(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function asHostRows(rows: readonly Record<string, unknown>[]): HostRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    status: String(row.status) as EventStatus,
    started_at: asText(row.started_at),
    expires_at: asText(row.expires_at) ?? "",
    team_name: row.team_name == null ? null : String(row.team_name),
    step_index: row.step_index == null ? null : Number(row.step_index),
    phase: row.phase == null ? null : (String(row.phase) as Phase),
    joined_at: asText(row.joined_at),
  }));
}

export function asTeamRow(row: Record<string, unknown>): TeamRow {
  return {
    id: String(row.id),
    code: String(row.code),
    status: String(row.status) as EventStatus,
    started_at: asText(row.started_at),
    team_name: row.team_name == null ? null : String(row.team_name),
    step_index: Number(row.step_index ?? 0),
    phase: String(row.phase ?? "intro") as Phase,
  };
}

export function eventFrom(rows: HostRow[]) {
  return rows[0] ?? null;
}

export function teamsFrom(rows: HostRow[]) {
  return rows
    .filter((row) => row.joined_at)
    .sort((left, right) => String(left.joined_at).localeCompare(String(right.joined_at)));
}
