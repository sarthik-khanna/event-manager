import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const levelEnum = pgEnum("course_level", ["beginner", "intermediate", "advanced"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("student"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_role_idx").on(t.role)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    level: levelEnum("level").notNull().default("beginner"),
    instructor: varchar("instructor", { length: 100 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    durationHours: integer("duration_hours").notNull().default(1),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("courses_category_idx").on(t.category),
    index("courses_level_idx").on(t.level),
    index("courses_published_idx").on(t.isPublished),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    content: text("content").notNull(),
    videoUrl: text("video_url"),
    durationMinutes: integer("duration_minutes").notNull().default(10),
    position: integer("position").notNull(),
    ...timestamps,
  },
  (t) => [index("lessons_course_idx").on(t.courseId, t.position)],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    progress: integer("progress").notNull().default(0),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("enrollments_user_course_idx").on(t.userId, t.courseId),
    index("enrollments_course_idx").on(t.courseId),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lesson_progress_enrollment_lesson_idx").on(t.enrollmentId, t.lessonId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, { fields: [courses.createdBy], references: [users.id] }),
  lessons: many(lessons),
  enrollments: many(enrollments),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  completedLessons: many(lessonProgress),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollments.id],
  }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
}));

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type CourseLevel = (typeof levelEnum.enumValues)[number];
