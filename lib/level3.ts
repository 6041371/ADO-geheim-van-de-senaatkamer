import type { HintSet } from "./level1";
import type { Phase } from "./events/types";

/** Server steps: 0–2 d1, 3–5 d2, 6 d3 done, 7 d4 done, 8 d5 done */
export const DOSSIER3_STEP = 6;
export const DOSSIER4_STEP = 7;
export const DOSSIER5_STEP = 8;
export const GAME_LAST_STEP = DOSSIER5_STEP;

export const DONE_MILESTONES = [2, 5, DOSSIER3_STEP, DOSSIER4_STEP, DOSSIER5_STEP] as const;

export function dossier3Complete(_phase: Phase, step: number) {
  return step >= DOSSIER3_STEP;
}

export function dossier4Complete(_phase: Phase, step: number) {
  return step >= DOSSIER4_STEP;
}

export function dossier5Complete(_phase: Phase, step: number) {
  return step >= DOSSIER5_STEP;
}

export const DOSSIER3_HINTS: Record<7 | 8 | 9, HintSet> = {
  7: {
    props: "Pak de conceptpersverklaring en vergelijk die met de sleutelwoorden uit de persconferentie.",
    hint1: "Alleen algemene toekomstplannen mochten openbaar. Financiële en technische details bleven intern.",
    hint2: "De drie sleutelwoorden horen bij de openbare boodschap, niet bij het vertrouwelijke dossier.",
  },
  8: {
    props: "Pak de interne memo (communicatieprotocol) en het Haags Dagblad.",
    hint1: "Vergelijk wat intern was afgesproken met wat al in de krant stond.",
    hint2: "Het embargo betekent: geen externe publicatie vóór een definitief besluit.",
  },
  9: {
    props: "Pak het Haags Dagblad en de conceptpersverklaring.",
    hint1: "Het artikel bevat details die niet in de goedgekeurde persverklaring stonden.",
    hint2: "Die details komen uit het vertrouwelijke stadiondossier.",
  },
};

export const PRESS_KEYWORDS = [
  { id: "locatie", label: "Locatie" },
  { id: "akkoord", label: "Akkoord" },
  { id: "stabiliteit", label: "Stabiliteit" },
] as const;

export const PROTOCOL_CHOICES = [
  {
    id: "embargo",
    label: "Vertrouwelijke informatie mocht niet extern worden gedeeld voordat een definitief besluit was genomen.",
  },
  {
    id: "altijd",
    label: "Alle stadioninformatie mocht meteen naar de pers zodra de vergadering begon.",
  },
  {
    id: "supporters",
    label: "Supporters mochten de conceptplannen zelf verspreiden.",
  },
  {
    id: "technisch",
    label: "Technische details moesten juist als eerste openbaar gemaakt worden.",
  },
] as const;

export const PROTOCOL_CORRECT = "embargo";

export const LEAK_CHOICES = [
  { id: "dossier", label: "Uit het vertrouwelijke stadiondossier." },
  { id: "pers", label: "Uit de goedgekeurde persverklaring." },
  { id: "fans", label: "Uit een supportersbericht." },
] as const;

export const LEAK_CORRECT = "dossier";
