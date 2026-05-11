"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Film,
  LayoutDashboard,
  Settings,
  LogOut,
  Plus,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects/new", label: "New Project", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 h-16 px-6 font-bold text-lg border-b border-zinc-200 dark:border-zinc-800"
          >
            <Film className="h-5 w-5 text-indigo-600" />
            <span className="text-zinc-900 dark:text-white">VidBack</span>
          </Link>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800 flex items-center justify-between">
            <Button
              variant="ghost"
              className="justify-start flex-1"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <Film className="h-5 w-5 text-indigo-600" />
          VidBack
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400",
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>

      <main className="flex-1 md:pl-64">
        <div className="pt-14 md:pt-0">{children}</div>
      </main>
    </div>
  );
}
