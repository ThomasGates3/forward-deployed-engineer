"use client";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function PrintButton() {
  return (
    <LiquidButton size="default" onClick={() => window.print()} data-testid="resume-print">
      Save as PDF / Print
    </LiquidButton>
  );
}
