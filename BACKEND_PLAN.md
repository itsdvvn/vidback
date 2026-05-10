# VidBack — Backend Implementation Plan

> **Context7-verified** — Drizzle ORM (v1.0) and BetterAuth APIs confirmed from official documentation.

---

## Tech Stack

| Layer | Package | Verified API |
|---|---|---|
| **Database** | `postgres` (postgres.js driver) | `drizzle-orm/postgres-js` |
| **ORM** | `drizzle-orm`, `drizzle-kit` | `pgTable`, `serial`, `uuid`, etc. from `drizzle-orm/pg-core` |
| **Auth** | `better-auth` + `better-auth/adapters/drizzle` | email/password + optional OAuth |
| **Validation** | `zod` | Runtime + TypeScript type inference |
| **Upload** | `uploadthing` | Video file upload → CDN URL |

---

## 1. Dependencies to Install

```bash
npm install drizzle-orm postgres better-auth zod
npm install -D drizzle-kit
```

No `@types/pg` needed — we're using `postgres.js`, not `pg`.

---

## 2. Drizzle Setup

### 2.1 `drizzle.config.ts` (project root)

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

### 2.2 DB Connection (`src/db/index.ts`)

**Verified from Drizzle docs — `drizzle-orm/postgres-js` driver:**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle({ client, schema });
```

### 2.3 Database Schema (`src/db/schema.ts`)

Combines BetterAuth's required tables + VidBack application tables.

> **Context7 note:** BetterAuth stores users in a `user` table (singular). Its schema columns are from the BetterAuth documentation.

```typescript
import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// ─── BetterAuth tables ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── VidBack application tables ───

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  videoUrl: text("video_url").notNull(),
  shareToken: text("share_token").unique().notNull(),
  editorId: text("editor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("Under Review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  timestamp: doublePrecision("timestamp").notNull(),
  isResolved: timestamp("is_resolved"),
  parentId: integer("parent_id").references(() => comments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2.4 Commands

```bash
npx drizzle-kit generate    # Generate SQL migrations
npx drizzle-kit migrate     # Apply to database
npx drizzle-kit push        # Push schema directly (dev only)
npx drizzle-kit studio      # Open Drizzle Studio (GUI browser)
```

---

## 3. BetterAuth Setup

### 3.1 Auth Config (`src/lib/auth.ts`)

**Verified from BetterAuth docs:**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // Optional social providers:
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },
});
```

### 3.2 Auth API Route (`src/app/api/auth/[...all]/route.ts`)

**Verified from BetterAuth docs — `toNextJsHandler`:**

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### 3.3 Auth Client (`src/lib/auth-client.ts`)

**Verified from BetterAuth docs — `createAuthClient`:**

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
```

### 3.4 Middleware (`src/middleware.ts`)

**Verified from BetterAuth docs — `auth.api.getSession`:**

```typescript
import { betterAuth } from "better-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await betterAuth().api.getSession({
    headers: request.headers,
  });

  const pathname = request.nextUrl.pathname;

  // Public routes — no auth needed
  if (pathname.startsWith("/v/")) return NextResponse.next();

  // Auth pages — allow even if not logged in
  if (pathname === "/login") return NextResponse.next();

  // Protect dashboard routes
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
```

### 3.5 React Provider (`src/components/providers/SessionProvider.tsx`)

Wrap the app so client components can access the session:

```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User, Session } from "better-auth";

interface AuthContext {
  user: User | null;
  session: Session | null;
}

const AuthCtx = createContext<AuthContext>({ user: null, session: null });

export function SessionProvider({
  children,
  user,
  session,
}: AuthContext & { children: ReactNode }) {
  return (
    <AuthCtx.Provider value={{ user, session }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useSession() {
  return useContext(AuthCtx);
}
```

---

## 4. Server Actions (`src/lib/actions.ts`)

All mutations use **Server Actions** (`"use server"`). The public client endpoint uses a REST API route (no auth required).

