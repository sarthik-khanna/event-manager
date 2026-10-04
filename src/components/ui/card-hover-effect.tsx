"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Card Hover Effect
export interface HoverItem {
  title: string;
  description: string;
  href?: string;
  icon?: ReactNode;
}

export function HoverEffect({ items, className }: { items: HoverItem[]; className?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 py-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, idx) => {
        const inner = (
          <>
            <AnimatePresence>
              {hovered === idx && (
                <motion.span
                  className="absolute inset-0 block h-full w-full rounded-3xl bg-neutral-800/70"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                />
              )}
            </AnimatePresence>
            <HoverCard>
              {item.icon && <div className="mb-4 text-indigo-400">{item.icon}</div>}
              <h4 className="font-bold tracking-wide text-zinc-100">{item.title}</h4>
              <p className="mt-4 text-sm leading-relaxed tracking-wide text-zinc-400">{item.description}</p>
            </HoverCard>
          </>
        );
        const props = {
          className: "group relative block h-full w-full p-2",
          onMouseEnter: () => setHovered(idx),
          onMouseLeave: () => setHovered(null),
        };
        return item.href ? (
          <Link key={item.title} href={item.href} {...props}>
            {inner}
          </Link>
        ) : (
          <div key={item.title} {...props}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export function HoverCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black p-6 group-hover:border-slate-700",
        className,
      )}
    >
      {children}
    </div>
  );
}
