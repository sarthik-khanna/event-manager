import { BackgroundGrid } from "@/components/ui/background-grid";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <BackgroundGrid />
      <div className="relative">
        <p className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-8xl font-black text-transparent">404</p>
        <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-neutral-400">The page you&apos;re looking for doesn&apos;t exist or was removed.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/courses" variant="secondary">
            Browse courses
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
