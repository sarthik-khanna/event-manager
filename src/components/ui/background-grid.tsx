import { cn } from "@/lib/utils";

// Aceternity UI — Grid & Dot backgrounds (with radial fade mask)
export function BackgroundGrid({ className, variant = "grid" }: { className?: string; variant?: "grid" | "dot" }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div
        className={cn(
          "absolute inset-0",
          variant === "grid"
            ? "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] [background-size:44px_44px]"
            : "[background-image:radial-gradient(#404040_1px,transparent_1px)] [background-size:20px_20px]",
        )}
      />
      <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    </div>
  );
}
