import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import AutomationArchitectTool from "./AutomationArchitectTool";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default function Page() {
  return (
    <main
      className={`${display.className} relative min-h-screen overflow-hidden bg-[#050912] text-[#cfe3ff]`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(56,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,132,255,0.06) 1px, transparent 1px), radial-gradient(circle at 50% 0%, rgba(46,120,255,0.18), transparent 60%)",
        backgroundSize: "42px 42px, 42px 42px, 100% 100%",
      }}
    >
      {/* glow orbs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#1f6bff]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-[#00e0ff]/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <Link
          href="/"
          data-testid="back-link"
          className={`${mono.className} inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7fb0ff]/70 transition-colors hover:text-[#8fe6ff]`}
        >
          ← Back to portfolio
        </Link>

        <header className="mt-8">
          <div
            className={`${mono.className} mb-4 inline-flex items-center gap-2 border border-[#1e3a6b] bg-[#0a1428]/70 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#57d0ff]`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00e0ff] shadow-[0_0_8px_#00e0ff]" />
            schematic engine
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
            Automation{" "}
            <span
              className="bg-gradient-to-r from-[#57d0ff] via-[#4f9dff] to-[#7b6bff] bg-clip-text text-transparent"
              style={{ textShadow: "0 0 30px rgba(79,157,255,0.35)" }}
            >
              Architect
            </span>
          </h1>
          <p className={`${mono.className} mt-4 max-w-xl text-sm leading-relaxed text-[#9db8de]`}>
            Describe a business process{" "}
            <span className="text-[#57d0ff]">→</span> a legible workflow. The engine drafts an
            n8n-style trigger and node graph you can read at a glance.
          </p>
        </header>

        <AutomationArchitectTool />
      </div>
    </main>
  );
}
