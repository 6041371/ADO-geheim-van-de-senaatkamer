import { flowResponse, json, TEAM_COOKIE, writeCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: unknown; clientId?: unknown };
    const result = await getService().join(String(body.code ?? ""), String(body.clientId ?? ""));
    await writeCookie(TEAM_COOKIE, result.token);
    return json({ created: result.created, row: result.row });
  } catch (error) {
    return flowResponse(error);
  }
}
