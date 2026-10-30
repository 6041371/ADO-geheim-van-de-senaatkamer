"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LEAK_CORRECT,
  MEMORY_SECONDS,
  PROTOCOL_CHOICES,
  PROTOCOL_CORRECT,
  buildMemoryDeck,
  type MemoryCard,
} from "@/lib/level3";
import { shuffle } from "@/lib/shuffle";
import { PressConference } from "./PressConference";
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
    return <PressConference onBack={onMenu} onNext={() => setTask(8)} />;
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
            Het bericht bevat details die niet in de goedgekeurde persverklaring stonden. Clubwoordvoerders wilden nog
            niet reageren.
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
            Informatie moest intern blijven tot een definitief besluit. Het nieuwsbericht roept vragen op: om te
            bewijzen dat het embargo is geschonden, is meer nodig.
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
                  Vertrouwelijke informatie mag niet extern worden gedeeld voordat een definitief besluit is genomen.
                  Externe vragen lopen via de woordvoerder.
                </p>
                <p>
                  Tot die tijd blijft het stadiondossier uitsluitend beschikbaar voor bestuursleden en de aangewezen
                  communicatiecoördinator.
                </p>
              </>
            ) : (
              <>
                <p className="d3-news-mast">
                  <strong>Haags Dagblad</strong>
                </p>
                <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
                <p>
                  Het artikel verscheen vóór de officiële vrijgave en bevat details uit het vertrouwelijke dossier:
                  locatieopties, technische keuzes en passages die in de conceptpersverklaring nog zwartgelakt stonden.
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
  const [deck, setDeck] = useState<MemoryCard[]>(() => buildMemoryDeck());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [seconds, setSeconds] = useState(MEMORY_SECONDS);
  const [running, setRunning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [won, setWon] = useState(false);

  const done = matched.length === deck.length;

  useEffect(() => {
    if (!running || won || timedOut) return;
    if (seconds <= 0) {
      setTimedOut(true);
      setRunning(false);
      playDenied();
      return;
    }
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [running, seconds, won, timedOut]);

  useEffect(() => {
    if (!done || won) return;
    setWon(true);
    setRunning(false);
    playCorrect();
  }, [done, won]);

  function restart() {
    setDeck(buildMemoryDeck());
    setFlipped([]);
    setMatched([]);
    setLock(false);
    setSeconds(MEMORY_SECONDS);
    setTimedOut(false);
    setWon(false);
    setRunning(true);
  }

  function flip(card: MemoryCard) {
    if (!running || lock || timedOut || won) return;
    if (flipped.includes(card.id) || matched.includes(card.id)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;

    const [firstId, secondId] = next;
    const first = deck.find((item) => item.id === firstId);
    const second = deck.find((item) => item.id === secondId);
    if (!first || !second) return;

    setLock(true);
    if (first.pairId === second.pairId) {
      window.setTimeout(() => {
        setMatched((current) => [...current, firstId, secondId]);
        setFlipped([]);
        setLock(false);
        playCorrect();
      }, 320);
      return;
    }

    window.setTimeout(() => {
      setFlipped([]);
      setLock(false);
      playDenied();
    }, 700);
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 9" title="Wat werd er gelekt?" step={2} onBack={onBack} />
      <p className="mg-note">
        Memory: koppel elk gelekt detail aan de juiste bron. Zo bewijs je dat de informatie uit het vertrouwelijke
        stadiondossier kwam — niet uit de goedgekeurde persverklaring.
      </p>

      <div className={`d3-timer ${seconds <= 10 && running ? "is-low" : ""} ${timedOut ? "is-out" : ""}`}>
        <span>Countdown</span>
        <strong>{timedOut ? "00:00" : clock}</strong>
      </div>

      {!running && !won && !timedOut ? (
        <button className="mg-yellow mg-cta" type="button" onClick={() => setRunning(true)}>
          Start memory (60 seconden)
        </button>
      ) : null}

      <div className="d3-memory" aria-label="Memorykaarten">
        {deck.map((card) => {
          const open = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={`d3-mem-card ${open ? "is-open" : ""} ${matched.includes(card.id) ? "is-matched" : ""}`}
              onClick={() => flip(card)}
              disabled={!running || timedOut || won || lock}
            >
              <span className="d3-mem-back">ADO</span>
              <span className="d3-mem-front">{card.label}</span>
            </button>
          );
        })}
      </div>

      {timedOut && !won ? (
        <div className="mg-bad">
          <strong>Tijd voorbij</strong>
          <p>De 60 seconden zijn om. Probeer opnieuw om de gelekte details te koppelen.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={restart}>
            Opnieuw (60s)
          </button>
        </div>
      ) : null}

      {won ? (
        <div className="mg-success">
          <p className="mg-kicker">
            Lek bewezen · bron: {LEAK_CORRECT === "dossier" ? "vertrouwelijk dossier" : LEAK_CORRECT}
          </p>
          <p>
            De gelekte details horen bij het vertrouwelijke stadiondossier en stonden niet in de goedgekeurde
            persverklaring. Het embargo is geschonden. Open dossier 04: Het lek.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Terug naar dossiers
          </button>
        </div>
      ) : null}
    </section>
  );
}
