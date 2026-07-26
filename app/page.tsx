import { Hero } from "@/components/sections/Hero";
import { Gallery } from "@/components/sections/Gallery";
import { RangeStrip } from "@/components/sections/RangeStrip";
import { HowIWork } from "@/components/sections/HowIWork";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <div className="rule" />
      <Gallery />
      <div className="rule" />
      <RangeStrip />
      <div className="rule" />
      <HowIWork />
      <div className="rule" />
      <Contact />
    </main>
  );
}
