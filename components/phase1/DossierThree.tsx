"use client";

import { useEffect, useState } from "react";
import {
  LEAK_CORRECT,
  MEMORY_SECONDS,
  PRESS_KEYWORDS,
  PROTOCOL_CHOICES,
  PROTOCOL_CORRECT,
  buildMemoryDeck,
  type MemoryCard,
} from "@/lib/level3";
import { playCorrect, playDenied } from "./sounds";

type Task = 7 | 8 | 9;

export function DossierThree({
  onMenu,
  startTask = 7,
}: {
  onMenu: () => void;
  startTask?: Task;
}) {
  const [task, setTask] = useState<Task>(startTask);

  if (task === 7) {
    return <PressTask onBack={onMenu} onNext={() => setTask(8)} />;
  }
  if (task === 8) {
    return <ProtocolTask onBack={onMenu} onNext={() => setTask(9)} />;
  }
  return <LeakTask onBack={onMenu} onFinished={onMenu} />;
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

function PressTask({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [opened, setOpened] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 7" title="Persconferentie" step={0} onBack={onBack} />
      <p className="mg-note">
        Het bestuur had een communicatiestrategie. Bekijk de conceptpersverklaring en de sleutelwoorden die tijdens de persconferentie zijn vastgelegd.
      </p>

      <article className="d3-press-doc">
        <header>
          <span>ADO Den Haag · Communicatie</span>
          <strong className="d3-stamp-red">Concept</strong>
        </header>
        <h2>Conceptpersverklaring</h2>
        <p className="d3-meta">Bestemd voor: officiële vrijgave na bestuursbesluit</p>
        <p>
          ADO Den Haag werkt aan de toekomst van de club. Het bestuur bereidt plannen voor rondom de ontwikkeling van het stadion en de clubfaciliteiten.
        </p>
        <p>
          In deze fase worden alleen algemene toekomstplannen gedeeld. Financiële ramingen en technische details van het stadiondossier blijven intern totdat een definitief besluit is genomen.
        </p>
        <p className="d3-redacted" aria-label="Zwartgemaakte passages">
          ████████ · ██████████ · █████████
        </p>
        <button className="mg-ghost" type="button" onClick={() => setOpened((value) => !value)}>
          {opened ? "Verberg sleutelwoorden" : "Toon sleutelwoorden"}
        </button>
      </article>

      {opened ? (
        <div className="d3-keys" role="list">
          {PRESS_KEYWORDS.map((item) => (
            <span key={item.id} role="listitem">
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="d3-ask">
        <p className="mg-kicker">Publicatiecheck</p>
        <p>Wat mocht volgens de afspraken openbaar worden gemaakt?</p>
        <div className="d3-choices">
          <button
            type="button"
            className={done ? "is-on" : ""}
            onClick={() => {
              playCorrect();
              setDone(true);
            }}
          >
            Alleen de algemene toekomstplannen
          </button>
          <button
            type="button"
            onClick={() => {
              playDenied();
            }}
          >
            De financiële ramingen
          </button>
          <button
            type="button"
            onClick={() => {
              playDenied();
            }}
          >
            De technische details van het stadiondossier
          </button>
        </div>
      </div>

      {done ? (
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
        <article className="d3-memo">
          <header>
            <span>ADO Den Haag · Bestuurssecretariaat</span>
            <strong className="d3-stamp-red">Vertrouwelijk</strong>
          </header>
          <h3>Interne memo — Communicatieprotocol</h3>
          <p className="d3-meta">10 oktober 2023 · Voorbereiding bestuursvergadering</p>
          <ol>
            <li>
              <strong>Aanleiding</strong>
              <span>Stadionplannen staan op de agenda.</span>
            </li>
            <li>
              <strong>Besluitvorming</strong>
              <span className="d3-blackout">████████████████████</span>
            </li>
            <li>
              <strong>Communicatie</strong>
              <span className="d3-blackout">████████████████████</span>
            </li>
            <li>
              <strong>Vertrouwelijkheid</strong>
              <span>Alleen voor bestuursleden. Niet kopiëren of delen vóór een definitief besluit.</span>
            </li>
          </ol>
          <button className="mg-ghost" type="button" onClick={() => setZoom("memo")}>
            Vergroot
          </button>
        </article>

        <article className="d3-paper">
          <header>
            <span>Haags Dagblad</span>
            <strong className="d3-stamp-red is-warn">Mogelijke embargoschending</strong>
          </header>
          <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
          <p className="d3-meta">Ochtendeditie · vóór officiële vrijgave</p>
          <p>
            Bronnen melden concrete locatieopties en technische keuzes die nog niet officieel zijn gedeeld. Het bericht bevat details die niet in de goedgekeurde persverklaring stonden.
          </p>
          <button className="mg-ghost" type="button" onClick={() => setZoom("paper")}>
            Vergroot
          </button>
        </article>
      </div>

      <div className="d3-ask">
        <p className="mg-kicker">Welke communicatieregel is mogelijk overtreden?</p>
        <p>Bekijk de fysieke interne memo. Welke afspraak was gemaakt over het delen van informatie?</p>
        <div className="d3-choices">
          {PROTOCOL_CHOICES.map((item) => (
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
          <div className="d3-zoom-card">
            {zoom === "memo" ? (
              <>
                <p className="mg-kicker">Interne memo</p>
                <p>Vertrouwelijke informatie mag niet extern worden gedeeld voordat een definitief besluit is genomen. Externe vragen lopen via de woordvoerder.</p>
              </>
            ) : (
              <>
                <p className="mg-kicker">Haags Dagblad</p>
                <p>Het artikel verscheen vóór de officiële vrijgave en bevat details uit het vertrouwelijke dossier.</p>
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
        Memory: koppel elk gelekt detail aan de juiste bron. Zo bewijs je dat de informatie uit het vertrouwelijke stadiondossier kwam — niet uit de goedgekeurde persverklaring.
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
          <p className="mg-kicker">Lek bewezen · bron: {LEAK_CORRECT === "dossier" ? "vertrouwelijk dossier" : LEAK_CORRECT}</p>
          <p>
            De gelekte details horen bij het vertrouwelijke stadiondossier en stonden niet in de goedgekeurde persverklaring. Het embargo is geschonden. Open dossier 04: Het lek.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Terug naar dossiers
          </button>
        </div>
      ) : null}
    </section>
  );
}
