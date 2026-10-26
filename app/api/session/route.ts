import { clearCookie, flowResponse, HOST_COOKIE, json, readCookie, TEAM_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";
import { FlowError } from "@/lib/events/types";

export async function GET() {
  try {
    const service = getService();
    const hostToken = await readCookie(HOST_COOKIE);
    const teamToken = await readCookie(TEAM_COOKIE);
    const host = hostToken ? await readHost(service, hostToken) : null;
    const team = teamToken ? await readTeam(service, teamToken) : null;
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
    if (error instanceof FlowError && error.status === 401) await clearCookie(HOST_COOKIE);
    else throw error;
    return null;
  }
}

async function readTeam(service: ReturnType<typeof getService>, token: string) {
  try {
    const snapshot = await service.teamSnapshot(token);
    return { row: snapshot.row };
  } catch (error) {
    if (error instanceof FlowError && error.status === 401) await clearCookie(TEAM_COOKIE);
    else throw error;
    return null;
  }
}
