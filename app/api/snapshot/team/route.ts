import { flowResponse, json, readTeamToken } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function GET(request: Request) {
  try {
    const token = await readTeamToken(request);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const snapshot = await getService().teamSnapshot(token);
    return json({ row: snapshot.row });
  } catch (error) {
    return flowResponse(error);
  }
}
