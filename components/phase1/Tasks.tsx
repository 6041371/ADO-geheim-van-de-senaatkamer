"use client";

import { useRef, useState } from "react";
import {
  HINTS,
  MINUTE_FRAGMENTS,
  MINUTE_SLOTS,
  TIMELINE,
  isConfidentialityConclusion,
  isMissingPerson,
  isTimeCode,
  minutesAreRestored,
} from "@/lib/level1";
import { playCorrect, playDenied, playUnlocked } from "./sounds";

function ScreenBar({
  kicker,
  title,
  step,
  onBack,
}: {
  kicker: string;
  title: string;
  step: number;
  onBack?: () => void;
}) {
  return (
    <header className="mg-bar">
      {onBack ? (
        <button className="mg-back" type="button" onClick={onBack} aria-label="Terug naar beginscherm">
          ←
        </button>
      ) : (
        <span />
      )}
      <div>
        <p className="mg-kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <div className="mg-step">
        <span className="mg-dots" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <i key={index} className={index <= step ? "is-on" : ""} />
          ))}
        </span>
        <small>
          {step + 1}/3
        </small>
      </div>
    </header>
  );
}

function Note({ text }: { text: string }) {
  return <p className="mg-note">{text}</p>;
}

export function RoomBriefing({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <section className="mg-screen">
      <ScreenBar kicker="Dossier 01" title="De vergadering begint" step={0} onBack={onBack} />
      <img className="mg-hero" src="/ado/senaatskamer.jpg" alt="De Senaatskamer van ADO Den Haag" />
      <section className="mg-block">
        <p className="mg-kicker">Verhaal</p>
        <p>
          Jullie zitten in de Senaatskamer. Jaren geleden besprak het bestuur hier in het geheim de plannen voor het stadion. Niet iedereen was bij de start van de vergadering aanwezig. Onderzoek wie er ontbreken en gebruik de documenten op tafel.
        </p>
      </section>
      <section className="mg-block">
        <p className="mg-kicker">Benodigde props</p>
        <ul className="mg-props">
          <li>Aanwezigheidslijst</li>
          <li>Naamkaartjes</li>
          <li>Agenda</li>
        </ul>
      </section>
      <button className="mg-yellow mg-cta" type="button" onClick={onStart}>
        Start opdracht 1
      </button>
    </section>
  );
}

