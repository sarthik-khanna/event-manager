import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-neutral-950">
      <table className={cn("w-full min-w-[640px] text-left text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn("border-b border-white/[0.06] px-4 py-3 text-xs font-medium tracking-wide text-neutral-500 uppercase", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("border-b border-white/[0.04] px-4 py-3 text-neutral-300", className)} {...props} />;
}
