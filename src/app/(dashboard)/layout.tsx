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
        <div className="flex flex-col flex-1 border-r border-border bg-sidebar">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 h-16 px-6 font-bold text-lg border-b border-border"
          >
            <Film className="h-5 w-5 text-primary" />
            <span className="text-sidebar-foreground">VidBack</span>
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-3 flex items-center justify-between">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 border-b border-border bg-card flex items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg text-foreground"
        >
          <Film className="h-5 w-5 text-primary" />
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
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
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
