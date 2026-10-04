import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Bento Grid
export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[minmax(16rem,auto)] md:grid-cols-3", className)}>
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-white/[0.1] bg-black p-4 shadow-none transition duration-200 hover:shadow-xl hover:shadow-indigo-500/5",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 font-bold text-neutral-200">{title}</div>
        <div className="text-sm text-neutral-400">{description}</div>
      </div>
    </div>
  );
}
