import { normalizeAnswer } from "./level1";
import type { Phase } from "./events/types";
import type { HintSet } from "./level1";

export const DOSSIER2_LAST_STEP = 5;

export const DOSSIER2_HINTS: Record<4 | 5 | 6, HintSet> = {
  4: {
    props: "Pak het fysieke stadiondossier en bekijk de voorpagina.",
    hint1: "Vergelijk de titels en dossiernummers. Controleer ook de datum, de versie en de inhoudsopgave.",
    hint2: "Het juiste dossier bevat vijf onderdelen, waaronder locatieopties, financiële onderbouwing en risicoanalyse.",
  },
  5: {
    props: "Gebruik het stadiondossier en de transcriptie van de bestuursvergadering.",
    hint1: "Niet iedereen binnen het bestuur hield zich bezig met dezelfde onderwerpen.",
    hint2: "De technisch adviseur presenteerde tijdens de vergadering informatie over de verschillende locatieopties.",
  },
  6: {
    props: "Pak het stadiondossier, de notulen en de conceptpersverklaring.",
    hint1: "Vergelijk de informatie die intern besproken werd met de informatie die officieel gedeeld mocht worden.",
    hint2: "Zoek naar informatie die in het interne dossier staat, maar bewust ontbreekt in de goedgekeurde persinformatie.",
  },
};

export const DOSSIER2_EVIDENCE = [
  {
    id: 4,
    title: "Vertrouwelijk stadiondossier",
    text: "Het stadiondossier met referentie SD-2023-10 is geïdentificeerd als een vertrouwelijk intern document.",
  },
  {
    id: 5,
    title: "Technische betrokkenheid",
    text: "Tom Albers was als technisch adviseur rechtstreeks betrokken bij de technische stadionplannen.",
  },
  {
    id: 6,
    title: "Niet-openbare informatie",
    text: "De interne stadiondocumenten bevatten informatie die niet zonder goedkeuring openbaar gemaakt mocht worden.",
  },
] as const;

export const FOLDERS = [
  {
    id: "a",
    title: "Projectontwikkeling",
    tone: "beige",
    number: "PO-2023-07",
    date: "2 september 2023",
    status: "Concept",
    author: "Directie & Projectteam",
    points: ["Visie en uitgangspunten.", "Mogelijke ontwikkelingsrichtingen.", "Algemene toekomstscenario's.", "Voorbereidende gesprekken met betrokken partijen."],
    note: "De plannen bevinden zich in een verkennende fase en bevatten nog geen definitieve technische uitwerking of volledige financiële onderbouwing.",
  },
  {
    id: "b",
    title: "Strategische ontwikkelingen",
    tone: "green",
    number: "SD-2023-10",
    date: "12 oktober 2023",
    status: "Vertrouwelijk – Intern gebruik",
    version: "3.2 (concept)",
    author: "Directie & Technisch Advies",
    points: ["Locatieopties.", "Financiële onderbouwing.", "Risicoanalyse.", "Planning en fasering.", "Stakeholders en partners."],
    note: "Het dossier bevat informatie die bedoeld is voor interne beoordeling en verdere besluitvorming.",
  },
  {
    id: "c",
    title: "Bestuurlijke communicatie",
    tone: "wine",
    number: "COM-2023-08",
    date: "5 oktober 2023",
    status: "Intern concept – Ter beoordeling",
    author: "Communicatieafdeling",
    points: ["Kernboodschappen.", "Interne en externe communicatie.", "Voorbereiding van een persmoment.", "Afstemming met betrokken partijen.", "Onderwerpen die wel of niet gedeeld kunnen worden."],
    note: "Het document is opgesteld om de communicatie rondom de plannen zorgvuldig voor te bereiden.",
  },
] as const;

export const STAFF = [
  { id: "marcel", name: "Marcel de Vries", role: "Voorzitter", zone: "bestuur", duties: ["Bestuurlijke besluitvorming.", "Algemene leiding.", "Coördinatie van de vergadering."] },
  { id: "karin", name: "Karin Bos", role: "Financiën", zone: "financien", duties: ["Financiële haalbaarheid.", "Investeringsramingen.", "Financiële risico's."] },
  { id: "tom", name: "Tom Albers", role: "Technisch adviseur", zone: "techniek", duties: ["Technische stadionontwikkeling.", "Locatieonderzoek.", "Technische haalbaarheid."] },
  { id: "sophie", name: "Sophie van Rijn", role: "Communicatie", zone: "communicatie", duties: ["Communicatiestrategie.", "Persvoorbereiding.", "Externe berichtgeving."] },
] as const;

export const ZONES = [
  { id: "bestuur", label: "Bestuur" },
  { id: "financien", label: "Financiën" },
  { id: "techniek", label: "Techniek" },
  { id: "communicatie", label: "Communicatie" },
] as const;

export const STRIPS = [
  { id: "toekomst", label: "Algemene toekomstplannen" },
  { id: "locatie", label: "Locatieopties" },
  { id: "financieel", label: "Financiële onderbouwing" },
  { id: "technisch", label: "Technische uitwerking" },
  { id: "communicatie", label: "Algemene communicatieboodschap" },
  { id: "risico", label: "Risicoanalyse" },
] as const;

const CONFIDENTIAL_STRIPS = ["financieel", "technisch", "risico"] as const;

export function folderIsConfidential(id: string) {
  return id === "b";
}

export function rolesMatch(placed: Readonly<Record<string, string | null>>) {
  return STAFF.every((person) => placed[person.zone] === person.id);
}

export function personIsTechnical(id: string) {
  return id === "tom";
}

export function stripsAreConfidential(ids: readonly string[]) {
  if (ids.length !== CONFIDENTIAL_STRIPS.length) return false;
  return CONFIDENTIAL_STRIPS.every((id) => ids.includes(id));
}

export function isHiddenConclusion(value: string) {
  const text = normalizeAnswer(value);
  if (text.length < 12) return false;
  return /financ/.test(text) && /technisch/.test(text);
}

export function dossier1Complete(phase: Phase, step: number) {
  return phase === "done" || (phase === "playing" && step >= 3);
}

export function dossier2DoneCount(phase: Phase, step: number) {
  if (phase === "done" && step >= DOSSIER2_LAST_STEP) return 3;
  if (phase === "playing" && step >= 3) return Math.min(3, step - 2);
  return 0;
}

export function dossier2Complete(phase: Phase, step: number) {
  return dossier2DoneCount(phase, step) >= 3;
}
