import { STEPS, type Step } from "./game";
import type { Phase } from "./events/types";

export type GameScreen = "menu" | "briefing" | "task" | "ending" | "dossier2" | "dossier2end" | "dossier3" | "walkthrough";

export type JumpTarget = {
  id: string;
  label: string;
  detail: string;
  screen: GameScreen;
  taskIndex: number;
  dossierTask: 4 | 5 | 6;
  step: number;
  phase: Phase;
  walkStep?: number;
  embargoTask?: 7 | 8 | 9;
};

function stepLabel(step: Step) {
  if (step.kind === "choice" || step.kind === "order") return step.kicker;
  if (step.kind === "sheet") return "Onderzoeksblad";
  if (step.kind === "dader") return "Wie is de dader?";
  return "Finale";
}

export function firstWalkStepForLevel(level: number) {
  const index = STEPS.findIndex((step) => step.level === level);
  return index < 0 ? 0 : index;
}

export const PHASE1_JUMPS: JumpTarget[] = [
  { id: "d1-1", label: "Dossier 01 · 1", detail: "Wie was aanwezig?", screen: "task", taskIndex: 0, dossierTask: 4, step: 0, phase: "playing" },
  { id: "d1-2", label: "Dossier 01 · 2", detail: "Ontbrekende notulen", screen: "task", taskIndex: 1, dossierTask: 4, step: 1, phase: "playing" },
  { id: "d1-3", label: "Dossier 01 · 3", detail: "Verborgen tijdcode", screen: "task", taskIndex: 2, dossierTask: 4, step: 2, phase: "playing" },
  { id: "d1-end", label: "Dossier 01 · eind", detail: "Overzicht bewijs", screen: "ending", taskIndex: 2, dossierTask: 4, step: 2, phase: "done" },
  { id: "d2-4", label: "Dossier 02 · 4", detail: "Vergelijk documenten", screen: "dossier2", taskIndex: 2, dossierTask: 4, step: 2, phase: "done" },
  { id: "d2-5", label: "Dossier 02 · 5", detail: "Toegangsarchief", screen: "dossier2", taskIndex: 2, dossierTask: 5, step: 3, phase: "playing" },
  { id: "d2-6", label: "Dossier 02 · 6", detail: "Ontbrekende document", screen: "dossier2", taskIndex: 2, dossierTask: 6, step: 4, phase: "playing" },
  { id: "d2-end", label: "Dossier 02 · eind", detail: "Dossier gesloten", screen: "dossier2end", taskIndex: 2, dossierTask: 6, step: 5, phase: "done" },
  { id: "d3-7", label: "Dossier 03 · 7", detail: "Persconferentie", screen: "dossier3", taskIndex: 2, dossierTask: 6, step: 5, phase: "done", embargoTask: 7 },
  { id: "d3-8", label: "Dossier 03 · 8", detail: "Communicatieprotocol", screen: "dossier3", taskIndex: 2, dossierTask: 6, step: 5, phase: "done", embargoTask: 8 },
  { id: "d3-9", label: "Dossier 03 · 9", detail: "Wat werd gelekt?", screen: "dossier3", taskIndex: 2, dossierTask: 6, step: 5, phase: "done", embargoTask: 9 },
];

export const WALK_JUMPS: JumpTarget[] = STEPS.filter((step) => step.level >= 4).map((step) => {
  const index = STEPS.findIndex((item) => item.id === step.id);
  return {
    id: `w-${step.id}`,
    label: `D0${step.level} · ${stepLabel(step)}`,
    detail: step.levelName,
    screen: "walkthrough" as const,
    taskIndex: 2,
    dossierTask: 6 as const,
    step: 5,
    phase: "done" as const,
    walkStep: index,
  };
});

export const ALL_JUMPS: JumpTarget[] = [...PHASE1_JUMPS, ...WALK_JUMPS];
