# VidBack — Video Feedback, Pinned to the Timeline

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare)](https://cloudflare.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui)](https://ui.shadcn.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Replace messy email chains with a single link.** VidBack lets video editors share drafts with clients and receive time-coded feedback pinned directly to the video timeline. No login required for reviewers.

**🌐 Live demo:** [https://vidback.yudhisetiawan.my.id](https://vidback.yudhisetiawan.my.id)

---

## ✨ Features

- **Time-coded comments** — Clients pause the video, type feedback, and the exact timestamp is captured automatically
- **Public review links** — Each project gets a unique shareable link; clients don't need to sign up
- **Editor dashboard** — See all projects, comment counts, unresolved feedback at a glance
- **Resolve & reply** — Mark feedback as resolved, reply to comments, keep the thread tidy
- **Real-time sync** — Comments appear on both sides without page refresh (polling every 10s)
- **Optimistic UI** — Comments appear instantly, roll back gracefully on error
- **Video upload** — Upload via URL or direct file upload to Cloudflare R2 (S3-compatible)
- **Video thumbnails** — Auto-captured from the first frame using ffmpeg.wasm (server-side)
- **Dark mode** — Built-in theme toggle with shadcn CSS variables
- **Keyboard shortcuts** — `Space` play/pause, `J`/`L` rewind/forward 10s, `C` add comment
- **Storage limits** — 500 MB per user, max 3 videos (unlimited for admin)
- **Beta user cap** — Limited to 10 users during beta
- **Client identity** — Email-based recognition with name autofill
- **Notifications** — Toast notifications for new comments + notifications page
- **Notion-style name dropdown** — Quick-switch between previously used names
- **Google Drive-style storage bar** — Visual storage usage in the sidebar
- **Delete project** — Removes project, comments, and R2 media in one click

---

## 🧰 Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) |
| **Theming** | [tweakcn](https://tweakcn.com) (visual theme editor) |
| **Database** | PostgreSQL (via Docker Compose) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) |
| **Auth** | [Better Auth](https://better-auth.com) (email/password) |
| **Storage** | [Cloudflare R2](https://cloudflare.com) (S3-compatible, presigned URLs) |
| **Thumbnails** | [ffmpeg.wasm](https://github.com/nicedoc/ffmpeg.wasm) (server-side WASM) |
| **Reverse proxy** | [Traefik](https://traefik.io) with automatic Let's Encrypt SSL |
| **Hosting** | Self-hosted on Debian 12 VPS via Docker Compose |
| **Icons** | [Lucide](https://lucide.dev) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- A Cloudflare R2 bucket + API token (optional — URL-only mode works without it)

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
| `R2_BUCKET` | Bucket name |

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

## 🐳 Docker Deployment

```bash
git clone https://github.com/itsdvvn/vidback.git
cd vidback

# Create .env with your secrets
cp .env.example .env

# Build and run
docker compose build
docker compose up -d
```

The app runs on port `3001` (configurable in `docker-compose.yml`). Traefik labels are included for automatic SSL via Let's Encrypt.

---

## 📁 Project Structure

```
vidback/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login & sign-up pages
│   │   ├── (dashboard)/         # Dashboard, projects, settings, notifications
│   │   ├── v/[token]/           # Public client review page
│   │   └── api/
│   │       ├── auth/            # BetterAuth API handler
│   │       ├── upload/          # Presigned R2 upload URL generator
│   │       ├── video/           # Refresh expired presigned URLs
│   │       ├── thumbnail/       # ffmpeg.wasm thumbnail generation
│   │       ├── beta/            # Beta stats & storage usage
│   │       ├── client/          # Client identity check
│   │       └── public/          # Public project data API
│   ├── components/
│   │   ├── ui/                  # Button, Card, Input, Badge, Skeleton, Toast
│   │   ├── video/               # VideoPlayer, Timeline, PlaybackControls
│   │   ├── comments/            # CommentList, CommentInput, CommentThread
│   │   ├── dashboard/           # ProjectCard, ProjectForm, StorageBar, StatusSelector
│   │   └── providers/           # ThemeProvider
│   ├── lib/
│   │   ├── actions.ts           # Server actions (auth-guarded, rate-limited)
│   │   ├── auth.ts              # BetterAuth config
│   │   ├── auth-client.ts       # BetterAuth browser client
│   │   ├── r2.ts                # Cloudflare R2 S3 client
│   │   ├── thumbnail.ts         # ffmpeg.wasm + browser canvas capture
│   │   └── utils.ts             # cn() helper
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema (users, projects, comments)
│   │   └── index.ts             # DB connection
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   └── proxy.ts                 # Auth middleware (Next.js 16 proxy convention)
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # Compose config with Traefik
└── components.json              # shadcn/ui configuration
```

---

## 🛡️ Security

- **Authentication required** for all editor routes (middleware + server actions)
- **Secrets in environment variables** only — `.env` is gitignored
- **R2 presigned URLs** — uploads use temporary PUT URLs, playback uses 7-day GET URLs
- **Password hashing** handled by Better Auth
- **No API keys** in client-side code
- **Input validation** via Zod on all server actions
- **Storage limits** — 500 MB and 3 videos per user enforced server-side
- **Beta user cap** — Maximum 10 accounts (admin has unlimited)

---

## 🌐 Deployment

The app is deployed on a self-hosted Debian 12 VPS:

| Service | URL |
|---------|-----|
| **VidBack app** | [https://vidback.yudhisetiawan.my.id](https://vidback.yudhisetiawan.my.id) |
| **PostgreSQL** | Docker Compose — internal network only |
| **Reverse proxy** | Traefik with automatic Let's Encrypt SSL |
| **Storage** | Cloudflare R2 (presigned URLs, 7-day expiry) |

### Infrastructure

- **Containers**: Docker Compose with separate app + database containers
- **Docker Compose location**: `/opt/vidback/compose/`
- **Environment file**: `/opt/vidback/compose/.env` (chmod 600)

---

## 🧪 Testing the flow

1. **Sign up** at `/signup` as an editor
2. **Create a project** at `/projects/new` — paste a video URL or upload a file
3. **Share the link** — copy the generated link and open it in another tab
4. **Add comments** on the client page — comments sync in real-time
5. **Resolve feedback** on the editor dashboard — markers change on the timeline
6. **Check storage** — bottom-left sidebar shows your used / total storage

---

## 📄 License

MIT
