import Link from "next/link";
import { Inter, Sora } from "next/font/google";
import SpeedToLeadTool from "./SpeedToLeadTool";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export const metadata = {
  title: "Speed to Lead: AI Lead Qualification",
  description: "Send yourself a fake inbound lead and watch it get qualified live.",
};

export default function Page() {
  return (
    <main
      className={`${sora.variable} ${inter.variable} min-h-screen w-full`}
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        background:
          "radial-gradient(1200px 600px at 15% -10%, #fef3c7 0%, transparent 55%), radial-gradient(1000px 500px at 100% 0%, #fee2e2 0%, transparent 50%), linear-gradient(180deg, #fffbeb 0%, #fff1f0 100%)",
        color: "#1c1917",
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-6 sm:px-8">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-stone-600 transition hover:bg-white/70 hover:text-stone-900"
        >
          ← Back to portfolio
        </Link>

        <section className="mt-8 sm:mt-12">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-600 backdrop-blur"
            style={{ letterSpacing: "0.08em" }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live pipeline demo
          </span>

          <h1
            className="mt-5 whitespace-nowrap font-extrabold leading-[1.1] tracking-tight"
            style={{
              fontFamily: "var(--font-sora), sans-serif",
              fontSize: "clamp(1.35rem, 4.6vw, 2.6rem)",
              backgroundImage: "linear-gradient(100deg, #dc2626 0%, #f59e0b 55%, #facc15 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Send yourself a fake inbound lead,
            <br /> watch it get qualified live.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Pose as a prospect landing in the inbox. In seconds an AI SDR scores fit and
            intent, explains its reasoning, and drafts a follow-up email plus a first-touch
            text, the way a real CRM should the instant a lead hits.
          </p>
        </section>

        <SpeedToLeadTool />

        {/* The story */}
        <section className="mt-20 border-t border-slate-200 pt-12">
          <h2
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            The story behind it
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              {
                h: "Problem",
                p: "Inbound leads go cold fast. Response time is the single biggest predictor of conversion, yet most teams reply in hours. Good leads sit in an inbox while a rep is heads-down elsewhere.",
              },
              {
                h: "What I built",
                p: "An event-driven pipeline that fires the instant a lead lands: Claude qualifies it (scoring intent and fit with real reasoning, not a yes/no), then auto-drafts an on-brand email and a first-touch SMS. A dashboard shows every lead, its score, and what was sent.",
              },
              {
                h: "Outcome",
                p: "Leads get a qualified, personalized response in seconds instead of hours, with the AI's reasoning attached to each one so the team trusts and acts on it. The demo above is that same qualify-and-draft loop, wired to email you for real.",
              },
            ].map((b) => (
              <div key={b.h} className="rounded-2xl border border-stone-200 bg-white/70 p-6 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600">{b.h}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{b.p}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Claude API", "Vertex AI", "Twilio", "Resend", "Next.js"].map((t) => (
              <span key={t} className="rounded-full border border-stone-200 bg-white/60 px-3 py-1 text-xs font-semibold text-stone-500">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