export function AttendanceTask({
  onSolved,
  onNext,
  onBack,
}: {
  onSolved: () => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [pending, setPending] = useState(false);

  async function check() {
    if (!isMissingPerson(answer)) {
      setWrong(true);
      playDenied();
      return;
    }
    setPending(true);
    const saved = await onSolved();
    setPending(false);
    if (!saved) return;
    setWrong(false);
    setCorrect(true);
    playCorrect();
  }

  return (
    <section className="mg-screen mg-meet-screen">
      <ScreenBar kicker="Opdracht 1" title="Wie was aanwezig?" step={0} onBack={onBack} />
      <div className="mg-meet">
        <img
          src="/ado/tafel.jpg"
          alt="De tafel in de Senaatskamer. Erik Meijer, Karin Bos en Tom Albers zitten aan tafel. Twee stoelen zijn leeg."
        />
        <span className="mg-tag is-erik">Erik<br />Meijer</span>
        <span className="mg-tag is-karin">Karin<br />Bos</span>
        <span className="mg-tag is-tom">Tom<br />Albers</span>
        <span className="mg-qmark is-empty-a" aria-hidden="true">?</span>
        <span className="mg-qmark is-empty-b" aria-hidden="true">?</span>
      </div>
      <Note text="Vijf mensen hoorden bij die avond. Drie zitten al aan tafel. Er ontbreken twee personen — bekijk de naamkaartjes en de aanwezigheidslijst." />
      {correct ? (
        <div className="mg-success">
          <p className="mg-kicker">Juist</p>
          <p>Marcel de Vries en Sophie van Rijn waren nog niet aanwezig bij het begin van de vergadering. De volgende opdracht is ontgrendeld.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : (
        <form
          className="mg-answer"
          onSubmit={(event) => {
            event.preventDefault();
            void check();
          }}
        >
          <p className="mg-kicker">Jouw antwoord</p>
          <p>Wie waren bij aanvang van de vergadering nog niet aanwezig?</p>
          <input
            value={answer}
            placeholder="Beide volledige namen"
            onChange={(event) => setAnswer(event.target.value)}
            autoComplete="off"
          />
          {wrong ? (
            <p className="mg-bad">
              Dat is niet correct. Erik Meijer, Karin Bos en Tom Albers zitten er wel. Wie ontbreken er nog?
            </p>
          ) : null}
          <button className="mg-yellow mg-cta" type="submit" disabled={pending || answer.trim().length < 3}>
            Controleer antwoord
          </button>
        </form>
      )}
    </section>
  );
}

export function MinutesTask({ onSolved, onNext, onBack }: { onSolved: () => Promise<boolean>; onNext: () => void; onBack: () => void }) {
  const [placed, setPlaced] = useState<Record<string, string | null>>({ "gat-1": null, "gat-2": null, "gat-3": null });
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [pending, setPending] = useState(false);
  const moved = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  function bank() {
    const used = new Set(Object.values(placed));
    return MINUTE_FRAGMENTS.filter((fragment) => !used.has(fragment.id));
  }

  function moveTo(slot: string | null) {
    if (!selected) return;
    setPlaced((current) => {
      const next = { ...current };
      for (const key of MINUTE_SLOTS) if (next[key] === selected) next[key] = null;
      if (slot) next[slot] = selected;
      return next;
    });
    setSelected(null);
    setMessage(null);
  }

  function checkDocument() {
    if (!minutesAreRestored(placed)) {
      setMessage("De volgorde klopt nog niet. Bekijk het gele kader op de vergaderagenda opnieuw.");
      playDenied();
      return;
    }
    setMessage(null);
    setRestored(true);
    playCorrect();
  }

  async function checkConclusion() {
    if (!isConfidentialityConclusion(answer)) {
      setWrong(true);
      playDenied();
      return;
    }
    setPending(true);
    const saved = await onSolved();
    setPending(false);
    if (!saved) return;
    setCorrect(true);
    playCorrect();
  }

  return (
    <section className="mg-screen mg-minutes">
      <ScreenBar kicker="Opdracht 2" title="De ontbrekende notulen" step={1} onBack={onBack} />
      <div className="mg-brief">
        <i aria-hidden="true">i</i>
        <div>
          <strong>Onderzoek de beschadigde notulen</strong>
          <p>Drie woorden ontbreken. Gebruik het gele kader op de fysieke vergaderagenda om de passage te herstellen.</p>
        </div>
      </div>
      <article className="mg-document">
        <header>Vertrouwelijke passage</header>
        {MINUTE_SLOTS.map((slot, index) => {
          const fragment = MINUTE_FRAGMENTS.find((item) => item.id === placed[slot]);
          return (
            <button key={slot} type="button" className={fragment ? "mg-gap is-filled" : "mg-gap"} data-slot={slot} onClick={() => (selected ? moveTo(slot) : setSelected(fragment?.id ?? null))}>
              <span>{index + 1}</span>
              {fragment ? fragment.label : "……"}
            </button>
          );
        })}
      </article>
      {!restored ? (
        <>
          <div className="mg-fragments">
            {bank().map((fragment) => (
              <button
                key={fragment.id}
                type="button"
                className={selected === fragment.id ? "mg-fragment is-selected" : "mg-fragment"}
                onPointerDown={(event) => {
                  moved.current = false;
                  origin.current = { x: event.clientX, y: event.clientY };
                  setSelected(fragment.id);
                }}
                onPointerMove={(event) => {
                  if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 12) moved.current = true;
                }}
                onPointerUp={(event) => {
                  const target = document.elementFromPoint(event.clientX, event.clientY);
                  const slot = target?.closest<HTMLElement>("[data-slot]")?.dataset.slot;
                  if (moved.current && slot) moveTo(slot);
                }}
              >
                {fragment.label}
              </button>
            ))}
          </div>
          <div className="mg-actions">
            <button className="mg-yellow mg-cta" type="button" onClick={checkDocument} disabled={MINUTE_SLOTS.some((slot) => !placed[slot])}>
              Controleer document
            </button>
            <button
              className="mg-ghost"
              type="button"
              onClick={() => {
                setPlaced({ "gat-1": null, "gat-2": null, "gat-3": null });
                setSelected(null);
                setMessage(null);
              }}
            >
              Opnieuw proberen
            </button>
          </div>
          {message ? <p className="mg-bad">{message}</p> : null}
        </>
      ) : null}
      {restored && !correct ? (
        <>
          <div className="mg-success mg-confirm">
            <span className="mg-tick" aria-hidden="true">✓</span>
            <div>
              <h2>Passage hersteld</h2>
              <p>De ontbrekende woorden zijn correct geplaatst. Beantwoord nu de onderzoeksvraag.</p>
            </div>
          </div>
          <form
            className="mg-answer"
            onSubmit={(event) => {
              event.preventDefault();
              void checkConclusion();
            }}
          >
            <h2>Welke afspraak heeft het bestuur gemaakt?</h2>
            <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setWrong(false); }} placeholder="Schrijf de afspraak in een korte zin..." />
            {wrong ? (
              <div className="mg-bad">
                <strong>Antwoord nog niet goedgekeurd</strong>
                <p>Controleer het gele kader op de vergaderagenda en probeer de afspraak opnieuw te formuleren.</p>
              </div>
            ) : null}
            <button className="mg-yellow mg-cta" type="submit" disabled={pending || answer.trim().length < 12}>
              Controleer antwoord
            </button>
          </form>
        </>
      ) : null}
      {correct ? (
        <div className="mg-success mg-confirm">
          <span className="mg-tick" aria-hidden="true">✓</span>
          <div>
            <h2>Antwoord goedgekeurd</h2>
            <p>De afspraak is correct omschreven. Het onderzoek kan verder.</p>
          </div>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Verder met onderzoek
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function TimeTask({ onSolved, onFinished, onBack }: { onSolved: () => Promise<boolean>; onFinished: () => void; onBack: () => void }) {
  const [active, setActive] = useState(0);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [wrong, setWrong] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function check() {
    if (!isTimeCode(digits.join(""))) {
      setWrong(true);
      playDenied();
      return;
    }
    setPending(true);
    const saved = await onSolved();
    setPending(false);
    if (!saved) return;
    setOpen(true);
    setWrong(false);
    playUnlocked();
  }

  return (
    <section className="mg-screen">
      <ScreenBar kicker="Opdracht 3" title="De verborgen tijdcode" step={2} onBack={onBack} />
      <Note text={HINTS.time.props} />
      <div className="mg-clock" aria-hidden="true">
        <span className="mg-hand mg-hour" />
        <span className="mg-hand mg-minute" />
      </div>
      <p>De vergaderdocumenten bevatten verschillende tijdstippen. Eén daarvan is belangrijk voor het onderzoek. Vind het juiste tijdstip en ontgrendel het beveiligde dossier.</p>
      <div className="mg-timeline">
        {TIMELINE.map((item, index) => (
          <button key={item.time} type="button" className={index === active ? "is-on" : ""} onClick={() => setActive(index)}>
            {item.time}
          </button>
        ))}
      </div>
      <p className="mg-alert">{TIMELINE[active]?.label}</p>
      {!open ? (
        <form
          className="mg-answer"
          onSubmit={(event) => {
            event.preventDefault();
            void check();
          }}
        >
          <h2>Codeslot</h2>
          <div className="mg-code">
            {digits.map((digit, index) => (
              <input
                key={index}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                aria-label={`Cijfer ${index + 1}`}
                onChange={(event) => {
                  const next = [...digits];
                  next[index] = event.target.value.replace(/\D/g, "").slice(-1);
                  setDigits(next);
                  const field = event.target.nextElementSibling;
                  if (next[index] && field instanceof HTMLInputElement) field.focus();
                }}
              />
            ))}
          </div>
          {wrong ? <p className="mg-bad">TOEGANG GEWEIGERD. Controleer de tijdstippen in de vergaderdocumenten.</p> : null}
          <button className="mg-yellow mg-cta" type="submit" disabled={pending || digits.some((digit) => !digit)}>
            Ontgrendel
          </button>
        </form>
      ) : (
        <div className="mg-success">
          <p className="mg-stamp">Ontgrendeld</p>
          <p>De eerste gebeurtenissen zijn gereconstrueerd. Jullie hebben vastgesteld dat er vertrouwelijke informatie werd besproken en dat niet alle betrokkenen aanwezig waren.</p>
          <p className="mg-unlock">Dossier 01 voltooid</p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Sluit het dossier
          </button>
        </div>
      )}
    </section>
  );
}