**Verified patterns from Drizzle docs:**
- `db.select().from(table).where(eq(col, val))` — query
- `db.insert(table).values({...}).returning()` — insert + return
- `db.update(table).set({...}).where(eq(col, val))` — update

**Verified patterns from BetterAuth docs:**
- `auth.api.getSession({ headers })` — get current session
- `auth.api.signInEmail({ body: { email, password } })` — sign in
- `auth.api.signUpEmail({ body: { email, password, name } })` — sign up

```typescript
"use server";

import { db } from "@/db";
import { projects, comments } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

// ─── Projects ───

export async function getEditorProjects() {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.editorId, session.user.id))
    .orderBy(projects.createdAt);

  // Attach comment counts per project
  return Promise.all(
    rows.map(async (p) => {
      const total = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.projectId, p.id))
        .then((r) => r[0].count);

      const open = await db
        .select({ count: count() })
        .from(comments)
        .where(
          and(eq(comments.projectId, p.id), isNull(comments.isResolved)),
        )
        .then((r) => r[0].count);

      return { ...p, commentCount: total, unresolvedCount: open };
    }),
  );
}

export async function getProjectWithCounts(projectId: string) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || project.editorId !== session.user.id) {
    throw new Error("Not found");
  }

  const [total] = await db
    .select({ count: count() })
    .from(comments)
    .where(eq(comments.projectId, projectId));

  const [open] = await db
    .select({ count: count() })
    .from(comments)
    .where(
      and(eq(comments.projectId, projectId), isNull(comments.isResolved)),
    );

  return {
    ...project,
    commentCount: total.count,
    unresolvedCount: open.count,
  };
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  videoUrl: z.string().url("Must be a valid URL"),
});

export async function createProject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const parsed = createProjectSchema.parse({
    name: formData.get("name"),
    videoUrl: formData.get("videoUrl"),
  });

  const shareToken = `${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`;

  const [project] = await db
    .insert(projects)
    .values({
      name: parsed.name,
      videoUrl: parsed.videoUrl,
      shareToken,
      editorId: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  return project;
}

export async function updateProjectStatus(
  projectId: string,
  status: string,
) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/dashboard");
}

// ─── Comments ───

export async function getProjectComments(projectId: string) {
  const all = await db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(comments.timestamp);

  const topLevel = all.filter((c) => c.parentId === null);
  return topLevel.map((c) => ({
    ...c,
    replies: all.filter((r) => r.parentId === c.id),
  }));
}

export async function createComment(formData: FormData) {
  const schema = z.object({
    projectId: z.string().uuid(),
    authorName: z.string().min(1, "Name is required"),
    content: z.string().min(1, "Comment is required"),
    timestamp: z.coerce.number().min(0),
  });

  const parsed = schema.parse({
    projectId: formData.get("projectId"),
    authorName: formData.get("authorName"),
    content: formData.get("content"),
    timestamp: formData.get("timestamp"),
  });

  const [project] = await db
    .select({ id: projects.id, shareToken: projects.shareToken })
    .from(projects)
    .where(eq(projects.id, parsed.projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const [comment] = await db
    .insert(comments)
    .values({
      projectId: parsed.projectId,
      authorName: parsed.authorName,
      content: parsed.content,
      timestamp: parsed.timestamp,
    })
    .returning();

  revalidatePath(`/v/${project.shareToken}`);
  return comment;
}

export async function toggleResolve(commentId: number, resolved: boolean) {
  await db
    .update(comments)
    .set({ isResolved: resolved ? new Date() : null })
    .where(eq(comments.id, commentId));

  revalidatePath("/projects/[id]", "page");
}

export async function replyToComment(
  commentId: number,
  projectId: string,
  content: string,
) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const [reply] = await db
    .insert(comments)
    .values({
      projectId,
      authorName: session.user.name,
      content,
      timestamp: 0,
      parentId: commentId,
    })
    .returning();

  return reply;
}
```

---

## 5. Public API Route (`src/app/api/public/projects/[token]/route.ts`)

This is the **only REST API route** — needed because the client review page fetches data without auth.

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, comments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.shareToken, token))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.projectId, project.id))
    .orderBy(comments.timestamp);

  const topLevel = allComments.filter((c) => c.parentId === null);
  const threaded = topLevel.map((c) => ({
    ...c,
    replies: allComments.filter((r) => r.parentId === c.id),
  }));

  return NextResponse.json({ project, comments: threaded });
}
```

---

## 6. Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL=postgres://user:pass@localhost:5432/vidback

# BetterAuth
BETTER_AUTH_SECRET=your-secret-32-chars-min
BETTER_AUTH_URL=http://localhost:3000

# For the auth client (browser-side)
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Uploadthing (optional, for video uploads)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

---

## 7. Data Flow

```
                          ┌──────────────────────┐
                          │    PostgreSQL DB      │
                          │  user, session,       │
                          │  account, verification │
                          │  projects, comments    │
                          └──────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
         Drizzle ORM            Drizzle ORM             Drizzle ORM
              │                      │                      │
    ┌─────────┴──────────┐  ┌───────┴───────┐  ┌──────────┴──────────┐
    │   Editor Dashboard  │  │  Editor View  │  │   Client Review     │
    │   (/dashboard)      │  │  (/projects/X)│  │   (/v/[token])      │
    │                     │  │               │  │                     │
    │ getEditorProjects() │  │ getProject()  │  │ GET /api/public/... │
    │ createProject()     │  │ getComments() │  │ createComment()     │
    │ deleteProject()     │  │ toggleResolve │  │ (no auth)           │
    │                     │  │ replyToComment│  │                     │
    └─────────────────────┘  └───────────────┘  └─────────────────────┘
         (auth required)        (auth required)      (no auth)
