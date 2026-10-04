import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const COURSE_CATEGORIES = [
  "Web Development",
  "Data Science",
  "Design",
  "Cloud & DevOps",
  "Mobile Development",
  "Business",
] as const;

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
