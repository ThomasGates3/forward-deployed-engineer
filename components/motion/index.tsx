"use client";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({ children, delay = 0, y = 16, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
    >
      {children}
    </motion.div>
  );
}

// Signature "thinking" shimmer used while a demo waits on Claude.
export function ThinkingBar() {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-edge">
      <motion.div
        className="h-full w-1/3 rounded-full bg-ember"
        animate={{ x: ["-120%", "320%"] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
      />
    </div>
  );
}
