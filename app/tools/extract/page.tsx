import type { Metadata } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import ExtractTool from "./ExtractTool";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["400", "700", "900"] });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "The Extractor — Messy Doc → Structured Data",
  description: "Paste messy text, get clean structured data.",
};

export default function Page() {
  return (
    <main
      className={`${grotesk.className} min-h-screen w-full`}
      style={{ backgroundColor: "#f4f1e9", color: "#111", backgroundImage: "radial-gradient(#00000010 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-12">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 border-b-2 border-black text-sm font-medium tracking-wide hover:bg-black hover:text-[#f4f1e9]"
          style={{ paddingInline: "4px" }}
        >
          ← Back to portfolio
        </Link>

        {/* Masthead */}
        <header className="mt-6 border-y-[3px] border-black py-3">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.25em]">
            <span>Vol. I</span>
            <span>The Extractor</span>
            <span>Est. 2026</span>
          </div>
        </header>

        <div className="mt-8 grid gap-6 border-b-[3px] border-black pb-8 md:grid-cols-[1.7fr_1fr] md:items-end">
          <h1 className={`${serif.className} text-5xl font-black leading-[0.95] tracking-tight md:text-7xl`}>
            Paste messy text
            <span className="block italic" style={{ color: "#8a1a10" }}>
              → clean structured data
            </span>
          </h1>
          <p className="border-l-[3px] border-black pl-4 text-sm leading-relaxed">
            Invoices, jumbled notes, half-formatted receipts. Drop in the raw
            unstructured mess on the left; read the extracted, ordered record on
            the right. <span className="font-bold">Unstructured in — structured out.</span>
          </p>
        </div>

        <ExtractTool serifClass={serif.className} />

        <footer className="mt-12 border-t-[3px] border-black pt-3 text-[11px] uppercase tracking-[0.25em]">
          Printed on demand · A data-extraction broadsheet
        </footer>
      </div>
    </main>
  );
}
