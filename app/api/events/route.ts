import { flowResponse, json, writeCookie, HOST_COOKIE } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const result = await getService().create(String(body.pin ?? ""), String(body.confirm ?? ""));
    await writeCookie(HOST_COOKIE, result.hostToken);
    return json({ code: result.event.code, rows: result.rows });
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
