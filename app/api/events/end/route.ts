import { flowResponse, HOST_COOKIE, json, readCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST() {
  try {
    const token = await readCookie(HOST_COOKIE);
    if (!token) return json({ error: "Dit scherm mag het evenement niet bedienen.", code: "unauthorized" }, 401);
    const result = await getService().end(token);
    return json({ code: result.event.code, status: result.event.status, rows: result.rows });
  } catch (error) {
    return flowResponse(error);
  }
}
