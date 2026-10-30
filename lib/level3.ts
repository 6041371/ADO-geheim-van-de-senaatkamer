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
    props: "Tik op journalisten die de hand opsteken. Kies per vraag: geschikt voor publicatie of alleen intern.",
    hint1: "Algemene toekomstplannen mogen openbaar. Financiële en technische details blijven intern.",
    hint2: "Na zes vragen vul je AKKOORD, STABILITEIT en LOCATIE in de conceptpersverklaring.",
  },
  8: {
    props: "Pak de interne memo (communicatieprotocol) en het Haags Dagblad.",
    hint1: "Vergelijk wat intern was afgesproken met wat al in de krant stond.",
    hint2: "Het embargo betekent: geen externe publicatie vóór een definitief besluit.",
  },
  9: {
    props: "Pak het Haags Dagblad en de conceptpersverklaring. Speel daarna de memory binnen 60 seconden.",
    hint1: "Koppel elk gelekt detail aan waar het thuishoort: intern dossier of te vroege publicatie.",
    hint2: "Financiën, techniek en locatieopties stonden niet in de goedgekeurde persverklaring.",
  },
};

export const PRESS_KEYWORDS = [
  { id: "akkoord", label: "AKKOORD" },
  { id: "stabiliteit", label: "STABILITEIT" },
  { id: "locatie", label: "LOCATIE" },
] as const;

export type PressVerdict = "publicatie" | "intern";

export type PressJournalist = {
  id: string;
  outlet: string;
  name: string;
  /** Hotspot op de perszaalfoto, percentages van breedte/hoogte. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Waar de tekstballon boven de hotspot hangt. */
  bubbleSide: "left" | "right" | "center";
};

/** Zes journalisten in de ADO-perszaal (klikbare hotspots). */
export const PRESS_JOURNALISTS: PressJournalist[] = [
  {
    id: "lisa",
    outlet: "Haags Dagblad",
    name: "Lisa Vermeer",
    x: 30,
    y: 34,
    w: 18,
    h: 36,
    bubbleSide: "center",
  },
  {
    id: "mark",
    outlet: "Omroep West",
    name: "Mark de Boer",
    x: 12,
    y: 42,
    w: 16,
    h: 30,
    bubbleSide: "right",
  },
  {
    id: "sander",
    outlet: "AD Sportwereld",
    name: "Sander Kuiper",
    x: 52,
    y: 40,
    w: 16,
    h: 30,
    bubbleSide: "left",
  },
  {
    id: "noor",
    outlet: "Den Haag FM",
    name: "Noor Hassani",
    x: 22,
    y: 26,
    w: 14,
    h: 24,
    bubbleSide: "right",
  },
  {
    id: "tim",
    outlet: "Voetbal International",
    name: "Tim Janssen",
    x: 68,
    y: 28,
    w: 14,
    h: 26,
    bubbleSide: "left",
  },
  {
    id: "eva",
    outlet: "NOS",
    name: "Eva Bergkamp",
    x: 46,
    y: 22,
    w: 13,
    h: 22,
    bubbleSide: "center",
  },
];

/**
 * Publicatiecheck: beoordeel of het antwoord/onderwerp openbaar mag.
 * correct = "publicatie" | "intern"
 */
