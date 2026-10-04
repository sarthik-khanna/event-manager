import Link from "next/link";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { LogoMark } from "@/components/ui/sidebar";
import { Spotlight } from "@/components/ui/spotlight";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col px-4 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <LogoMark /> LearnHub
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-white/[0.06] bg-neutral-950 lg:flex lg:items-center lg:justify-center">
        <BackgroundGrid variant="dot" />
        <Spotlight className="-top-40 left-0" fill="#818cf8" />
        <div className="relative z-10 max-w-md px-10">
          <h2 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent">
            Your learning journey, organised.
          </h2>
          <p className="mt-4 text-neutral-400">
            Enroll in courses, track every completed lesson and pick up exactly where you left off.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-neutral-300">
            {["Secure JWT-based sessions", "Personal progress dashboard", "Search & filter the full catalog"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
