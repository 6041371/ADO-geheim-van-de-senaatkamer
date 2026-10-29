import { flowResponse, json, readTeamToken } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const token = await readTeamToken(request);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const result = await getService().replay(token);
    return json({ row: result.row });
  } catch (error) {
    return flowResponse(error);
  }
}
