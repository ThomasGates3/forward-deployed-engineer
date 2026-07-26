import dynamic from "next/dynamic";

// Each demo is a self-contained client component. Agents fill these in.
export const demoComponents: Record<string, React.ComponentType> = {
  "agent-designer": dynamic(() => import("./AgentDesigner").then((m) => m.AgentDesigner)),
  "speed-to-lead": dynamic(() => import("./SpeedToLead").then((m) => m.SpeedToLead)),
  "support-reply": dynamic(() => import("./SupportReply").then((m) => m.SupportReply)),
  extract: dynamic(() => import("./Extract").then((m) => m.Extract)),
  "automation-architect": dynamic(() => import("./AutomationArchitect").then((m) => m.AutomationArchitect)),
};
