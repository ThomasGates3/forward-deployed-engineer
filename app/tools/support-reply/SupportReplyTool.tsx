"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Scenario = "refund-delay" | "account-access" | "billing-question" | "custom";

type ApiResponse = {
  ok: boolean;
  source: "live" | "fallback";
  data: { reply: string; notes: string[] };
  reason?: string;
};

const PRESETS: { id: Scenario; label: string; emoji: string }[] = [
  { id: "refund-delay", label: "Refund delay", emoji: "💸" },
  { id: "account-access", label: "Account access", emoji: "🔑" },
  { id: "billing-question", label: "Billing question", emoji: "🧾" },
];

const CREAM = "#fffaf4";
const PEACH = "#f4a26b";
const BORDER = "#f0dcc6";

export default function SupportReplyTool() {
  const [scenario, setScenario] = useState<Scenario>("refund-delay");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/ai/support-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, message: scenario === "custom" ? message : "" }),
      });
      const json = (await res.json()) as ApiResponse;
      setResult(json);
    } catch {
      setError("Something went wrong reaching the helpdesk. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.data.reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const cardStyle: React.CSSProperties = {
    background: CREAM,
    border: `1px solid ${BORDER}`,
    borderRadius: 24,
    padding: "clamp(20px, 4vw, 32px)",
    boxShadow: "0 18px 40px rgba(217,159,110,0.14)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={cardStyle}>
        <label style={{ display: "block", fontWeight: 700, color: "#7a6252", marginBottom: 12 }}>
          Choose a scenario
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {PRESETS.map((p) => {
            const active = scenario === p.id;
            return (
              <button
                key={p.id}
                data-testid={`scenario-${p.id}`}
                onClick={() => setScenario(p.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 44,
                  padding: "0 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  transition: "all .18s ease",
                  border: `1.5px solid ${active ? PEACH : BORDER}`,
                  background: active ? "#ffedddff" : "#fff",
                  color: active ? "#b96a34" : "#8a7565",
                  boxShadow: active ? "0 8px 18px rgba(244,162,107,0.25)" : "none",
                }}
              >
                <span aria-hidden>{p.emoji}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 22 }}>
          <label
            htmlFor="custom-message"
            style={{ display: "block", fontWeight: 700, color: "#7a6252", marginBottom: 10 }}
          >
            …or paste a customer message
          </label>
          <textarea
            id="custom-message"
            data-testid="custom-message"
            value={message}
            onFocus={() => setScenario("custom")}
            onChange={(e) => {
              setMessage(e.target.value);
              setScenario("custom");
            }}
            placeholder="Hi, I've been charged but never got access to my plan…"
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: 18,
              border: `1.5px solid ${scenario === "custom" ? PEACH : BORDER}`,
              background: "#fffdfa",
              padding: "14px 16px",
              fontSize: 16,
              fontFamily: "inherit",
              color: "#5a4335",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        <button
          data-testid="generate-reply"
          onClick={generate}
          disabled={loading}
          style={{
            marginTop: 22,
            width: "100%",
            minHeight: 52,
            borderRadius: 16,
            border: "none",
            cursor: loading ? "wait" : "pointer",
            fontWeight: 800,
            fontSize: 17,
            color: "#fff",
            background: loading
              ? "#f1c39d"
              : "linear-gradient(135deg, #f6a866 0%, #ef8f6a 100%)",
            boxShadow: "0 12px 26px rgba(239,143,106,0.35)",
            transition: "transform .15s ease",
          }}
        >
          {loading ? "Writing a thoughtful reply…" : "✨ Generate reply"}
        </button>
      </div>

      {error && (
        <div
          data-testid="error"
          style={{ ...cardStyle, color: "#b4543a", background: "#fff2ee", borderColor: "#f6d4c8" }}
        >
          {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            data-testid="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {result.source === "fallback" && (
              <div
                data-testid="fallback-note"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  alignSelf: "flex-start",
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "#fff4d9",
                  border: "1px solid #f2dfae",
                  color: "#a6822f",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                🌱 Example reply — showing a saved sample while the live assistant rests
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "#ffe6d1",
                    fontSize: 20,
                  }}
                  aria-hidden
                >
                  🎧
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#5a4335" }}>Support team</div>
                  <div style={{ fontSize: 13, color: "#a08a78" }}>Suggested reply</div>
                </div>
              </div>

              <div
                data-testid="reply-bubble"
                style={{
                  position: "relative",
                  background: "linear-gradient(180deg, #fff7ee 0%, #fff1e2 100%)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "6px 22px 22px 22px",
                  padding: "18px 20px",
                  fontSize: 16.5,
                  lineHeight: 1.62,
                  color: "#54463a",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.data.reply}
              </div>

              <button
                data-testid="copy-reply"
                onClick={copyReply}
                style={{
                  marginTop: 16,
                  minHeight: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  border: `1.5px solid ${copied ? "#7bbf8f" : BORDER}`,
                  background: copied ? "#eaf7ee" : "#fff",
                  color: copied ? "#3f8a58" : "#8a6a52",
                  transition: "all .18s ease",
                }}
              >
                {copied ? "✓ Copied!" : "📋 Copy reply"}
              </button>
            </div>

            {result.data.notes.length > 0 && (
              <div style={cardStyle} data-testid="notes">
                <div style={{ fontWeight: 800, color: "#5a4335", marginBottom: 4 }}>
                  Tone &amp; quality check
                </div>
                <div style={{ fontSize: 14, color: "#a08a78", marginBottom: 16 }}>
                  Why this reply stays warm, safe, and on-brand
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
                  {result.data.notes.map((note, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.3 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                    >
                      <span
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          background: "#e6f6ec",
                          color: "#4a9b68",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <span style={{ fontSize: 15.5, color: "#5f4f43", lineHeight: 1.5 }}>{note}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
