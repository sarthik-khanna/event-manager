"use client";

import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Moving Border button
export function MovingBorderLink({
  href,
  children,
  className,
  duration = 3000,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <Link href={href} className="relative h-12 w-44 overflow-hidden rounded-xl bg-transparent p-[1px] text-sm">
      <div className="absolute inset-0 rounded-xl">
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div className="h-16 w-16 bg-[radial-gradient(#6366f1_40%,transparent_60%)] opacity-80" />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-[calc(0.75rem-1px)] border border-slate-800 bg-slate-950/90 font-medium text-white antialiased backdrop-blur-xl",
          className,
        )}
      >
        {children}
      </div>
    </Link>
  );
}

function MovingBorder({
  children,
  duration,
  rx,
  ry,
}: {
  children: ReactNode;
  duration: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) progress.set((time * (length / duration)) % length);
  });

  const x = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).x ?? 0);
  const y = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg preserveAspectRatio="none" className="absolute h-full w-full" width="100%" height="100%" aria-hidden>
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>
        {children}
      </motion.div>
    </>
  );
}
