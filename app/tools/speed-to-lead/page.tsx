import Link from "next/link";
import { Inter, Sora } from "next/font/google";
import SpeedToLeadTool from "./SpeedToLeadTool";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export const metadata = {
  title: "Speed to Lead — AI Lead Qualification",
  description: "Send yourself a fake inbound lead and watch it get qualified live.",
};

export default function Page() {
  return (
    <main
      className={`${sora.variable} ${inter.variable} min-h-screen w-full`}
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        background:
          "radial-gradient(1200px 600px at 15% -10%, #dbeafe 0%, transparent 55%), radial-gradient(1000px 500px at 100% 0%, #ede9fe 0%, transparent 50%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#0f172a",
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-6 sm:px-8">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
        >
          ← Back to portfolio
        </Link>

        <section className="mt-8 sm:mt-12">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 backdrop-blur"
            style={{ letterSpacing: "0.08em" }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live pipeline demo
          </span>

          <h1
            className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            style={{
              fontFamily: "var(--font-sora), sans-serif",
              backgroundImage: "linear-gradient(100deg, #4f46e5 0%, #7c3aed 45%, #db2777 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Send yourself a fake inbound lead,
            <br className="hidden sm:block" /> watch it get qualified live.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Pose as a prospect landing in the inbox. In seconds an AI SDR scores fit and
            intent, explains its reasoning, and drafts a follow-up email plus a first-touch
            text — the way a real CRM should the instant a lead hits.
          </p>
        </section>

        <SpeedToLeadTool />
      </div>
    </main>
  );
}
