"use client";
import { useState } from "react";
import { Button, Card, Badge, CopyButton } from "@/components/ui";
import { ThinkingBar } from "@/components/motion";
import type { OptimisticPlan } from "@/app/api/ai/optimistic-os/route";
import type { OptimisticImage } from "@/app/api/ai/optimistic-image/route";

type Src = "live" | "fallback";
const STAGES = ["Trend research", "Concept", "Image", "Etsy listing", "Pinterest", "Publish"];

export function OptimisticOS() {
  const [niche, setNiche] = useState("");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1); // highest completed stage index
  const [plan, setPlan] = useState<OptimisticPlan | null>(null);
  const [planSrc, setPlanSrc] = useState<Src>("live");
  const [img, setImg] = useState<OptimisticImage | null>(null);
  const [imgSrc, setImgSrc] = useState<Src>("live");

  async function run() {
    setRunning(true);
    setStage(-1);
    setPlan(null);
    setImg(null);
    try {
      const r = await fetch("/api/ai/optimistic-os", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      const j = await r.json();
      setPlan(j.data);
      setPlanSrc(j.source);
      setStage(1); // trend + concept done
      // Image stage
      const ri = await fetch("/api/ai/optimistic-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: j.data.imagePrompt }),
      });
      const ji = await ri.json();
      setImg(ji.data);
      setImgSrc(ji.source);
      setStage(5); // reveal the rest
    } catch {
      /* guarded routes never throw; ignore */
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          data-testid="oos-niche"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="A product niche… e.g. cottagecore botanical wall art"
          className="min-w-[240px] flex-1 rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <Button data-testid="oos-run" onClick={run} disabled={running}>
          {running ? "Running pipeline…" : "Run pipeline →"}
        </Button>
      </div>

      {/* Stage tracker */}
      <div className="mt-5 flex flex-wrap gap-2">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              i <= stage ? "border-accent/50 bg-accent/10 text-accent" : "border-edge text-muted"
            }`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {running && !plan && (
        <div className="mt-5 space-y-3">
          <p className="font-mono text-xs text-muted">Agents working…</p>
          <ThinkingBar />
        </div>
      )}

      {plan && (
        <div className="mt-6 space-y-4">
          {planSrc === "fallback" && <Badge tone="amber">Example run (daily limit)</Badge>}

          <Stage n={1} title="Trend research">
            <p className="text-sm leading-relaxed text-cream/90">{plan.trend}</p>
          </Stage>

          <Stage n={2} title="Concept">
            <p className="font-display text-lg text-cream">{plan.concept.title}</p>
            <p className="mt-1 text-sm text-muted">{plan.concept.description}</p>
          </Stage>

          <Stage n={3} title="Image generation">
            {img ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt={plan.concept.title} className="w-full max-w-md rounded-xl border border-edge" />
                {imgSrc === "fallback" && (
                  <p className="mt-2 font-mono text-[11px] text-muted">Example image (fal.ai limit reached or unconfigured)</p>
                )}
                {imgSrc === "live" && (
                  <p className="mt-2 font-mono text-[11px] text-accent">● Generated live via fal.ai</p>
                )}
              </>
            ) : running ? (
              <ThinkingBar />
            ) : null}
          </Stage>

          <Stage n={4} title="Etsy listing">
            <p className="font-display text-cream">{plan.etsy.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.etsy.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">{plan.etsy.description}</p>
            <div className="mt-3">
              <CopyButton text={`${plan.etsy.title}\n\n${plan.etsy.description}\n\nTags: ${plan.etsy.tags.join(", ")}`} label="Copy listing" />
            </div>
          </Stage>

          <Stage n={5} title="Pinterest">
            <p className="text-sm text-cream/90">{plan.pinterest.caption}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">{plan.pinterest.schedule}</p>
          </Stage>

          <Stage n={6} title="Publish">
            <div className="flex items-center gap-2">
              <Badge tone="amber">Simulated</Badge>
              <span className="text-sm text-muted">
                Listing published to Etsy &amp; Pin scheduled — simulated here (no real store is touched).
              </span>
            </div>
          </Stage>
        </div>
      )}
    </div>
  );
}

function Stage({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">
        Agent {n} · {title}
      </p>
      {children}
    </Card>
  );
}
