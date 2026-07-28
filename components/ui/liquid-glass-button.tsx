"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const liquidButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold text-cream cursor-pointer transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        xxl: "h-[4.5rem] px-12 text-xl",
      },
    },
    defaultVariants: { size: "lg" },
  }
);

type LiquidButtonProps = VariantProps<typeof liquidButtonVariants> & {
  className?: string;
  children?: React.ReactNode;
} & (
    | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

function LiquidButton({ className, size, children, ...props }: LiquidButtonProps) {
  const decorations = (
    <>
      {/* cyan-tinted glass surface with inner light + rim */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-accent/15 shadow-[inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.4),inset_0_0_8px_4px_rgba(34,211,238,0.15),0_0_18px_rgba(34,211,238,0.35),0_4px_16px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/25 backdrop-blur-md transition-all"
      />
      {/* SVG liquid-glass distortion (Chromium; degrades to the tint elsewhere) */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#liquid-glass")' }}
      />
      <span className="pointer-events-none z-10 inline-flex items-center gap-2">{children}</span>
      <GlassFilter />
    </>
  );
  const classes = cn(liquidButtonVariants({ size, className }));

  if ("href" in props && props.href !== undefined) {
    return (
      <a className={classes} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {decorations}
      </a>
    );
  }
  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {decorations}
    </button>
  );
}

function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden>
      <defs>
        <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export { LiquidButton, liquidButtonVariants };
