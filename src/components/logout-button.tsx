"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, children }: { className?: string; children?: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button onClick={logout} disabled={pending} className={cn("cursor-pointer", className)}>
      {children ?? (
        <>
          <LogOut className="size-4" /> Logout
        </>
      )}
    </button>
  );
}
