import { flowResponse, HOST_COOKIE, json, writeCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: unknown; code?: unknown };
    const result = await getService().claim(String(body.pin ?? ""), String(body.code ?? ""));
    await writeCookie(HOST_COOKIE, result.hostToken);
    return json({ code: result.event.code, rows: result.rows });
  } catch (error) {
    return flowResponse(error);
  }
}
