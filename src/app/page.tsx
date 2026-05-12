import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BetaCounter } from "@/components/ui/BetaCounter";
import {
  Film,
  MessageSquare,
  Link2,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  Share2,
  Play,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-foreground"
          >
            <Film className="h-6 w-6 text-primary" />
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

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 -mr-40 -mt-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-40 -ml-40 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              {/* Tagline */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                The simplest way to collect video feedback
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Stop emailing video drafts.{" "}
                <span className="text-primary">Share a link instead.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                No more "at 3:42 — no wait, 4:15 — actually 3:48." VidBack gives
                clients a simple video player where every comment is pinned to
                the exact moment in the timeline. You see exactly what needs to
                change, instantly.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Start for free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="secondary" size="lg">
                    See how it works
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {[
                  { label: "Time-coded comments", icon: Clock },
                  { label: "No client sign-up", icon: Users },
                  { label: "One link to share", icon: Share2 },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  >
                    <stat.icon className="h-4 w-4 text-primary" />
                    {stat.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section
          id="how-it-works"
          className="border-b border-border py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Three steps to clear feedback
              </h2>
              <p className="mt-4 text-muted-foreground">
                From upload to resolution — get your video feedback organized in
                minutes.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload & Share",
                  body: "Upload your video file or paste a URL. VidBack generates a unique, private link you send to your client. No account needed on their end.",
                  icon: Film,
                  color: "bg-primary/10 text-primary",
                },
                {
                  step: "02",
                  title: "Client Reviews",
                  body: 'Your client watches the video in a clean player. They click "Add Comment," type their feedback, and the exact timestamp is captured automatically.',
                  icon: MessageSquare,
                  color: "bg-secondary/10 text-secondary",
                },
                {
                  step: "03",
                  title: "Resolve & Iterate",
                  body: "Every comment appears on your dashboard pinned to the timeline. Reply, mark resolved, and track progress — all without digging through email chains.",
                  icon: CheckCircle,
                  color: "bg-primary/10 text-primary",
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground/50">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why VidBack ─── */}
        <section className="border-b border-border py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Why editors choose VidBack
              </h2>
              <p className="mt-4 text-muted-foreground">
                Designed for the real workflow of video production.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Precise time-stamps",
                  body: "No more guessing which frame. Every comment is anchored to the exact second — click it to jump straight there.",
                  icon: Clock,
                },
                {
                  title: "No client accounts",
                  body: "Your client gets a simple link. They watch, click, type. That's it. No sign-up, no password to remember.",
                  icon: Users,
                },
                {
                  title: "Organised dashboard",
                  body: "See all projects at a glance — comment counts, unresolved feedback, and project status. Prioritise what matters.",
                  icon: LayoutDashboard,
                },
                {
                  title: "Resolve & track",
                  body: "Mark comments as resolved as you make changes. Both you and your client always know what's been addressed.",
                  icon: CheckCircle,
                },
                {
                  title: "Public share links",
                  body: "Each project gets a unique, private link. Share it via email, Slack, or your project management tool.",
                  icon: Share2,
                },
                {
                  title: "Real-time updates",
                  body: "Comments appear instantly across devices. No page refresh needed — both sides stay in sync.",
                  icon: Play,
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Use Cases ─── */}
        <section className="border-b border-border py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for real workflows
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  role: "Freelance Editors",
                  scenario:
                    "Send review links directly to clients. No more screen recording your timeline and posting to YouTube unlisted.",
                },
                {
                  role: "Post-Production Studios",
                  scenario:
                    "Keep every round of feedback organised per project. Your team sees the same timeline your client does.",
                },
                {
                  role: "Content Creators",
                  scenario:
                    "Share drafts with your editor or collaborator. Pinpoint exactly which cuts need work without scheduling a call.",
                },
                {
                  role: "Agency Producers",
                  scenario:
                    "Collect client feedback in one place. Share the review link with stakeholders and track approvals.",
                },
                {
                  role: "Video Teams",
                  scenario:
                    "Replace long email threads and Slack messages with a single timeline. Everyone sees the same feedback.",
                },
                {
                  role: "YouTubers & Streamers",
                  scenario:
                    "Share raw edits with your editor. Leave voice notes or text feedback pinned to the moment.",
                },
              ].map((useCase) => (
                <div
                  key={useCase.role}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="font-semibold text-foreground">
                    {useCase.role}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {useCase.scenario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Beta Counter ─── */}
        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="rounded-2xl border border-border bg-card px-8 py-10 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Limited Beta
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Join early and shape the product
              </p>
              <BetaCounter />
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="rounded-2xl border border-border bg-card px-8 py-16 shadow-sm sm:px-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to simplify your feedback?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Stop chasing clients for timestamp corrections. Send one link,
                get precise feedback, and ship faster.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Create your free account <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    I already have an account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm text-foreground"
          >
            <Film className="h-4 w-4 text-primary" />
            VidBack
          </Link>
          <p className="text-sm text-muted-foreground/70">
            &copy; {new Date().getFullYear()} VidBack. Built for video editors.
          </p>
        </div>
      </footer>
    </div>
  );
}
