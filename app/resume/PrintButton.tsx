"use client";
import { Button } from "@/components/ui";

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} data-testid="resume-print">
      Save as PDF / Print
    </Button>
  );
}
