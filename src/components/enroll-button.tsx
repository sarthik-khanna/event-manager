"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { api, ApiClientError } from "@/lib/client";

export function EnrollButton({
  courseId,
  role,
  enrollmentId,
}: {
  courseId: string;
  role: "student" | "admin" | null;
  enrollmentId?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (role === "admin") {
    return (
      <ButtonLink href={`/admin/courses/${courseId}/edit`} variant="secondary" size="lg" className="w-full">
        Edit course
      </ButtonLink>
    );
  }
  if (!role) {
    return (
      <ButtonLink href={`/login?next=/courses/${courseId}`} size="lg" className="w-full">
        Log in to enroll
      </ButtonLink>
    );
  }
  if (enrollmentId) {
    return (
      <ButtonLink href={`/student/learn/${enrollmentId}`} size="lg" className="w-full">
        Continue learning
      </ButtonLink>
    );
  }

  async function enroll() {
    setLoading(true);
    try {
      const enrollment = await api<{ id: string }>("/api/enrollments", { method: "POST", json: { courseId } });
      toast("Enrolled! Let's start learning.");
      router.push(`/student/learn/${enrollment.id}`);
      router.refresh();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Could not enroll", "error");
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" loading={loading} onClick={enroll}>
      Enroll now — it&apos;s free
    </Button>
  );
}
