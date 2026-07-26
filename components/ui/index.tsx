"use client";
import { useState } from "react";

export function Button({
  children, variant = "solid", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 min-h-[44px] font-mono text-sm tracking-tight transition disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    solid: "bg-ember text-ink hover:bg-ember-soft shadow-glow",
    outline: "border border-edge text-cream hover:border-ember hover:text-ember",
    ghost: "text-muted hover:text-cream",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-edge bg-surface/70 shadow-card backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "edge" }: { children: React.ReactNode; tone?: "edge" | "ember" | "amber" }) {
  const styles = {
    edge: "border-edge text-muted",
    ember: "border-ember/40 text-ember bg-ember/10",
    amber: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${styles}`}>
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-section text-cream">{title}</h2>
      {sub && <p className="mt-3 text-muted">{sub}</p>}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? "✓ Copied" : label}
    </Button>
  );
}

// Labeled banner shown whenever a demo returns a canned example instead of a live call.
export function FallbackNote({ reason }: { reason: string }) {
  const msg =
    reason === "per-visitor-cap"
      ? "You've hit today's free tries for this tool — here's a saved example so you can still see it work."
      : reason === "global-cap"
      ? "The site hit its daily demo budget — here's a saved example response."
      : "Showing a saved example response.";
  return (
    <div className="mb-4 flex items-center gap-2">
      <Badge tone="amber">Example response</Badge>
      <span className="text-xs text-muted">{msg}</span>
    </div>
  );
}
