"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";

type Data = {
  verdict: string;
  score: number;
  reasoning: string;
  followupEmail: string;
  sms: string;
  emailSent: boolean;
};
type ApiResponse = {
  ok: true;
  source: "live" | "fallback";
  data: Data;
  reason?: string;
} | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function scoreColor(s: number) {
  if (s >= 70) return "#059669"; // emerald
  if (s >= 40) return "#d97706"; // amber
  return "#e11d48"; // rose
}

function Gauge({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="relative h-[180px] w-[180px] shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <motion.circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} color={color} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [mv, value]);
  return (
    <span
      className="text-5xl font-extrabold tabular-nums"
      style={{ fontFamily: "var(--font-sora), sans-serif", color }}
    >
      {display}
    </span>
  );
}

export default function SpeedToLeadTool() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ source: "live" | "fallback"; data: Data } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr("");
    setError("");
    if (!EMAIL_RE.test(email)) {
      setEmailErr("That doesn't look like a valid email — use a real address so you can see the follow-up.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/speed-to-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) {
        if (json.error === "invalid email") {
          setEmailErr("That email was rejected by the server. Try another address.");
        } else {
          setError(json.error || "Something went wrong.");
        }
        return;
      }
      setResult({ source: json.source, data: json.data });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyEmail() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.data.followupEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const inputCls =
    "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* Form card */}
      <form
        onSubmit={submit}
        data-testid="lead-form"
        className="h-fit rounded-3xl border border-white bg-white/80 p-6 shadow-[0_20px_60px_-25px_rgba(79,70,229,0.35)] backdrop-blur sm:p-7"
      >
        <h2
          className="text-lg font-bold text-slate-900"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Pose as the lead
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Use your real email — if live, the drafted follow-up actually lands in your inbox.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label>
            <input
              data-testid="input-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Rivera"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Your email</label>
            <input
              data-testid="input-email"
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-invalid={!!emailErr}
            />
            {emailErr && (
              <p data-testid="email-error" className="mt-2 text-sm font-medium text-rose-600">
                {emailErr}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Your message
            </label>
            <textarea
              data-testid="input-message"
              className={`${inputCls} min-h-[110px] resize-y`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi — we're a 40-person logistics startup drowning in manual ops. Can AI help us automate dispatch? Hoping to move fast this quarter."
            />
          </div>
        </div>

        <button
          type="submit"
          data-testid="submit-btn"
          disabled={loading}
          className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(100deg, #4f46e5, #7c3aed 55%, #db2777)" }}
        >
          {loading ? "Qualifying lead…" : "Qualify this lead →"}
        </button>

        {error && (
          <p data-testid="form-error" className="mt-3 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}
      </form>

      {/* Results */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-200 bg-white/40 p-8 text-center"
            >
              <div className="text-4xl">📈</div>
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                Submit the form and your lead flows through the pipeline — scored, explained,
                and ready to work.
              </p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-white bg-white/70 p-8"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-3 w-3 rounded-full bg-indigo-500"
                    animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">Routing lead through the pipeline…</p>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              data-testid="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {result.source === "fallback" && (
                <div
                  data-testid="fallback-note"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
                >
                  Example output — the live model is unavailable right now, so this is a
                  representative sample of what qualification looks like.
                </div>
              )}

              {/* Score + verdict card */}
              <div className="flex flex-col items-center gap-6 rounded-3xl border border-white bg-white/85 p-6 shadow-[0_20px_60px_-25px_rgba(79,70,229,0.35)] backdrop-blur sm:flex-row sm:p-8">
                <Gauge score={result.data.score} />
                <div className="text-center sm:text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Verdict
                  </span>
                  <h3
                    data-testid="verdict"
                    className="mt-1 text-2xl font-extrabold leading-tight text-slate-900"
                    style={{ fontFamily: "var(--font-sora), sans-serif" }}
                  >
                    {result.data.verdict}
                  </h3>
                  {result.data.emailSent ? (
                    <p
                      data-testid="email-sent"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
                    >
                      ✓ Real email sent to {email}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Follow-up drafted below (no live email dispatched in this run).
                    </p>
                  )}
                </div>
              </div>

              {/* AI reasoning */}
              <div className="rounded-3xl border border-white bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                    AI reasoning
                  </h4>
                </div>
                <p data-testid="reasoning" className="mt-3 text-[15px] leading-relaxed text-slate-700">
                  {result.data.reasoning}
                </p>
              </div>

              {/* Follow-up email */}
              <div className="rounded-3xl border border-white bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                      Drafted follow-up email
                    </h4>
                  </div>
                  <button
                    onClick={copyEmail}
                    data-testid="copy-email"
                    className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 active:scale-95"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <pre
                  data-testid="followup-email"
                  className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-[15px] leading-relaxed text-slate-700"
                >
                  {result.data.followupEmail}
                </pre>
              </div>

              {/* Simulated SMS phone mockup */}
              <div className="rounded-3xl border border-white bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                    First-touch SMS
                  </h4>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    Simulated delivery
                  </span>
                </div>
                <div className="mt-5 flex justify-center">
                  <div
                    className="w-full max-w-[300px] rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 p-2 shadow-2xl"
                    aria-label="Simulated phone showing an SMS"
                  >
                    <div className="relative rounded-[1.5rem] bg-slate-50 px-3 pb-6 pt-8">
                      <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-300" />
                      <p className="mb-3 text-center text-[11px] font-semibold text-slate-400">
                        Today
                      </p>
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        data-testid="sms-bubble"
                        className="max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14px] leading-snug text-white"
                        style={{ backgroundImage: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                      >
                        {result.data.sms}
                      </motion.div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                  This text is a preview only — no real SMS is sent.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
