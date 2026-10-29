import { flowResponse, jsonWithCookie, TEAM_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: unknown; clientId?: unknown };
    const result = await getService().join(String(body.code ?? ""), String(body.clientId ?? ""));
    return jsonWithCookie(
      { created: result.created, row: result.row, token: result.token },
      TEAM_COOKIE,
      result.token,
    );
  } catch (error) {
    return flowResponse(error);
  }
}
