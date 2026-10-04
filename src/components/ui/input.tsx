"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Input / Label (signup form) with a radial glow that follows the cursor.

const fieldClass =
  "flex w-full rounded-md border-none bg-zinc-800 px-3 py-2 text-sm text-white shadow-[0px_0px_1px_1px_#404040] transition duration-400 group-hover/input:shadow-none placeholder:text-neutral-500 focus-visible:ring-[2px] focus-visible:ring-neutral-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:ring-[2px] aria-[invalid=true]:ring-red-500/70";

function GlowWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const radius = 100;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      style={{
        background: useMotionTemplate`radial-gradient(${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px, #6366f1, transparent 80%)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn("group/input rounded-lg p-[2px] transition duration-300", className)}
    >
      {children}
    </motion.div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <GlowWrapper>
      <input className={cn(fieldClass, "h-10 file:border-0 file:bg-transparent", className)} {...props} />
    </GlowWrapper>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <GlowWrapper>
      <textarea className={cn(fieldClass, "min-h-24 resize-y", className)} {...props} />
    </GlowWrapper>
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <GlowWrapper>
      <select className={cn(fieldClass, "h-10 cursor-pointer", className)} {...props}>
        {children}
      </select>
    </GlowWrapper>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm leading-none font-medium text-neutral-200", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
