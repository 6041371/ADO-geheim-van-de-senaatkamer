import type { Phase } from "./events/types";

export const PHASE1_LAST_STEP = 2;

export const LOCKED_MESSAGE = "Dit dossier is nog beveiligd. Rond eerst het vorige onderzoek af om toegang te krijgen.";
export const COMING_SOON = "Dit dossier wordt binnenkort beschikbaar gemaakt.";

export const DOSSIERS = [
  { id: 1, code: "01", title: "De vergadering begint" },
  { id: 2, code: "02", title: "Het geheime dossier" },
  { id: 3, code: "03", title: "Het embargo" },
  { id: 4, code: "04", title: "Het lek" },
  { id: 5, code: "05", title: "De waarheid" },
] as const;

export type HintSet = {
  props: string;
  hint1: string;
  hint2: string;
  hint3?: string;
};

export const HINTS: Record<"attendance" | "minutes" | "time", HintSet> = {
  attendance: {
    props: "Pak de aanwezigheidslijst en de naamkaartjes van de bestuursleden.",
    hint1: "Vergelijk de naamkaartjes op de tafel met de namen op de aanwezigheidslijst. Erik Meijer, Karin Bos en Tom Albers zitten er wel.",
    hint2: "Er ontbreken twee personen. Vijf namen horen bij die avond; drie stoelen zijn bezet.",
    hint3: "De twee ontbrekende namen zijn Marcel de Vries en Sophie van Rijn.",
  },
  minutes: {
    props: "Pak de fysieke vergaderagenda en zoek het gele kader onderaan het document.",
    hint1: "In het gele kader staan drie belangrijke woorden die betrekking hebben op de geheimhouding.",
    hint2: "Let op voor wie het document bedoeld was, wat niet mocht gebeuren en wanneer het bestuur eerst een besluit moest nemen.",
    hint3: "De afspraak gaat over bestuursleden, verspreiding en officiële besluitvorming. Zet deze begrippen in de juiste volgorde.",
  },
  time: {
    props: "Pak de vergaderagenda, de persoonlijke notities en het conceptbesluit.",
    hint1: "De geplande start op de agenda is niet de code. Zoek een tijdstip dat alleen in de notities staat.",
    hint2: "Schrijf de uren en minuten uit die notitie achter elkaar. Dat zijn vier cijfers.",
  },
};

export const EVIDENCE = [
  { id: 1, title: "Ontbrekende aanwezigen", text: "Marcel de Vries en Sophie van Rijn waren nog niet aanwezig." },
  { id: 2, title: "Vertrouwelijke afspraken", text: "De stadionplannen mochten niet zonder toestemming worden gedeeld." },
  { id: 3, title: "Tijdcode", text: "Het belangrijke tijdstip was 20:24." },
] as const;

export const NAME_CARDS = [
  { id: "marcel", name: "Marcel de Vries", role: "Voorzitter", image: "/ado/cards/marcel.png" },
  { id: "karin", name: "Karin Bos", role: "Financiën", image: "/ado/cards/karin.png" },
  { id: "tom", name: "Tom Albers", role: "Technisch adviseur", image: "/ado/cards/tom.png" },
] as const;

export const MINUTE_SLOTS = ["gat-1", "gat-2", "gat-3"] as const;

export const MINUTE_FRAGMENTS = [
  { id: "bestuursleden", label: "bestuursleden", slot: "gat-1" },
  { id: "verspreiding", label: "verspreiding", slot: "gat-2" },
  { id: "besluitvorming", label: "besluitvorming", slot: "gat-3" },
  { id: "persconferentie", label: "persconferentie", slot: null },
  { id: "rondvraag", label: "rondvraag", slot: null },
  { id: "sluiting", label: "sluiting", slot: null },
] as const;

export const TIMELINE = [
  { time: "20:17", label: "Karin Bos is afgevinkt op de aanwezigheidslijst." },
  { time: "20:18", label: "Tom Albers is afgevinkt op de aanwezigheidslijst." },
  { time: "20:19", label: "Erik Meijer is afgevinkt op de aanwezigheidslijst." },
  { time: "20:30", label: "Geplande start. Opening van de vergadering." },
  { time: "20:35", label: "Vaststellen agenda." },
  { time: "20:45", label: "Stadiondossier." },
  { time: "21:05", label: "Persconferentie." },
  { time: "21:20", label: "Rondvraag." },
  { time: "21:30", label: "Sluiting." },
] as const;

export function normalizeAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isMissingPerson(value: string) {
  const text = normalizeAnswer(value);
  const hasMarcel = text.includes("marcel") && text.includes("vries");
  const hasSophie = text.includes("sophie") && text.includes("rijn");
  return hasMarcel && hasSophie;
}

export function isConfidentialityConclusion(value: string) {
  const text = normalizeAnswer(value);
  if (text.length < 12) return false;
  const onlyBoard = /bestuursleden|bestuurslid/.test(text) && /alleen|uitsluitend|enkel|bestemd|inzien|inzage|bekijk|lezen|zien/.test(text);
  const notShared = /verspreid|deel|openbaar|public/.test(text) && /niet|geen|verboden/.test(text);
  const beforeDecision = /besluit|officieel/.test(text);
  const confidentialHold = /vertrouwelijk|geheim/.test(text) && notShared && beforeDecision;
  return (onlyBoard && notShared && beforeDecision) || confidentialHold;
}

export function isTimeCode(value: string) {
  return value.replace(/\D/g, "") === "2024";
}

export function minutesAreRestored(placed: Readonly<Record<string, string | null>>) {
  return MINUTE_SLOTS.every((slot) => MINUTE_FRAGMENTS.some((fragment) => fragment.slot === slot && fragment.id === placed[slot]));
}

export function completedTasks(phase: Phase, stepIndex: number) {
  if (phase === "done") return 3;
  if (phase !== "playing") return 0;
  return Math.max(0, Math.min(stepIndex, PHASE1_LAST_STEP));
}

export function progressLabel(phase: Phase | null, stepIndex: number | null) {
  if (!phase) return "Nog niet binnen";
  if (phase === "intro") return "Introductie";
  if (phase === "done") return (stepIndex ?? 0) >= 5 ? "Dossier 02 afgerond" : "Dossier 01 afgerond";
  if ((stepIndex ?? 0) >= 4) return "Dossier 2 · opdracht 6";
  if ((stepIndex ?? 0) >= 3) return "Dossier 2 · opdracht 5";
  const done = completedTasks("playing", stepIndex ?? 0);
  if (done <= 0) return "Dossier 1 · opdracht 1";
  if (done === 1) return "Dossier 1 · opdracht 2";
  return "Dossier 1 · opdracht 3";
}
