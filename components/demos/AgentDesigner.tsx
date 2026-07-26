"use client";
import { useState } from "react";
import JSZip from "jszip";
import { useDemo } from "./useDemo";
import { DemoResultArea } from "./DemoShell";
import { Button, Card, CopyButton } from "@/components/ui";
import type { AgentDesign } from "@/app/api/ai/agent-designer/route";

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "custom-agent";
}

async function downloadSkill(design: AgentDesign) {
  const name = slugify(design.systemPrompt.split(/[.\n]/)[0] || "custom-agent");
  const description = design.systemPrompt.split(/[.\n]/)[0].slice(0, 120).trim();
  const skillMd = `---
name: ${name}
description: ${description}
---

# ${name}

${design.systemPrompt}

## Suggested tools & integrations

${design.tools.map((t) => `- ${t}`).join("\n")}

## Scripts

Place executable helpers this agent can call in \`scripts/\`. See \`scripts/README.md\`.
`;
  const zip = new JSZip();
  const folder = zip.folder(name)!;
  folder.file("SKILL.md", skillMd);
  folder.file(
    "scripts/README.md",
    "# scripts/\n\nAdd standalone scripts the skill can invoke (Python, Node, shell).\nEach script should be self-contained and documented at the top.\n"
  );
  folder.file("scripts/.gitkeep", "");
  const blob = await zip.generateAsync({ type: "blob" });
  download("agent-skill.zip", blob);
}

function downloadWorkflow(design: AgentDesign) {
  const workflow = {
    name: "AI Agent Starter",
    nodes: [
      {
        parameters: {},
        id: "manual-trigger",
        name: "When clicking 'Test workflow'",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [260, 300],
      },
      {
        parameters: {
          method: "POST",
          url: "https://api.anthropic.com/v1/messages",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "x-api-key", value: "={{ $env.ANTHROPIC_API_KEY }}" },
              { name: "anthropic-version", value: "2023-06-01" },
              { name: "content-type", value: "application/json" },
            ],
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: JSON.stringify(
            {
              model: "claude-haiku-4-5",
              max_tokens: 1024,
              system: design.systemPrompt,
              messages: [{ role: "user", content: "={{ $json.input }}" }],
            },
            null,
            2
          ),
          options: {},
        },
        id: "anthropic-http",
        name: "Anthropic Messages",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [520, 300],
      },
    ],
    connections: {
      "When clicking 'Test workflow'": {
        main: [[{ node: "Anthropic Messages", type: "main", index: 0 }]],
      },
    },
    settings: {},
  };
  download("agent-workflow.json", new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" }));
}

export function AgentDesigner() {
  const [description, setDescription] = useState("");
  const { state, run } = useDemo<AgentDesign>("agent-designer");
  const loading = state.status === "loading";

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what you want your AI agent to do…"
        rows={4}
        className="w-full rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <div className="mt-3">
        <Button
          onClick={() => run({ description })}
          disabled={loading || !description.trim()}
        >
          {loading ? "Generating…" : "Generate agent →"}
        </Button>
      </div>

      <DemoResultArea
        status={state.status}
        source={state.status === "done" ? state.source : undefined}
        reason={state.status === "done" ? state.reason : undefined}
      >
        {state.status === "done" && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">System prompt</p>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-edge bg-ink/60 p-4 font-mono text-xs leading-relaxed text-cream">
                {state.data.systemPrompt}
              </pre>
            </div>

            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                Suggested tools & integrations
              </p>
              <ul className="space-y-2">
                {state.data.tools.map((tool, i) => (
                  <li key={i} className="flex gap-2 font-mono text-sm text-cream">
                    <span className="text-accent">▸</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="p-4">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Export</p>
              <div className="flex flex-wrap gap-3">
                <CopyButton text={state.data.systemPrompt} label="Copy system prompt" />
                <Button variant="outline" onClick={() => void downloadSkill(state.data)}>
                  Download Claude Code skill
                </Button>
                <Button variant="outline" onClick={() => downloadWorkflow(state.data)}>
                  Download n8n workflow
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DemoResultArea>
    </div>
  );
}
