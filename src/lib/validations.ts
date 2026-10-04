import { z } from "zod";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "./utils";

// Shared by API route handlers (server-side validation) and forms (client-side validation).

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.email("Enter a valid email address").trim().toLowerCase(),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const lessonInputSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(3, "Lesson title must be at least 3 characters").max(150),
  content: z.string().trim().min(10, "Lesson content must be at least 10 characters"),
  videoUrl: z.union([z.url("Enter a valid URL"), z.literal("")]).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1, "Min 1 minute").max(600, "Max 600 minutes"),
});

export const courseInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  category: z.enum(COURSE_CATEGORIES, "Select a category"),
  level: z.enum(COURSE_LEVELS, "Select a level"),
  instructor: z.string().trim().min(2, "Instructor name is required").max(100),
  thumbnailUrl: z
    .union([z.url({ protocol: /^https$/, error: "Enter a valid https:// image URL" }), z.literal("")])
    .optional()
    .nullable(),
  durationHours: z.coerce.number().int().min(1, "Min 1 hour").max(500, "Max 500 hours"),
  isPublished: z.boolean().default(false),
  lessons: z.array(lessonInputSchema).min(1, "Add at least one lesson").max(100),
});

export const courseUpdateSchema = courseInputSchema.partial();

export const courseQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(COURSE_CATEGORIES).optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  status: z.enum(["published", "draft", "all"]).optional(),
  sort: z.enum(["newest", "oldest", "title", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
});

export const enrollSchema = z.object({ courseId: z.uuid("Invalid course id") });

export const progressSchema = z.object({
  lessonId: z.uuid("Invalid lesson id"),
  completed: z.boolean(),
});

export const enrollmentQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "completed"]).optional(),
  courseId: z.uuid().optional(),
  userId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["student", "admin"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userUpdateSchema = z.object({ role: z.enum(["student", "admin"]) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CourseInput = z.input<typeof courseInputSchema>;
export type LessonInput = z.input<typeof lessonInputSchema>;

/** Flattens a zod error into `{ field: firstMessage }`, using dotted paths for nested fields. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
