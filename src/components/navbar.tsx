import Link from "next/link";
import { dashboardPath } from "@/lib/jwt";
import { getSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";
import { buttonClass } from "./ui/button";
import { LogoMark } from "./ui/sidebar";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <LogoMark /> <span className="hidden sm:inline">LearnHub</span>
          </Link>
          <Link href="/courses" className="text-sm text-neutral-400 transition hover:text-white">
            Courses
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href={dashboardPath(session.role)} className={buttonClass("primary", "sm")}>
                Dashboard
              </Link>
              <LogoutButton className={buttonClass("ghost", "sm")} />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-neutral-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} LearnHub · Online Course Management System</p>
        <p>Built with Next.js, Tailwind CSS, Aceternity UI &amp; Neon PostgreSQL</p>
      </div>
    </footer>
  );
}
