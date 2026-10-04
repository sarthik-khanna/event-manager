"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, Card } from "@/components/ui/misc";
import { api, ApiClientError, type CourseDetail } from "@/lib/client";
import { capitalize, COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/utils";
import { courseInputSchema, fieldErrors } from "@/lib/validations";

interface LessonState {
  key: string;
  id?: string;
  title: string;
  content: string;
  videoUrl: string;
  durationMinutes: string;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  level: string;
  instructor: string;
  thumbnailUrl: string;
  durationHours: string;
  isPublished: boolean;
  lessons: LessonState[];
}

const emptyLesson = (): LessonState => ({
  key: crypto.randomUUID(),
  title: "",
  content: "",
  videoUrl: "",
  durationMinutes: "10",
});

function initialState(course?: CourseDetail): FormState {
  if (!course) {
    return {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      instructor: "",
      thumbnailUrl: "",
      durationHours: "1",
      isPublished: true,
      lessons: [emptyLesson()],
    };
  }
  return {
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    instructor: course.instructor,
    thumbnailUrl: course.thumbnailUrl ?? "",
    durationHours: String(course.durationHours),
    isPublished: course.isPublished,
    lessons: course.lessons.map((l) => ({
      key: l.id,
      id: l.id,
      title: l.title,
      content: l.content,
      videoUrl: l.videoUrl ?? "",
      durationMinutes: String(l.durationMinutes),
    })),
  };
}

function toPayload(state: FormState) {
  return {
    ...state,
    lessons: state.lessons.map(({ key: _key, ...l }) => l),
  };
}

export function CourseForm({ course }: { course?: CourseDetail }) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<FormState>(() => initialState(course));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function validate(next: FormState) {
    const result = courseInputSchema.safeParse(toPayload(next));
    return result.success ? {} : fieldErrors(result.error);
  }

  function update(next: FormState) {
    setState(next);
    if (submitted) setErrors(validate(next));
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => update({ ...state, [key]: value });

  function setLesson(index: number, patch: Partial<LessonState>) {
    update({ ...state, lessons: state.lessons.map((l, i) => (i === index ? { ...l, ...patch } : l)) });
  }

  function moveLesson(index: number, dir: -1 | 1) {
    const lessons = [...state.lessons];
    const target = index + dir;
    if (target < 0 || target >= lessons.length) return;
    [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
    update({ ...state, lessons });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");
    const errs = validate(state);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      await api<CourseDetail>(course ? `/api/courses/${course.id}` : "/api/courses", {
        method: course ? "PATCH" : "POST",
        json: toPayload(state),
      });
      const status = state.isPublished ? "published" : "saved as a draft — students can't see it yet";
      toast(course ? `Course updated (${state.isPublished ? "published" : "draft"})` : `Course created and ${status}`);
      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        if (err.details) setErrors(err.details);
      } else setFormError("Network error. Please try again.");
      setSaving(false);
    }
  }

  const err = (key: string) => errors[key];
  const invalid = (key: string) => Boolean(errors[key]);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && <Alert>{formError}</Alert>}

      <Card className="space-y-5 p-6">
        <h2 className="font-semibold text-white">Course details</h2>
        <Field label="Title" htmlFor="title" error={err("title")}>
          <Input id="title" value={state.title} onChange={(e) => set("title", e.target.value)} aria-invalid={invalid("title")} placeholder="e.g. Modern React from Scratch" />
        </Field>
        <Field label="Description" htmlFor="description" error={err("description")} hint="At least 20 characters.">
          <Textarea id="description" rows={5} value={state.description} onChange={(e) => set("description", e.target.value)} aria-invalid={invalid("description")} placeholder="What will students learn?" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={err("category")}>
            <Select id="category" value={state.category} onChange={(e) => set("category", e.target.value)} aria-invalid={invalid("category")}>
              <option value="">Select a category</option>
              {COURSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level" htmlFor="level" error={err("level")}>
            <Select id="level" value={state.level} onChange={(e) => set("level", e.target.value)} aria-invalid={invalid("level")}>
              {COURSE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {capitalize(l)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Instructor" htmlFor="instructor" error={err("instructor")}>
            <Input id="instructor" value={state.instructor} onChange={(e) => set("instructor", e.target.value)} aria-invalid={invalid("instructor")} placeholder="Instructor name" />
          </Field>
          <Field label="Duration (hours)" htmlFor="durationHours" error={err("durationHours")}>
            <Input id="durationHours" type="number" min={1} max={500} value={state.durationHours} onChange={(e) => set("durationHours", e.target.value)} aria-invalid={invalid("durationHours")} />
          </Field>
        </div>
        <Field label="Thumbnail URL" htmlFor="thumbnailUrl" error={err("thumbnailUrl")} hint="Optional https:// image link.">
          <Input id="thumbnailUrl" value={state.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} aria-invalid={invalid("thumbnailUrl")} placeholder="https://images.unsplash.com/…" />
        </Field>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${
            state.isPublished ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <input
            type="checkbox"
            checked={state.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="mt-0.5 size-4 accent-indigo-500"
          />
          <span>
            <span className="block font-medium text-neutral-100">Publish this course</span>
            <span className="mt-0.5 block text-neutral-400">
              {state.isPublished
                ? "Visible to all students in the course catalog."
                : "Saved as a draft. Only admins can see it until you publish it."}
            </span>
          </span>
        </label>
      </Card>

      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Lessons</h2>
            <p className="text-sm text-neutral-500">{state.lessons.length} lesson(s). Order determines the learning path.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => update({ ...state, lessons: [...state.lessons, emptyLesson()] })}>
            <Plus className="size-4" /> Add lesson
          </Button>
        </div>
        {err("lessons") && <Alert>{err("lessons")}</Alert>}

        {state.lessons.map((lesson, i) => (
          <div key={lesson.key} className="space-y-4 rounded-xl border border-white/[0.08] bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">Lesson {i + 1}</span>
              <div className="flex gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => moveLesson(i, -1)}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label="Move down" disabled={i === state.lessons.length - 1} onClick={() => moveLesson(i, 1)}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton
                  label="Remove lesson"
                  danger
                  disabled={state.lessons.length === 1}
                  onClick={() => update({ ...state, lessons: state.lessons.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Field label="Title" htmlFor={`lesson-${i}-title`} error={err(`lessons.${i}.title`)}>
                <Input id={`lesson-${i}-title`} value={lesson.title} onChange={(e) => setLesson(i, { title: e.target.value })} aria-invalid={invalid(`lessons.${i}.title`)} />
              </Field>
              <Field label="Minutes" htmlFor={`lesson-${i}-duration`} error={err(`lessons.${i}.durationMinutes`)}>
                <Input id={`lesson-${i}-duration`} type="number" min={1} value={lesson.durationMinutes} onChange={(e) => setLesson(i, { durationMinutes: e.target.value })} aria-invalid={invalid(`lessons.${i}.durationMinutes`)} />
              </Field>
            </div>
            <Field label="Content" htmlFor={`lesson-${i}-content`} error={err(`lessons.${i}.content`)}>
              <Textarea id={`lesson-${i}-content`} rows={4} value={lesson.content} onChange={(e) => setLesson(i, { content: e.target.value })} aria-invalid={invalid(`lessons.${i}.content`)} />
            </Field>
            <Field label="Video URL (optional)" htmlFor={`lesson-${i}-video`} error={err(`lessons.${i}.videoUrl`)} hint="YouTube links are embedded in the lesson player.">
              <Input id={`lesson-${i}-video`} value={lesson.videoUrl} onChange={(e) => setLesson(i, { videoUrl: e.target.value })} aria-invalid={invalid(`lessons.${i}.videoUrl`)} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>
          </div>
        ))}
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href="/admin/courses" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" variant="gradient" loading={saving}>
          {course ? "Save changes" : "Create course"}
        </Button>
      </div>
    </form>
  );
}

function IconButton({
  label,
  danger,
  children,
  ...props
}: { label: string; danger?: boolean } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`cursor-pointer rounded-md p-1.5 text-neutral-400 disabled:cursor-not-allowed disabled:opacity-30 ${danger ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-white/5 hover:text-white"}`}
      {...props}
    >
      {children}
    </button>
  );
}
