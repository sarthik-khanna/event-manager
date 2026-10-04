"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Aceternity UI — Sidebar (hover-to-expand on desktop, slide-in drawer on mobile)

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const SidebarContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <Sidebar>");
  return ctx;
}

export function Sidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

export function SidebarBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

function DesktopSidebar({ className, children }: { className?: string; children: ReactNode }) {
  const { open, setOpen } = useSidebar();
  return (
    <motion.aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.06] bg-neutral-950 px-4 py-4 md:flex",
        className,
      )}
      animate={{ width: open ? 260 : 68 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  );
}

function MobileSidebar({ className, children }: { className?: string; children: ReactNode }) {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-white/[0.06] bg-neutral-950/90 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <LogoMark /> LearnHub
        </Link>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="text-neutral-200">
          <Menu className="size-6" />
        </button>
      </div>
      {/* Sibling of the header, not a child: backdrop-blur makes the header the containing block
          for `fixed` descendants, which would shrink the drawer to the header's 56px height. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn("fixed inset-0 z-[100] flex h-full w-full flex-col bg-neutral-950 p-6 md:hidden", className)}
          >
            <button
              aria-label="Close menu"
              className="absolute top-5 right-5 text-neutral-200"
              onClick={() => setOpen(false)}
            >
              <X className="size-6" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarLink({ link, className, ...props }: { link: SidebarLinkItem } & Omit<ComponentProps<typeof Link>, "href">) {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const root = link.href.split("/").length <= 2;
  const active = root ? pathname === link.href : pathname.startsWith(link.href);

  return (
    <Link
      href={link.href}
      onClick={() => setOpen(false)}
      className={cn(
        "group/sidebar flex items-center justify-start gap-3 rounded-lg px-2 py-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white",
        active && "bg-white/[0.07] text-white",
        className,
      )}
      {...props}
    >
      <span className="shrink-0 [&>svg]:size-5">{link.icon}</span>
      <SidebarText>{link.label}</SidebarText>
    </Link>
  );
}

/** Text that fades out when the desktop sidebar is collapsed (always shown on mobile). */
export function SidebarText({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useSidebar();
  return (
    <motion.span
      animate={{ opacity: open ? 1 : 0 }}
      className={cn(
        "inline-block text-sm whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1 max-md:!opacity-100",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-black text-black",
        className,
      )}
    >
      L
    </span>
  );
}
