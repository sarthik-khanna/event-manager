import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "indigo" | "green" | "amber" | "red" | "cyan";
  className?: string;
}) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-neutral-300",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const levelTone = { beginner: "green", intermediate: "amber", advanced: "red" } as const;

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-neutral-800", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-white/[0.08] bg-neutral-950 p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-28 rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
        </div>
        {icon && <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-indigo-300">{icon}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <p className="text-lg font-medium text-neutral-200">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-neutral-900", className)} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Error callout built on the shadcn/ui Alert (destructive variant, tinted for the dark theme). */
export function ErrorAlert({ title = "Something went wrong", children }: { title?: string; children: ReactNode }) {
  return (
    <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-red-200/90">{children}</AlertDescription>
    </Alert>
  );
}
