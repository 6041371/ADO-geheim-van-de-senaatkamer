"use client";

import { useMemo, useState } from "react";
import {
  LEAK_CHOICES,
  LEAK_CORRECT,
  PRESS_KEYWORDS,
  PROTOCOL_CHOICES,
  PROTOCOL_CORRECT,
} from "@/lib/level3";
import { shuffle } from "@/lib/shuffle";
import { playCorrect, playDenied } from "./sounds";

type Task = 7 | 8 | 9;

export function DossierThree({
  onMenu,
  onComplete,
  startTask = 7,
}: {
  onMenu: () => void;
  onComplete: () => Promise<boolean>;
  startTask?: Task;
}) {
  const [task, setTask] = useState<Task>(startTask);

  if (task === 7) {
    return <PressTask onBack={onMenu} onNext={() => setTask(8)} />;
  }
  if (task === 8) {
    return <ProtocolTask onBack={onMenu} onNext={() => setTask(9)} />;
  }
  return (
    <LeakTask
      onBack={onMenu}
      onFinished={() => {
        void onComplete();
      }}
    />
  );
}

function Bar({
  kicker,
  title,
  step,
  onBack,
}: {
  kicker: string;
  title: string;
  step: number;
  onBack: () => void;
}) {
  return (
    <header className="mg-bar">
      <button className="mg-back" type="button" onClick={onBack} aria-label="Terug">
        ←
      </button>
      <div>
        <p className="mg-kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <div className="mg-step">
        <div className="mg-dots" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <i key={index} className={index <= step ? "is-on" : ""} />
          ))}
        </div>
        <span>
          {step + 1}/3
        </span>
      </div>
    </header>
  );
}

const PRESS_CHOICES = [
  { id: "algemeen", label: "Alleen de algemene toekomstplannen" },
  { id: "financieel", label: "De financiële ramingen" },
  { id: "technisch", label: "De technische details van het stadiondossier" },
] as const;

const PRESS_CORRECT = "algemeen";

