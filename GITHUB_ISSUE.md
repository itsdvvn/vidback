## Deployment Specifications for VidBack

### Current Stack
| Layer | Technology | Status |
|-------|-----------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) | ✅ Running |
| **Database** | PostgreSQL (Neon serverless) | ✅ Connected |
| **Auth** | Better Auth (email/password) | ✅ Working |
| **Storage** | Cloudflare R2 (S3-compatible) | ✅ Upload & streaming |
| **Thumbnails** | ffmpeg.wasm (server-side WASM) | ✅ Generating |

---

### 🔧 Recommended Deployment Stack (Open-Source First)

#### Option A: Fully Open-Source Self-Hosted
| Layer | Tool | Cost | Notes |
|-------|------|------|-------|
| **Hosting** | Coolify + VPS (Hetzner $5/mo) | $5/mo | Open-source Vercel alternative |
| **Database** | PostgreSQL on VPS | $0 (bundled) | Co-locate with app |
| **Storage** | MinIO (self-hosted S3) | $0 | Open-source, S3-compatible |
| **Video processing** | ffmpeg.wasm | $0 | Already integrated |
| **CI/CD** | GitHub Actions | $0 | Free for public repos |
| **Monitoring** | Grafana + Prometheus | $0 | Open-source |

#### Option B: Hybrid (Managed + Free Tier)
| Layer | Tool | Cost |
|-------|------|------|
| **Hosting** | Vercel Hobby | $0 |
| **Database** | Neon Free Tier | $0 (0.5GB) |
| **Storage** | Cloudflare R2 | $0 (10GB, no egress) |
| **Video processing** | ffmpeg.wasm | $0 |
| **Email** | Resend | $0 (100/day) |

---

### 📋 Architecture Notes
1. **Video streaming** — R2 presigned URLs. For scale: Mux (adaptive bitrate) or Cloudflare Stream
2. **Thumbnails** — ffmpeg.wasm works serverless. Optimize: pre-generate on upload via Cloudflare Worker
3. **Real-time** — Current polling (10s). Upgrade: SSE via Next.js Route Handlers (free) or Pusher (paid)
4. **Email verification** — Better Auth email verification plugin (free)
5. **Caching** — Next.js ISR for landing page; Redis via Valkey (self-hosted) or Upstash (free tier)

---

### 🧱 Recommended Schema Changes
- `projects.video_key` — raw R2 key for reliable deletion
- `projects.thumbnail_key` — separate R2 key
- `comments.author_email` — for client identity

---

### 🚀 Tomorrow: Phase 2 Features
- [ ] Add R2 keys to DB schema (clean deletion without URL parsing)
- [ ] Client email verification flow
- [ ] SSE real-time sync (replace polling)
- [ ] Comment density heatmap on video timeline
- [ ] Bulk resolve comments
- [ ] Export feedback as PDF/CSV
- [ ] Project analytics dashboard (review time, comment trends)
