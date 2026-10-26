"use client";

import { useEffect, useState } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";
import type { HostRow, TeamRow } from "@/lib/events/types";
import { getJson } from "./api";
import { HomeScreen } from "./HomeScreen";
import { InstructorDesk } from "./InstructorDesk";
import { TeamRoom } from "./TeamRoom";

type Session = {
  host: { code: string; rows: HostRow[] } | null;
  team: { row: TeamRow } | null;
};

export function AppShell({ realtimeUrl }: { realtimeUrl: string }) {
  const [client] = useState(() => createRealtimeClient({ url: realtimeUrl }));
  return (
    <RealtimeProvider client={client}>
      <EventApp />
    </RealtimeProvider>
  );
}

function EventApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<"boot" | "home" | "instructor" | "team">("boot");
  const [freshEvent, setFreshEvent] = useState(true);

  useEffect(() => {
    let ignore = false;
    void getJson<Session>("/api/session").then((result) => {
      if (ignore) return;
      const next = result.ok ? result.data : { host: null, team: null };
      setSession(next);
      if (next.team && !next.host) setView("team");
      else setView("home");
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (view === "boot" || !session) return <p className="boot">De Senaatskamer wordt geopend.</p>;
  if (view === "instructor") return <InstructorDesk fresh={freshEvent} onHome={() => setView("home")} />;
  if (view === "team") return <TeamRoom onHome={() => setView("home")} />;

  return (
    <HomeScreen
      teamName={session.team?.row.team_name}
      hostCode={session.host?.code}
      onInstructor={() => {
        setFreshEvent(true);
        setView("instructor");
      }}
      onJoined={() => setView("team")}
      onContinueHost={
        session.host
          ? () => {
              setFreshEvent(false);
              setView("instructor");
            }
          : undefined
      }
      onContinueTeam={session.team ? () => setView("team") : undefined}
    />
  );
}