function PressTask({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [opened, setOpened] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const options = useMemo(() => shuffle(PRESS_CHOICES), []);

  function check() {
    if (!choice) return;
    if (choice === PRESS_CORRECT) {
      setWrong(false);
      setCorrect(true);
      playCorrect();
      return;
    }
    setWrong(true);
    playDenied();
  }

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 7" title="Persconferentie" step={0} onBack={onBack} />
      <p className="mg-note">
        Bekijk de conceptpersverklaring. De zwartgelakte stukken bleven intern. Open daarna de sleutelwoorden van de persconferentie en beantwoord de publicatiecheck.
      </p>

      <article className="d3-doc d3-doc-letter">
        <div className="d3-doc-letterhead">
          <img src="/ado/logo.svg" alt="" />
          <div>
            <strong>ADO Den Haag</strong>
            <span>Afdeling Communicatie</span>
            <em>Cars Jeukenslaan 2 · Den Haag</em>
          </div>
          <b className="d3-stamp-ink">Concept</b>
        </div>
        <p className="d3-doc-ref">COM-2023-10 · bestemd voor officiële vrijgave na bestuursbesluit</p>
        <h2>Conceptpersverklaring</h2>
        <p className="d3-doc-body">
          ADO Den Haag werkt aan de toekomst van de club. Het bestuur bereidt plannen voor rondom de ontwikkeling van het stadion en de clubfaciliteiten.
        </p>
        <p className="d3-doc-body">
          In deze fase worden alleen algemene toekomstplannen gedeeld. Financiële ramingen en technische details van het stadiondossier blijven intern totdat een definitief besluit is genomen.
        </p>
        <div className="d3-redact-block" aria-label="Zwartgelakte interne passages">
          <span>Zwartgelakt · niet voor publicatie</span>
          <i />
          <i />
          <i />
        </div>
        <footer className="d3-doc-foot">
          <span>Pagina 1 van 1</span>
          <span>Alleen voor intern gebruik tot vrijgave</span>
        </footer>
      </article>

      <button className="d3-reveal" type="button" onClick={() => setOpened((value) => !value)}>
        {opened ? "Verberg sleutelwoorden" : "Toon sleutelwoorden van de persconferentie"}
      </button>

      {opened ? (
        <div className="d3-notes" role="list">
          <header>
            <p className="mg-kicker">Persconferentie · vastgelegd</p>
            <span>Notitieblok communicatie</span>
          </header>
          <div className="d3-note-chips">
            {PRESS_KEYWORDS.map((item) => (
              <span key={item.id} role="listitem">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="d3-ask">
        <p className="mg-kicker">Publicatiecheck</p>
        <p>Wat mocht volgens de afspraken openbaar worden gemaakt?</p>
        <div className="d3-choices">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className={choice === item.id ? "is-on" : ""}
              onClick={() => {
                setChoice(item.id);
                setWrong(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {wrong ? <p className="mg-bad">Klopt niet. Kijk opnieuw wat in de conceptverklaring openbaar mocht en wat zwartgelakt bleef.</p> : null}
        {!correct ? (
          <button className="mg-yellow mg-cta" type="button" disabled={!choice} onClick={check}>
            Controleer antwoord
          </button>
        ) : null}
      </div>

      {correct ? (
        <div className="mg-success">
          <p className="mg-kicker">Persconferentie afgerond</p>
          <p>
            Alleen de algemene toekomstplannen mochten openbaar. De zwarte passages in de conceptverklaring horen bij informatie die nog intern bleef.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ProtocolTask({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [zoom, setZoom] = useState<"memo" | "paper" | null>(null);
  const options = useMemo(() => shuffle(PROTOCOL_CHOICES), []);

  function check() {
    if (!choice) return;
    if (choice === PROTOCOL_CORRECT) {
      setWrong(false);
      setCorrect(true);
      playCorrect();
      return;
    }
    setWrong(true);
    playDenied();
  }

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 8" title="Communicatieprotocol" step={1} onBack={onBack} />
      <p className="mg-note">
        Vergelijk de interne memo met het nieuwsbericht. Welke communicatieregel is mogelijk overtreden?
      </p>

      <div className="d3-split">
        <article className="d3-doc d3-doc-memo">
          <div className="d3-memo-top">
            <span>ADO Den Haag · Bestuurssecretariaat</span>
            <b className="d3-stamp-ink">Vertrouwelijk</b>
          </div>
          <h3>Interne memo</h3>
          <p className="d3-doc-ref">Communicatieprotocol · 10 oktober 2023</p>
          <ol className="d3-memo-list">
            <li>
              <strong>01 · Aanleiding</strong>
              <span>Stadionplannen staan op de agenda van de bestuursvergadering.</span>
            </li>
            <li>
              <strong>02 · Besluitvorming</strong>
              <span className="d3-line-blackout" aria-hidden="true" />
            </li>
            <li>
              <strong>03 · Communicatie</strong>
              <span className="d3-line-blackout" aria-hidden="true" />
            </li>
            <li>
              <strong>04 · Vertrouwelijkheid</strong>
              <span>Alleen voor bestuursleden. Niet kopiëren of delen vóór een definitief besluit.</span>
            </li>
          </ol>
          <button className="d3-doc-link" type="button" onClick={() => setZoom("memo")}>
            Lees memo volledig
          </button>
        </article>

        <article className="d3-doc d3-doc-news">
          <header className="d3-news-mast">
            <strong>Haags Dagblad</strong>
            <span>Ochtendeditie · vóór officiële vrijgave</span>
          </header>
          <b className="d3-stamp-ink is-warn">Embargo?</b>
          <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
          <p className="d3-news-lead">
            Bronnen melden concrete locatieopties en technische keuzes die nog niet officieel zijn gedeeld.
          </p>
          <p className="d3-doc-body">
            Het bericht bevat details die niet in de goedgekeurde persverklaring stonden. Clubwoordvoerders wilden nog niet reageren.
          </p>
          <button className="d3-doc-link" type="button" onClick={() => setZoom("paper")}>
            Lees artikel volledig
          </button>
        </article>
      </div>

      <div className="d3-ask">
        <p className="mg-kicker">Welke communicatieregel is mogelijk overtreden?</p>
        <p>Bekijk de fysieke interne memo. Welke afspraak was gemaakt over het delen van informatie?</p>
        <div className="d3-choices">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className={choice === item.id ? "is-on" : ""}
              onClick={() => {
                setChoice(item.id);
                setWrong(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {wrong ? <p className="mg-bad">Klopt niet. Vergelijk de memo met wat al in de krant stond.</p> : null}
        {!correct ? (
          <button className="mg-yellow mg-cta" type="button" disabled={!choice} onClick={check}>
            Controleer antwoord
          </button>
        ) : null}
      </div>

      {correct ? (
        <div className="mg-success">
          <p className="mg-kicker">Vertrouwelijke communicatieregel gevonden</p>
          <p>
            Informatie moest intern blijven tot een definitief besluit. Het nieuwsbericht roept vragen op: om te bewijzen dat het embargo is geschonden, is meer nodig.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : null}

      {zoom ? (
        <div className="d3-zoom" role="dialog" aria-modal="true">
          <div className={`d3-zoom-sheet${zoom === "paper" ? " is-news" : ""}`}>
            {zoom === "memo" ? (
              <>
                <p className="mg-kicker">Interne memo · volledig</p>
                <h3>Communicatieprotocol</h3>
                <p>
                  Vertrouwelijke informatie mag niet extern worden gedeeld voordat een definitief besluit is genomen. Externe vragen lopen via de woordvoerder.
                </p>
                <p>
                  Tot die tijd blijft het stadiondossier uitsluitend beschikbaar voor bestuursleden en de aangewezen communicatiecoördinator.
                </p>
              </>
            ) : (
              <>
                <p className="d3-news-mast">
                  <strong>Haags Dagblad</strong>
                </p>
                <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
                <p>
                  Het artikel verscheen vóór de officiële vrijgave en bevat details uit het vertrouwelijke dossier: locatieopties, technische keuzes en passages die in de conceptpersverklaring nog zwartgelakt stonden.
                </p>
              </>
            )}
            <button className="mg-yellow mg-cta" type="button" onClick={() => setZoom(null)}>
              Sluiten
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LeakTask({ onBack, onFinished }: { onBack: () => void; onFinished: () => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const options = useMemo(() => shuffle(LEAK_CHOICES), []);

  function check() {
    if (!choice) return;
    if (choice === LEAK_CORRECT) {
      setWrong(false);
      setCorrect(true);
      playCorrect();
      return;
    }
    setWrong(true);
    playDenied();
  }

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 9" title="Wat werd er gelekt?" step={2} onBack={onBack} />
      <p className="mg-note">
        De volgende ochtend stond er een nieuwsartikel met specifieke informatie over de stadionontwikkeling. Die details stonden niet in de goedgekeurde persverklaring.
      </p>

      <article className="d3-doc d3-doc-news is-feature">
        <header className="d3-news-mast">
          <strong>Haags Dagblad</strong>
          <span>Analyse · ochtendeditie</span>
        </header>
        <b className="d3-stamp-ink is-warn">Lek?</b>
        <h3>Details wijken af van de officiële verklaring</h3>
        <p className="d3-news-lead">
          Technische en financiële informatie uit het vertrouwelijke stadiondossier bereikte de media vóór een bestuursbesluit.
        </p>
        <div className="d3-news-cols">
          <p>
            In de goedgekeurde conceptpersverklaring stonden alleen algemene toekomstplannen. De zwarte passages — ramingen, technische specificaties — bleven intern.
          </p>
          <p>
            Toch noemt dit artikel precies die onderdelen. De vraag is niet óf er iets is gelekt, maar wáár die informatie vandaan kwam.
          </p>
        </div>
        <footer className="d3-doc-foot">
          <span>Bronnen rondom de Senaatskamer</span>
          <span>Vervolg op pagina 4</span>
        </footer>
      </article>

      <div className="d3-ask">
        <p className="mg-kicker">Bron van het lek</p>
        <p>Waar kwam de gelekte informatie vandaan?</p>
        <div className="d3-choices">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className={choice === item.id ? "is-on" : ""}
              onClick={() => {
                setChoice(item.id);
                setWrong(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {wrong ? <p className="mg-bad">Het nieuws bevatte details die niet in de goedgekeurde verklaring stonden.</p> : null}
        {!correct ? (
          <button className="mg-yellow mg-cta" type="button" disabled={!choice} onClick={check}>
            Controleer antwoord
          </button>
        ) : null}
      </div>

      {correct ? (
        <div className="mg-success">
          <p className="mg-kicker">Dossier 03 afgerond</p>
          <p>
            De vertrouwelijke stadioninformatie is vóór het afgesproken moment in de media verschenen. Open dossier 04: Het lek.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Terug naar dossiers
          </button>
        </div>
      ) : null}
    </section>
  );
}
