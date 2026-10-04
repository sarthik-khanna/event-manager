"use client";

import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  PlusCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { LogoMark, Sidebar, SidebarBody, SidebarLink, SidebarText, type SidebarLinkItem } from "@/components/ui/sidebar";

const links: Record<"student" | "admin", SidebarLinkItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard /> },
    { label: "My courses", href: "/student/courses", icon: <GraduationCap /> },
    { label: "Browse catalog", href: "/courses", icon: <Library /> },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard /> },
    { label: "Courses", href: "/admin/courses", icon: <BookOpen /> },
    { label: "New course", href: "/admin/courses/new", icon: <PlusCircle /> },
    { label: "Enrollments", href: "/admin/enrollments", icon: <ListChecks /> },
    { label: "Users", href: "/admin/users", icon: <Users /> },
  ],
};

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: "student" | "admin" };
  children: ReactNode;
}) {
  return (
    <Sidebar>
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Link href="/" className="flex items-center gap-3 px-1 py-1 font-semibold text-white">
              <LogoMark />
              <SidebarText className="font-semibold">LearnHub</SidebarText>
            </Link>
            <p className="mt-6 mb-2 px-2 text-[10px] tracking-widest text-neutral-600 uppercase">
              <SidebarText>{user.role === "admin" ? "Admin" : "Student"}</SidebarText>
            </p>
            <nav className="flex flex-col gap-1">
              {links[user.role].map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-1 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-3 px-1 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-black">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <SidebarText className="min-w-0">
                <span className="block truncate text-sm text-white">{user.name}</span>
                <span className="block truncate text-xs text-neutral-500">{user.email}</span>
              </SidebarText>
            </div>
            <LogoutButton className="group/sidebar flex items-center gap-3 rounded-lg px-2 py-2 text-neutral-400 hover:bg-white/5 hover:text-white">
              <LogOut className="size-5 shrink-0" />
              <SidebarText>Logout</SidebarText>
            </LogoutButton>
          </div>
        </SidebarBody>
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </Sidebar>
  );
}
