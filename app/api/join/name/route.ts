import { flowResponse, json, readTeamToken } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const token = await readTeamToken(request);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const body = (await request.json()) as { teamName?: unknown };
    const result = await getService().setName(token, String(body.teamName ?? ""));
    return json({ row: result.row });
  } catch (error) {
    return flowResponse(error);
  }
}
