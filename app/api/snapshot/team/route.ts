import { flowResponse, json, readCookie, TEAM_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function GET() {
  try {
    const token = await readCookie(TEAM_COOKIE);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const snapshot = await getService().teamSnapshot(token);
    return json({ row: snapshot.row });
  } catch (error) {
    return flowResponse(error);
  }
}