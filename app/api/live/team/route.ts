import { flowResponse, json, readTeamToken } from "@/lib/events/http";
import { sealTeamQuery } from "@/lib/events/live";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const token = await readTeamToken(request);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const snapshot = await getService().teamSnapshot(token);
    const sealedQuery = await sealTeamQuery(token);
    return json({ sealedQuery, row: snapshot.row });
  } catch (error) {
    return flowResponse(error);
  }
}
