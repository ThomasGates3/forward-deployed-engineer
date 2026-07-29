export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  problem: string;
  build: string[];
  architecture: string[];
  outcome: string;
  demo?: { label: string; href: string };
  liveDemo?: "speed-to-lead" | "optimistic-os";
};

export const caseStudies: CaseStudy[] = [];

export const caseStudyBySlug = Object.fromEntries(caseStudies.map((c) => [c.slug, c]));
