import { flowResponse, HOST_COOKIE, json, readCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function GET() {
  try {
    const token = await readCookie(HOST_COOKIE);
    if (!token) return json({ error: "Dit scherm mag het evenement niet bedienen.", code: "unauthorized" }, 401);
    const snapshot = await getService().hostSnapshot(token);
    return json({ rows: snapshot.rows });
  } catch (error) {
    return flowResponse(error);
  }
}
