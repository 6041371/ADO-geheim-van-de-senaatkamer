import { flowResponse, HOST_COOKIE, jsonWithCookie } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const result = await getService().create(String(body.pin ?? ""), String(body.confirm ?? ""));
    return jsonWithCookie({ code: result.event.code, rows: result.rows }, HOST_COOKIE, result.hostToken);
  } catch (error) {
    return flowResponse(error);
  }
}

async function readBody(request: Request) {
  try {
    return (await request.json()) as { pin?: unknown; confirm?: unknown };
  } catch {
    return {};
  }
}
