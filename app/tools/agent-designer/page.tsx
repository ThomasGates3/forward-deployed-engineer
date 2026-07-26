import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import AgentDesignerTool from "./AgentDesignerTool";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = {
  title: "AI Agent Designer // terminal",
  description: "Describe an agent → get a production system prompt + tools",
};

export default function Page() {
  return (
    <main
      className={`${mono.className} relative min-h-screen overflow-hidden bg-[#050805] text-[#39ff14] selection:bg-[#39ff14] selection:text-black`}
    >
      {/* scanlines */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.18]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.6) 3px, rgba(0,0,0,0) 4px)",
        }}
      />
      {/* vignette / crt glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(57,255,20,0.08), rgba(5,8,5,0) 55%), radial-gradient(circle at 50% 120%, rgba(5,8,5,0.9), rgba(5,8,5,0) 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[#39ff14]/70 transition-colors hover:text-[#7dff5e] hover:underline"
        >
          <span aria-hidden>←</span> back to portfolio
        </Link>

        <header className="mt-8 border border-[#1f4d18] bg-black/40 shadow-[0_0_40px_-10px_rgba(57,255,20,0.35)]">
          <div className="flex items-center gap-2 border-b border-[#1f4d18] bg-[#0a1408] px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 truncate text-xs text-[#39ff14]/60">
              ~/agents/designer — zsh
            </span>
          </div>
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <pre className="mb-4 hidden select-none text-[10px] leading-tight text-[#39ff14]/40 sm:block">
{String.raw`   _   ___   _____  _____ ___  ___  __ _____
  /_\ |_ _| /  _  \/ ___// _ \/ _ \/  / ___/
 / _ \ | |  | | | | |___| |_| |  __/ /___ \
/_/ \_\___| |_| |_|\____/\___/\___/_/\____/  agent designer`}
            </pre>
            <h1 className="text-2xl font-bold tracking-tight text-[#7dff5e] sm:text-3xl">
              <span className="text-[#39ff14]/50">$</span> ./design-agent
              <span className="ml-1 inline-block h-6 w-3 translate-y-0.5 animate-pulse bg-[#39ff14]" />
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#39ff14]/80 sm:text-base">
              Describe an agent →{" "}
              <span className="text-[#7dff5e]">get a production system prompt + tools</span>.
              Feed the compiler a mission; it returns a battle-ready spec.
            </p>
          </div>
        </header>

        <AgentDesignerTool />

        <footer className="mt-10 text-center text-xs text-[#39ff14]/30">
          [ EOF ] — no cookies, no telemetry, just green phosphor.
        </footer>
      </div>
    </main>
  );
}
