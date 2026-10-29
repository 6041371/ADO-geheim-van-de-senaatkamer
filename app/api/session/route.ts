import { flowResponse, HOST_COOKIE, json, jsonClearCookie, readCookie, TEAM_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";
import { FlowError } from "@/lib/events/types";

export async function GET() {
  try {
    const service = getService();
    const hostToken = await readCookie(HOST_COOKIE);
    const teamToken = await readCookie(TEAM_COOKIE);
    const host = hostToken ? await readHost(service, hostToken) : null;
    const team = teamToken ? await readTeam(service, teamToken) : null;

    if (hostToken && !host && teamToken && !team) {
      const cleared = jsonClearCookie({ host: null, team: null }, HOST_COOKIE);
      cleared.cookies.set(TEAM_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
      return cleared;
    }
    if (hostToken && !host) return jsonClearCookie({ host: null, team }, HOST_COOKIE);
    if (teamToken && !team) return jsonClearCookie({ host, team: null }, TEAM_COOKIE);

    return json({ host, team });
  } catch (error) {
    return flowResponse(error);
  }
}

async function readHost(service: ReturnType<typeof getService>, token: string) {
  try {
    const snapshot = await service.hostSnapshot(token);
    return { code: snapshot.event.code, rows: snapshot.rows };
  } catch (error) {
    if (error instanceof FlowError && error.status === 401) return null;
    throw error;
  }
}

async function readTeam(service: ReturnType<typeof getService>, token: string) {
  try {
    const snapshot = await service.teamSnapshot(token);
    return { row: snapshot.row };
  } catch (error) {
    if (error instanceof FlowError && error.status === 401) return null;
    throw error;
  }
}
