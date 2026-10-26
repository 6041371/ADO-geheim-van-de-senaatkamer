import { flowResponse, HOST_COOKIE, json, readCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = await readCookie(HOST_COOKIE);
    if (!token) return json({ error: "Dit scherm mag het evenement niet bedienen.", code: "unauthorized" }, 401);
    const { id } = await context.params;
    const result = await getService().removeParticipant(token, id);
    return json({ rows: result.rows });
  } catch (error) {
    return flowResponse(error);
  }
}
