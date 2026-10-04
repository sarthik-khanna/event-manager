"use client";

import { motion, stagger, useAnimate, useInView } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Text Generate Effect
export function TextGenerateEffect({
  words,
  className,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  duration?: number;
}) {
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true });

  useEffect(() => {
    if (inView) animate("span", { opacity: 1, filter: "blur(0px)" }, { duration, delay: stagger(0.08) });
  }, [inView, animate, duration]);

  return (
    <motion.p ref={scope} className={cn("leading-relaxed", className)}>
      {words.split(" ").map((word, i) => (
        <motion.span key={`${word}-${i}`} className="opacity-0" style={{ filter: "blur(10px)" }}>
          {word}{" "}
        </motion.span>
      ))}
    </motion.p>
  );
}
