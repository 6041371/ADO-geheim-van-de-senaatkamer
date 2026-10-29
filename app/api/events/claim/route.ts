import { flowResponse, HOST_COOKIE, jsonWithCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: unknown; code?: unknown };
    const result = await getService().claim(String(body.pin ?? ""), String(body.code ?? ""));
    return jsonWithCookie({ code: result.event.code, rows: result.rows }, HOST_COOKIE, result.hostToken);
  } catch (error) {
    return flowResponse(error);
  }
}
