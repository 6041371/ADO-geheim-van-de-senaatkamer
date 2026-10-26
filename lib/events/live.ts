import "server-only";

import { createRealtime, rawSql } from "@neon/realtime/server";
import { hashToken } from "./tokens";
import type { HostRow, TeamRow } from "./types";

let realtime: ReturnType<typeof createRealtime> | null = null;

function getRealtime() {
  const secret = process.env.NEON_REALTIME_SECRET?.trim().replace(/^"|"$/g, "");
  if (!secret || !process.env.DATABASE_URL) {
    throw new Error("Realtime is niet geconfigureerd.");
  }
  if (!secret.startsWith("nrt_live_1")) {
    throw new Error("Realtime-secret heeft niet het verwachte formaat.");
  }
  realtime ??= createRealtime({
    secret,
    db: decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1)),
    debugMode: process.env.NODE_ENV === "development",
  });
  return realtime;
}

export function sealHostQuery(code: string, hostToken: string) {
  return getRealtime().seal({
    query: rawSql<HostRow>(
      `SELECT COALESCE(p.id::text, e.id::text) AS id, e.code, e.status, e.started_at, e.expires_at,
              p.team_name, p.step_index, p.phase, p.created_at AS joined_at
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.code = $1 AND e.host_token_hash = $2`,
      [code, hashToken(hostToken)],
    ),
  });
}

export function sealTeamQuery(teamToken: string) {
  return getRealtime().seal({
    query: rawSql<TeamRow>(
      `SELECT p.id::text AS id, e.code, e.status, e.started_at, p.team_name, p.step_index, p.phase
       FROM participants p
       JOIN events e ON e.id = p.event_id
       WHERE p.token_hash = $1`,
      [hashToken(teamToken)],
    ),
  });
}
