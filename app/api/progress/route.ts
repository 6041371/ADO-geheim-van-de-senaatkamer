import { flowResponse, json, readTeamToken } from "@/lib/events/http";
import { getService } from "@/lib/events/runtime";
import type { Phase } from "@/lib/events/types";

export async function POST(request: Request) {
  try {
    const token = await readTeamToken(request);
    if (!token) return json({ error: "Dit team is niet aangemeld.", code: "unauthorized" }, 401);
    const body = (await request.json()) as { stepIndex?: unknown; phase?: unknown };
    const phase = body.phase;
    if (phase !== "intro" && phase !== "playing" && phase !== "done") {
      return json({ error: "Die voortgang hoort niet bij dit team.", code: "invalid_status" }, 409);
    }
    const stepIndex = Number(body.stepIndex);
    if (!Number.isInteger(stepIndex)) {
      return json({ error: "Die voortgang hoort niet bij dit team.", code: "invalid_status" }, 409);
    }
    const result = await getService().progress(token, stepIndex, phase as Phase);
    return json({ row: result.row });
  } catch (error) {
    return flowResponse(error);
  }
}
