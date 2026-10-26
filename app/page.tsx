import { AppShell } from "@/components/event/AppShell";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const realtimeUrl = process.env.NEON_REALTIME_URL;
  if (!realtimeUrl) {
    return (
      <main className="app">
        <section className="paper">
          <h1>Live verbinding ontbreekt</h1>
          <p>De evenementen hebben NEON_REALTIME_URL nodig. Zonder die waarde kunnen teams niet samen starten.</p>
        </section>
      </main>
    );
  }
  return <AppShell realtimeUrl={realtimeUrl} />;
}
