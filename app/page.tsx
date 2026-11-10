import { Hero } from "@/components/sections/Hero";
import { Gallery } from "@/components/sections/Gallery";
import { HowIWork } from "@/components/sections/HowIWork";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      {/* Poster is the LCP image; the film frames and mp4s load later from JS. */}
      <link rel="preload" as="image" type="image/avif" href="/hero/poster.avif" media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" href="/hero/poster-mobile.avif" media="(max-width: 767px)" fetchPriority="high" />
      <Hero />
      <Gallery />
      <div className="rule" />
      <HowIWork />
      <div className="rule" />
      <Contact />
    </main>
  );
}
