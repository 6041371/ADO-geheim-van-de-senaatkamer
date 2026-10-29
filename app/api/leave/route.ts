import { jsonClearCookie, TEAM_COOKIE } from "@/lib/events/http";

export async function POST() {
  return jsonClearCookie({ ok: true }, TEAM_COOKIE);
}
