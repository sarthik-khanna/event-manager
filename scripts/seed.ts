/**
 * Seeds the database with demo users, courses, lessons and enrollments.
 * WARNING: wipes all existing data first.  Run with:  npm run db:seed
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

const { users, courses, lessons, enrollments, lessonProgress } = schema;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

type Level = "beginner" | "intermediate" | "advanced";
type Category = (typeof import("../src/lib/utils").COURSE_CATEGORIES)[number];

const courseData: {
  title: string;
  description: string;
  category: Category;
  level: Level;
  instructor: string;
  thumbnail: string;
  hours: number;
  published: boolean;
  lessons: string[];
}[] = [
  {
    title: "Modern React & Next.js",
    description:
      "Build production-ready web apps with React 19 and the Next.js App Router. Learn server components, data fetching, routing, authentication and deployment.",
    category: "Web Development",
    level: "intermediate",
    instructor: "Sarah Mitchell",
    thumbnail: "photo-1633356122544-f134324a6cee",
    hours: 14,
    published: true,
    lessons: ["Why Next.js?", "The App Router", "Server & Client Components", "Data Fetching and Caching", "Route Handlers & REST APIs", "Deploying to Vercel"],
  },
  {
    title: "JavaScript Fundamentals",
    description:
      "Start your programming journey with JavaScript. Variables, functions, arrays, objects, the DOM and asynchronous code explained from first principles.",
    category: "Web Development",
    level: "beginner",
    instructor: "David Park",
    thumbnail: "photo-1579468118864-1b9ea3c0db4a",
    hours: 10,
    published: true,
    lessons: ["Hello, JavaScript", "Variables and Types", "Functions", "Arrays and Objects", "Working with the DOM"],
  },
  {
    title: "Python for Data Analysis",
    description:
      "Use Python, pandas and matplotlib to clean, analyse and visualise real-world datasets. Perfect first step into data science.",
    category: "Data Science",
    level: "beginner",
    instructor: "Anita Rao",
    thumbnail: "photo-1526379095098-d400fd0bf935",
    hours: 12,
    published: true,
    lessons: ["Python Refresher", "Intro to pandas", "Cleaning Messy Data", "Grouping and Aggregation", "Visualising with matplotlib"],
  },
  {
    title: "Machine Learning Essentials",
    description:
      "Understand the core algorithms behind modern machine learning — regression, classification, trees and neural networks — and train them with scikit-learn.",
    category: "Data Science",
    level: "advanced",
    instructor: "Dr. James Liu",
    thumbnail: "photo-1555949963-aa79dcee981c",
    hours: 20,
    published: true,
    lessons: ["What is Machine Learning?", "Linear Regression", "Classification Models", "Decision Trees and Forests", "Model Evaluation", "Intro to Neural Networks"],
  },
  {
    title: "UI/UX Design Principles",
    description:
      "Learn the fundamentals of user-centred design: research, wireframing, visual hierarchy, typography, colour and usability testing.",
    category: "Design",
    level: "beginner",
    instructor: "Maya Thompson",
    thumbnail: "photo-1561070791-2526d30994b5",
    hours: 8,
    published: true,
    lessons: ["Design Thinking", "User Research", "Wireframes and Prototypes", "Visual Hierarchy and Typography"],
  },
  {
    title: "Docker & Kubernetes in Practice",
    description:
      "Containerise applications with Docker and orchestrate them with Kubernetes. Covers images, compose, deployments, services and scaling.",
    category: "Cloud & DevOps",
    level: "intermediate",
    instructor: "Kevin O'Brien",
    thumbnail: "photo-1451187580459-43490279c0fa",
    hours: 16,
    published: true,
    lessons: ["Containers 101", "Writing Dockerfiles", "Docker Compose", "Kubernetes Architecture", "Deployments and Services"],
  },
  {
    title: "Flutter Mobile App Development",
    description:
      "Ship beautiful cross-platform mobile apps for iOS and Android from a single Dart codebase using Flutter widgets and state management.",
    category: "Mobile Development",
    level: "intermediate",
    instructor: "Lina Haddad",
    thumbnail: "photo-1512941937669-90a1b58e7e9c",
    hours: 18,
    published: true,
    lessons: ["Getting Started with Flutter", "Dart Essentials", "Layouts and Widgets", "State Management", "Publishing Your App"],
  },
  {
    title: "Product Management 101",
    description:
      "Discover how product managers turn ideas into shipped products — roadmaps, prioritisation, metrics and working with engineering teams.",
    category: "Business",
    level: "beginner",
    instructor: "Rachel Adams",
    thumbnail: "photo-1507679799987-c73779587ccf",
    hours: 6,
    published: false,
    lessons: ["The Role of a PM", "Discovery and Validation", "Roadmaps and Prioritisation", "Metrics that Matter"],
  },
];

const studentData = [
  { name: "Demo Student", email: "student@learnhub.dev" },
  { name: "Priya Sharma", email: "priya@example.com" },
  { name: "Rahul Verma", email: "rahul@example.com" },
  { name: "Emily Chen", email: "emily@example.com" },
  { name: "Carlos Diaz", email: "carlos@example.com" },
  { name: "Fatima Khan", email: "fatima@example.com" },
];

// [studentIndex, courseIndex, lessonsCompleted (-1 = all)]
const enrollmentPlan: [number, number, number][] = [
  [0, 0, 3], [0, 2, -1], [0, 4, 1], [0, 5, 0],
  [1, 0, -1], [1, 1, 4], [1, 3, 2],
  [2, 0, 5], [2, 5, 2], [2, 6, 1],
  [3, 2, 3], [3, 3, 6], [3, 4, -1],
  [4, 1, -1], [4, 6, 3],
  [5, 0, 1], [5, 2, 0], [5, 4, 2],
];

function lessonContent(title: string, course: string) {
  return [
    `Welcome to "${title}", part of ${course}.`,
    `In this lesson we cover the key ideas behind ${title.toLowerCase()}, walk through a practical example step by step, and finish with a short exercise so you can apply what you've learned straight away.`,
    `Key takeaways:\n• Understand the core concepts of ${title.toLowerCase()}\n• See how they are used in real projects\n• Practise with a guided exercise`,
    `When you're done, mark this lesson as complete to update your progress.`,
  ].join("\n\n");
}

async function main() {
  console.log("Resetting tables…");
  await db.execute(sql`TRUNCATE lesson_progress, enrollments, lessons, courses, users RESTART IDENTITY CASCADE`);

  console.log("Creating users…");
  const [adminHash, studentHash] = await Promise.all([bcrypt.hash("Admin@123", 10), bcrypt.hash("Student@123", 10)]);
  const [admin] = await db
    .insert(users)
    .values({ name: "Admin User", email: "admin@learnhub.dev", passwordHash: adminHash, role: "admin" })
    .returning();
  const students = await db
    .insert(users)
    .values(studentData.map((s) => ({ ...s, passwordHash: studentHash, role: "student" as const })))
    .returning();

  console.log("Creating courses and lessons…");
  const courseRows = courseData.map((c, i) => ({
    id: crypto.randomUUID(),
    title: c.title,
    description: c.description,
    category: c.category,
    level: c.level,
    instructor: c.instructor,
    thumbnailUrl: img(c.thumbnail),
    durationHours: c.hours,
    isPublished: c.published,
    createdBy: admin.id,
    // Stagger creation dates so "newest" sorting is meaningful.
    createdAt: new Date(Date.now() - (courseData.length - i) * 86_400_000 * 3),
  }));
  await db.insert(courses).values(courseRows);

  const lessonRows = courseData.flatMap((c, ci) =>
    c.lessons.map((title, position) => ({
      id: crypto.randomUUID(),
      courseId: courseRows[ci].id,
      title,
      content: lessonContent(title, c.title),
      durationMinutes: 8 + ((ci * 7 + position * 5) % 25),
      position,
    })),
  );
  await db.insert(lessons).values(lessonRows);

  console.log("Creating enrollments and progress…");
  const enrollmentRows = enrollmentPlan.map(([si, ci], i) => ({
    id: crypto.randomUUID(),
    userId: students[si].id,
    courseId: courseRows[ci].id,
    enrolledAt: new Date(Date.now() - (enrollmentPlan.length - i) * 3_600_000 * 20),
    lastAccessedAt: new Date(Date.now() - (enrollmentPlan.length - i) * 3_600_000 * 5),
  }));
  await db.insert(enrollments).values(enrollmentRows);

  const progressRows = enrollmentPlan.flatMap(([, ci, done], i) => {
    const courseLessons = lessonRows.filter((l) => l.courseId === courseRows[ci].id);
    const count = done === -1 ? courseLessons.length : Math.min(done, courseLessons.length);
    return courseLessons.slice(0, count).map((l) => ({ enrollmentId: enrollmentRows[i].id, lessonId: l.id }));
  });
  if (progressRows.length) await db.insert(lessonProgress).values(progressRows);

  await db.execute(sql`
    UPDATE enrollments e SET
      progress = sub.pct,
      status = CASE WHEN sub.pct = 100 THEN 'completed'::enrollment_status ELSE 'active'::enrollment_status END,
      completed_at = CASE WHEN sub.pct = 100 THEN e.last_accessed_at ELSE NULL END
    FROM (
      SELECT en.id,
        ((SELECT count(*) FROM lesson_progress lp WHERE lp.enrollment_id = en.id) * 100
          / GREATEST((SELECT count(*) FROM lessons l WHERE l.course_id = en.course_id), 1))::int AS pct
      FROM enrollments en
    ) sub
    WHERE e.id = sub.id
  `);

  console.log(`
Seed complete:
  ${students.length + 1} users, ${courseRows.length} courses, ${lessonRows.length} lessons, ${enrollmentRows.length} enrollments

  Admin   → admin@learnhub.dev   / Admin@123
  Student → student@learnhub.dev / Student@123`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