export const PRESS_QUESTIONS = [
  {
    id: "q1",
    journalistId: "lisa",
    prompt: "Kunnen jullie vandaag al de exacte financiële ramingen voor het stadion vrijgeven?",
    correct: "intern" as PressVerdict,
    keywordId: null,
    feedbackOk: "Juist. Financiële ramingen blijven achter de zwarte strepen — alleen intern.",
    feedbackBad: "Fout. Exacte ramingen horen niet in de openbare verklaring.",
  },
  {
    id: "q2",
    journalistId: "mark",
    prompt: "ADO werkt aan de toekomst van de club en het stadion. Mag die algemene boodschap naar buiten?",
    correct: "publicatie" as PressVerdict,
    keywordId: "locatie" as const,
    feedbackOk: "Juist. Algemene toekomstplannen mogen. Sleutelwoord vastgelegd: LOCATIE.",
    feedbackBad: "Fout. De algemene toekomstboodschap is juist geschikt voor publicatie.",
  },
  {
    id: "q3",
    journalistId: "sander",
    prompt: "Mogen we de technische specificaties en constructiedetails al opnemen in ons artikel?",
    correct: "intern" as PressVerdict,
    keywordId: null,
    feedbackOk: "Juist. Technische details blijven vertrouwelijk tot een bestuursbesluit.",
    feedbackBad: "Fout. Technische details zijn embargo — alleen intern.",
  },
  {
    id: "q4",
    journalistId: "noor",
    prompt: "Jullie zoeken overeenstemming met partners over het proces. Mag het woord ‘akkoord’ in die zin openbaar?",
    correct: "publicatie" as PressVerdict,
    keywordId: "akkoord" as const,
    feedbackOk: "Juist. Het proceswoord AKKOORD mag in de openbare lijn. Sleutelwoord vastgelegd.",
    feedbackBad: "Fout. ‘Akkoord’ als procesboodschap mag wél openbaar.",
  },
  {
    id: "q5",
    journalistId: "tim",
    prompt: "Mag ADO benadrukken dat de club inzet op stabiliteit richting supporters en stad?",
    correct: "publicatie" as PressVerdict,
    keywordId: "stabiliteit" as const,
    feedbackOk: "Juist. STABILITEIT is onderdeel van de goedgekeurde boodschap.",
    feedbackBad: "Fout. Stabiliteit mag juist naar buiten als openbare lijn.",
  },
  {
    id: "q6",
    journalistId: "eva",
    prompt: "Kunnen jullie al concrete interne locatieopties en scenario’s uit het dossier delen?",
    correct: "intern" as PressVerdict,
    keywordId: null,
    feedbackOk: "Juist. Concrete opties uit het dossier blijven intern tot vrijgave.",
    feedbackBad: "Fout. Concrete locatieopties uit het dossier zijn nog niet voor publicatie.",
  },
] as const;

export const PRESS_GAPS = [
  { id: "gap-1", correctId: "akkoord", hint: "proces met partners" },
  { id: "gap-2", correctId: "stabiliteit", hint: "lijn van de club" },
  { id: "gap-3", correctId: "locatie", hint: "toekomst van het stadion" },
] as const;

export function pressGapsRestored(placed: Record<string, string | null>) {
  return PRESS_GAPS.every((gap) => placed[gap.id] === gap.correctId);
}

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

/** Memory: koppel identieke ADO-bewijsplaatjes. 60 seconden. */
export const MEMORY_SECONDS = 60;

export const MEMORY_PAIRS = [
  { pairId: "mic", label: "Microfoon", image: "/ado/memory/mic.png" },
  { pairId: "folders", label: "Vertrouwelijk dossier", image: "/ado/memory/folders.png" },
  { pairId: "newspaper", label: "Haags Dagblad", image: "/ado/memory/newspaper.png" },
  { pairId: "map", label: "Locatie", image: "/ado/memory/map.png" },
  { pairId: "laptop", label: "Werkstation", image: "/ado/memory/laptop.png" },
  { pairId: "camera", label: "Bewakingscamera", image: "/ado/memory/camera.png" },
] as const;

export type MemoryCard = {
  id: string;
  pairId: string;
  label: string;
  image: string;
};

export function buildMemoryDeck(): MemoryCard[] {
  const cards: MemoryCard[] = MEMORY_PAIRS.flatMap((pair) => [
    { id: `${pair.pairId}-a`, pairId: pair.pairId, label: pair.label, image: pair.image },
    { id: `${pair.pairId}-b`, pairId: pair.pairId, label: pair.label, image: pair.image },
  ]);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
