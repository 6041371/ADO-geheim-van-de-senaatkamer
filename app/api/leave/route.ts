import { clearCookie, json, TEAM_COOKIE } from "@/lib/events/http";

export async function POST() {
  await clearCookie(TEAM_COOKIE);
  return json({ ok: true });
}
