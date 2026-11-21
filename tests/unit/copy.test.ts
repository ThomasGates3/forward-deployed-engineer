// Guards against the site copy drifting from what the suite actually does.
import { describe, it, expect } from "vitest";
import { EVAL_CASES } from "@/lib/evals/cases";
import { demos } from "@/content/gallery";
import { stages } from "@/content/city-scroll";

const total = EVAL_CASES.length;
const adversarial = EVAL_CASES.filter((c) => c.category === "adversarial").length;

describe("eval copy matches the suite", () => {
  const card = demos.find((d) => d.id === "evals")!.value;
  const hud = JSON.stringify(stages);
  it("gallery card states the real case counts", () => {
    expect(card).toContain(`${total}-case`);
    expect(card).toContain(`${adversarial} of them adversarial`);
  });
  it("hero stage states the real case counts", () => {
    expect(hud).toContain(`${total} cases, ${adversarial} adversarial`);
  });
  it("no copy claims fully live regeneration or the same model as the standalone app", () => {
    for (const text of [card, hud]) {
      expect(text).not.toMatch(/regenerat/i);
      expect(text).not.toMatch(/same model/i);
      expect(text).not.toMatch(/before shipping/i);
    }
  });
});
