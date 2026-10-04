import {
  BarChart3,
  BookOpenCheck,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { ButtonLink } from "@/components/ui/button";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { MovingBorderLink } from "@/components/ui/moving-border";
import { ProgressBar } from "@/components/ui/misc";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import type { CourseSummary } from "@/lib/client";
import { listCourses } from "@/server/courses";

const features = [
  {
    title: "JWT Authentication",
    description: "Secure sign-up and login with hashed passwords and signed, httpOnly JWT cookies.",
    icon: <LockKeyhole className="size-6" />,
  },
  {
    title: "Role-based Access",
    description: "Two roles — students learn, admins manage. Every page and API route is guarded.",
    icon: <ShieldCheck className="size-6" />,
  },
  {
    title: "Course Catalog",
    description: "Browse published courses with lessons, durations, instructors and difficulty levels.",
    icon: <BookOpenCheck className="size-6" />,
  },
  {
    title: "Search & Filters",
    description: "Find courses instantly by keyword, category and level, sorted the way you want.",
    icon: <Search className="size-6" />,
  },
  {
    title: "Progress Tracking",
    description: "Mark lessons complete and watch your progress update in real time across devices.",
    icon: <TrendingUp className="size-6" />,
  },
  {
    title: "Responsive Dashboards",
    description: "Polished student and admin dashboards that work beautifully on phones and desktops.",
    icon: <Smartphone className="size-6" />,
  },
];

async function featuredCourses(): Promise<CourseSummary[]> {
  try {
    const { items } = await listCourses({ sort: "popular", page: 1, limit: 3 }, null);
    return JSON.parse(JSON.stringify(items));
  } catch {
    return []; // Landing page still renders if the database is unreachable.
  }
}

export default async function HomePage() {
  const courses = await featuredCourses();

  return (
    <>
      <section className="relative flex min-h-[38rem] w-full overflow-hidden md:items-center md:justify-center">
        <BackgroundGrid />
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-24 pb-16 md:pt-0">
          <p className="mx-auto mb-6 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-neutral-300">
            Online Course Management System
          </p>
          <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold text-transparent md:text-7xl">
            Learn, teach and track <br /> progress in one place.
          </h1>
          <TextGenerateEffect
            className="mx-auto mt-6 max-w-2xl text-center text-base text-neutral-300"
            words="LearnHub helps admins publish courses and manage enrollments, while students discover courses, enroll in a click and track every lesson they complete."
          />
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MovingBorderLink href="/courses">Explore courses</MovingBorderLink>
            <ButtonLink href="/register" variant="secondary" size="lg" className="w-44">
              Create account
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Everything a course platform needs</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">
          Built on a REST API with a Neon PostgreSQL database behind it.
        </p>
        <HoverEffect items={features} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <BentoGrid>
          <BentoGridItem
            className="md:col-span-2"
            title="Student dashboard"
            description="See enrolled courses, continue where you left off and track completion."
            icon={<GraduationCap className="size-5 text-indigo-400" />}
            header={
              <div className="flex flex-1 flex-col justify-center gap-3 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-5">
                {[82, 45, 100].map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 truncate text-xs text-neutral-400">Course {i + 1}</span>
                    <ProgressBar value={v} />
                    <span className="w-10 text-right text-xs text-neutral-300">{v}%</span>
                  </div>
                ))}
              </div>
            }
          />
          <BentoGridItem
            title="Admin analytics"
            description="Enrollments, completion rates and top courses at a glance."
            icon={<BarChart3 className="size-5 text-cyan-400" />}
            header={
              <div className="flex flex-1 items-end gap-2 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-5">
                {[40, 70, 55, 90, 65].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/60 to-cyan-400/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            }
          />
          <BentoGridItem
            title="Smart filtering"
            description="Keyword search with category, level and sort filters."
            icon={<Filter className="size-5 text-emerald-400" />}
            header={
              <div className="flex flex-1 flex-wrap content-center gap-2 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-5">
                {["Web Development", "Beginner", "Design", "Popular", "Data Science"].map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                    {t}
                  </span>
                ))}
              </div>
            }
          />
          <BentoGridItem
            className="md:col-span-2"
            title="Course management"
            description="Create courses, organise lessons, publish or keep drafts — all from the admin panel."
            icon={<LayoutDashboard className="size-5 text-amber-400" />}
            header={
              <div className="flex flex-1 flex-col justify-center gap-2 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-5">
                {["Introduction", "Core concepts", "Hands-on project"].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-xs text-neutral-300">
                    <span className="flex size-5 items-center justify-center rounded bg-indigo-500/20 text-indigo-300">{i + 1}</span>
                    {t}
                  </div>
                ))}
              </div>
            }
          />
        </BentoGrid>
      </section>

      {courses.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Popular courses</h2>
              <p className="mt-2 text-neutral-400">The most enrolled courses right now.</p>
            </div>
            <ButtonLink href="/courses" variant="secondary">
              View all
            </ButtonLink>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
