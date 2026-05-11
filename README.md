# VidBack — Video Feedback, Pinned to the Timeline

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare)](https://cloudflare.com)

**Replace messy email chains with a single link.** VidBack lets video editors share drafts with clients and receive time-coded feedback pinned directly to the video timeline. No login required for reviewers.

---

## ✨ Features

- **Time-coded comments** — Clients pause the video, type feedback, and the exact timestamp is captured automatically
- **Public review links** — Each project gets a unique shareable link; clients don't need to sign up
- **Editor dashboard** — See all projects, comment counts, unresolved feedback at a glance
- **Resolve & reply** — Mark feedback as resolved, reply to comments, keep the thread tidy
- **Real-time sync** — Comments appear on both sides without page refresh (polling every 10s)
- **Optimistic UI** — Comments appear instantly, roll back gracefully on error
- **Video upload** — Upload via URL or direct file upload to Cloudflare R2 (S3-compatible)
- **Dark mode** — Built-in theme toggle
- **Keyboard shortcuts** — `Space` play/pause, `J`/`L` rewind/forward 10s, `C` add comment

---

## 🧰 Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (or any pg) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) |
| **Auth** | [Better Auth](https://better-auth.com) (email/password) |
| **Storage** | [Cloudflare R2](https://cloudflare.com) (S3-compatible, presigned URLs) |
| **Icons** | [Lucide](https://lucide.dev) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A PostgreSQL database ([Neon](https://neon.tech) is free and easy)
- A Cloudflare R2 bucket + API token (or skip for URL-only mode)

### 1. Clone and install

```bash
git clone https://github.com/itsdvvn/vidback.git
cd vidback
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Run `openssl rand -hex 32` to generate |
| `BETTER_AUTH_URL` | `http://localhost:3000` for local dev |
| `R2_ACCOUNT_ID` | Your Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 API token |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | Bucket name (created automatically) |

### 3. Push the database schema

```bash
npx drizzle-kit push
```

### 4. Run the dev server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** 🎉

### 5. Create your editor account

Visit `/signup`, register, and start creating projects.

---

## 📁 Project Structure

```
vidback/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & sign-up pages
│   │   ├── (dashboard)/     # Dashboard & project editor views
│   │   ├── v/[token]/       # Public client review page
│   │   └── api/
│   │       ├── auth/        # BetterAuth API handler
│   │       ├── upload/      # Presigned R2 upload URL generator
│   │       ├── video/       # Refresh expired presigned URLs
│   │       └── public/      # Public project data API
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Badge, Skeleton
│   │   ├── video/           # VideoPlayer, Timeline, PlaybackControls
│   │   ├── comments/        # CommentList, CommentInput, CommentThread
│   │   ├── dashboard/       # ProjectCard, ProjectForm, ShareLinkCopy
│   │   └── providers/       # ThemeProvider
│   ├── lib/
│   │   ├── actions.ts       # Server actions (auth-guarded)
│   │   ├── auth.ts          # BetterAuth config
│   │   ├── auth-client.ts   # BetterAuth browser client
│   │   ├── r2.ts            # Cloudflare R2 S3 client
│   │   └── utils.ts         # cn() helper
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema (users, projects, comments)
│   │   └── index.ts         # DB connection
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── proxy.ts             # Auth middleware (Next.js 16 proxy convention)
```

---

## 🛡️ Security

- **Authentication required** for all editor routes (middleware + server actions)
- **Secrets in environment variables** only — `.env` is gitignored
- **R2 presigned URLs** — uploads use temporary PUT URLs, playback uses 7-day GET URLs
- **Password hashing** handled by Better Auth
- **No API keys** in client-side code
- **Input validation** via Zod on all server actions

---

## 📸 Screenshots

*(Add screenshots of your deployed app here)*

| Landing | Client Review | Editor Dashboard |
|---------|---------------|------------------|
| ![Landing](https://via.placeholder.com/400x250?text=Landing+Page) | ![Review](https://via.placeholder.com/400x250?text=Client+Review) | ![Dashboard](https://via.placeholder.com/400x250?text=Editor+Dashboard) |

---

## 🧪 Testing the flow

1. **Sign up** at `/signup` as an editor
2. **Create a project** at `/projects/new` — paste a video URL or upload a file
3. **Share the link** — copy the generated link and open it in another tab
4. **Add comments** on the client page — comments sync in real-time
5. **Resolve feedback** on the editor dashboard — markers change on the timeline

---

## 📄 License

MIT
