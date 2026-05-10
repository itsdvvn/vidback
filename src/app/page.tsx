import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Film, MessageSquare, Link2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-white">
            <Film className="h-6 w-6 text-indigo-600" />
            VidBack
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            Video feedback,{" "}
            <span className="text-indigo-600">pinned to the timeline</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Replace messy email chains with a single link. Clients watch your
            video and leave time-coded comments directly on the timeline. No
            login required for reviewers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg">Start as Editor</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg">
                How it works
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Film className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">1. Upload Your Video</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Upload your draft or paste a URL. VidBack generates a unique, private link to share with your client.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">2. Client Reviews</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Your client watches the video, clicks to add a comment, and the timestamp is captured automatically. No sign-up needed.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Link2 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">3. Resolve Feedback</h3>
              <p className="mt-2 text-sm text-zinc-500">
                See every comment pinned to the timeline. Reply, mark as resolved, and keep your iterations organized in one place.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-4">
          <p className="text-sm text-zinc-400">&copy; {new Date().getFullYear()} VidBack. Built for video editors.</p>
        </div>
      </footer>
    </div>
  );
}
