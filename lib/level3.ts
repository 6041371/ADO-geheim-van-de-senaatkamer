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
    props: "Beantwoord de zes persvragen. Pak daarna de conceptpersverklaring en vergelijk die met de sleutelwoorden.",
    hint1: "Alleen algemene toekomstplannen mochten openbaar. Financiële en technische details bleven intern.",
    hint2: "De drie sleutelwoorden horen bij de openbare boodschap, niet bij het vertrouwelijke dossier.",
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
  { id: "locatie", label: "Locatie" },
  { id: "akkoord", label: "Akkoord" },
  { id: "stabiliteit", label: "Stabiliteit" },
] as const;

/** Zes journalisten-vragen tijdens de officiële persconferentie. */
export const PRESS_QUESTIONS = [
  {
    id: "q1",
    journalist: "Haags Dagblad",
    prompt: "Wat mag ADO Den Haag vandaag officieel delen over het stadion?",
    choices: [
      { id: "algemeen", label: "Alleen algemene toekomstplannen" },
      { id: "financieel", label: "De volledige financiële ramingen" },
      { id: "technisch", label: "Technische details van het dossier" },
    ],
    correctId: "algemeen",
    keywordId: null,
    reveal: "De woordvoerder blijft bij de goedgekeurde lijn: alleen algemene toekomstplannen.",
  },
  {
    id: "q2",
    journalist: "Omroep West",
    prompt: "Welk sleutelwoord vat de boodschap over de plek van de club samen?",
    choices: [
      { id: "locatie", label: "Locatie" },
      { id: "verhuizing", label: "Verhuizing" },
      { id: "sloop", label: "Sloop" },
    ],
    correctId: "locatie",
    keywordId: "locatie" as const,
    reveal: "Sleutelwoord vastgelegd: Locatie.",
  },
  {
    id: "q3",
    journalist: "AD Sportwereld",
    prompt: "Wat blijft volgens het embargo bewust intern?",
    choices: [
      { id: "ramingen", label: "Financiële ramingen en technische specificaties" },
      { id: "clubnaam", label: "De clubnaam" },
      { id: "kleuren", label: "De clubkleuren" },
    ],
    correctId: "ramingen",
    keywordId: null,
    reveal: "Ramingen en techniek blijven achter de zwarte strepen tot er een besluit is.",
  },
  {
    id: "q4",
    journalist: "Den Haag FM",
    prompt: "Welk sleutelwoord hoort bij het proces met bestuur en partners?",
    choices: [
      { id: "akkoord", label: "Akkoord" },
      { id: "ruzie", label: "Ruzie" },
      { id: "staking", label: "Staking" },
    ],
    correctId: "akkoord",
    keywordId: "akkoord" as const,
    reveal: "Sleutelwoord vastgelegd: Akkoord.",
  },
  {
    id: "q5",
    journalist: "Voetbal International",
    prompt: "Welk sleutelwoord gebruiken jullie voor de lijn van de club?",
    choices: [
      { id: "stabiliteit", label: "Stabiliteit" },
      { id: "chaos", label: "Chaos" },
      { id: "crisis", label: "Crisis" },
    ],
    correctId: "stabiliteit",
    keywordId: "stabiliteit" as const,
    reveal: "Sleutelwoord vastgelegd: Stabiliteit.",
  },
  {
    id: "q6",
    journalist: "NOS",
    prompt: "Wanneer mogen technische details naar buiten?",
    choices: [
      { id: "na-besluit", label: "Pas na een definitief bestuursbesluit" },
      { id: "nu", label: "Meteen na deze persconferentie" },
      { id: "nooit", label: "Nooit, ook niet na een besluit" },
    ],
    correctId: "na-besluit",
    keywordId: null,
    reveal: "Eerst een besluit, dan pas vrijgave. De persconferentie is hiermee afgerond.",
  },
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

/** Memory: koppel gelekte details aan hun bron. 60 seconden. */
export const MEMORY_SECONDS = 60;

export const MEMORY_PAIRS = [
  {
    pairId: "finance",
    a: "Financiële ramingen",
    b: "Alleen in het interne dossier",
  },
  {
    pairId: "tech",
    a: "Technische details",
    b: "Niet in de persverklaring",
  },
  {
    pairId: "location",
    a: "Locatieopties",
    b: "Gelekt in Haags Dagblad",
  },
  {
    pairId: "embargo",
    a: "Embargo geschonden",
    b: "Vóór officiële vrijgave",
  },
] as const;

export type MemoryCard = {
  id: string;
  pairId: string;
  label: string;
};

export function buildMemoryDeck(): MemoryCard[] {
  const cards: MemoryCard[] = MEMORY_PAIRS.flatMap((pair) => [
    { id: `${pair.pairId}-a`, pairId: pair.pairId, label: pair.a },
    { id: `${pair.pairId}-b`, pairId: pair.pairId, label: pair.b },
  ]);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
