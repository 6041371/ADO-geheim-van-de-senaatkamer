import { flowResponse, json, readCookie, TEAM_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST() {
  try {
    const token = await readCookie(TEAM_COOKIE);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const result = await getService().replay(token);
    return json({ row: result.row });
  } catch (error) {
    return flowResponse(error);
  }
}