```

---

## 8. Implementation Phases

### Phase 1 — Foundation (1 day)

| Step | File | Action |
|---|---|---|
| 1 | Install deps | `npm install drizzle-orm postgres better-auth zod uuid nanoid` + `npm install -D drizzle-kit` |
| 2 | `drizzle.config.ts` | Create with PostgreSQL dialect |
| 3 | `src/db/schema.ts` | Write full schema (BetterAuth tables + VidBack tables) |
| 4 | `src/db/index.ts` | Create DB connection with `drizzle-orm/postgres-js` |
| 5 | `src/lib/auth.ts` | BetterAuth instance with `drizzleAdapter` + email/password |
| 6 | `src/app/api/auth/[...all]/route.ts` | `toNextJsHandler(auth)` |
| 7 | `src/lib/auth-client.ts` | `createAuthClient` for the browser |
| 8 | `src/middleware.ts` | Route protection (public `/v/*`, protected `/projects/*`) |
| 9 | `.env` | Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| 10 | Push schema | `npx drizzle-kit push` |

### Phase 2 — Editor API (1 day)

| Step | Action |
|---|---|
| 11 | Create `src/lib/actions.ts` with `createProject` |
| 12 | Wire `dashboard/page.tsx` — replace mock data with `getEditorProjects()` |
| 13 | Wire `projects/new/page.tsx` — replace simulated upload with `createProject` |
| 14 | Wire `projects/[id]/page.tsx` — replace mock data with `getProjectWithCounts()` + `getProjectComments()` |
| 15 | Implement `toggleResolve` + `replyToComment` |
| 16 | Add login form — wire `authClient.signInEmail()` to `login/page.tsx` |

### Phase 3 — Client API (1 day)

| Step | Action |
|---|---|
| 17 | Create `/api/public/projects/[token]/route.ts` |
| 18 | Wire `v/[token]/page.tsx` — fetch from public API on load |
| 19 | Wire `createComment` in client page — replace `commentStore.add()` |
| 20 | Remove the frontend-only `commentStore` from `src/lib/store.ts` |

### Phase 4 — Polish (1 day)

| Step | Action |
|---|---|
| 21 | Add `useOptimistic` for instant comment feedback |
| 22 | Add Loading skeleton states during data fetching |
| 23 | Error boundaries + toast notifications |
| 24 | Run `drizzle-kit migrate` for production schema |
| 25 | E2E smoke test with Playwright |
