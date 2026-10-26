import { flowResponse, HOST_COOKIE, json, readCookie } from "@/lib/events/http";
import { sealHostQuery } from "@/lib/events/live";
import { getService } from "@/lib/events/runtime";

export async function POST() {
  try {
    const token = await readCookie(HOST_COOKIE);
    if (!token) return json({ error: "Dit scherm mag het evenement niet bedienen.", code: "unauthorized" }, 401);
    const snapshot = await getService().hostSnapshot(token);
    const sealedQuery = await sealHostQuery(snapshot.event.code, token);
    return json({ sealedQuery, rows: snapshot.rows });
  } catch (error) {
    return flowResponse(error);
  }
}
