import type { ReactNode } from "react";
import Link from "next/link";
import { Film } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-2xl text-foreground"
      >
        <Film className="h-7 w-7 text-primary" />
        VidBack
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
