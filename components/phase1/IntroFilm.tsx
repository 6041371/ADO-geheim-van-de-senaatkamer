"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

export function IntroFilm({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<"mark" | "film">("mark");
  const [muted, setMuted] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStage("film"), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage !== "film") return;
    const video = videoRef.current;
    if (!video) return;
    const play = video.play();
    if (play) void play.catch(() => setNeedsTap(true));
  }, [stage]);

  async function startWithSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setNeedsTap(false);
    try {
      await video.play();
    } catch {
      video.muted = true;
      setMuted(true);
      setNeedsTap(true);
    }
  }

  return (
    <section className="mg-film" aria-label="Introductie">
      <div className={stage === "mark" ? "mg-mark is-on" : "mg-mark"}>
        <Logo className="mg-mark-logo" />
      </div>
      {stage === "film" ? (
        <video
          ref={videoRef}
          className="mg-video"
          src="/ado/intro.mp4"
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          onEnded={onDone}
          onError={() => setFailed(true)}
        />
      ) : null}
      <div className="mg-film-controls">
        {muted && stage === "film" && !failed ? (
          <button className="mg-yellow" type="button" onClick={() => void startWithSound()}>
            Geluid aan
          </button>
        ) : null}
        {needsTap ? (
          <button className="mg-yellow" type="button" onClick={() => void startWithSound()}>
            Speel de intro
          </button>
        ) : null}
        {failed ? (
          <button className="mg-yellow" type="button" onClick={onDone}>
            Ga naar het menu
          </button>
        ) : null}
      </div>
    </section>
  );
}
