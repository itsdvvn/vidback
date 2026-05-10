# TODO — Tomorrow

## 🔴 Blocking / Setup

- [ ] **Get PostgreSQL running** (local Docker, Neon, or Railway)
- [ ] **Update `DATABASE_URL`** in `.env` with real credentials
- [ ] **Push database schema** — drizzle-kit won't install on macOS <12, try:
  - `npx drizzle-kit push` (if macOS 12+)
  - Or write the SQL manually from `src/db/schema.ts`
- [ ] **Create a test editor user** — use BetterAuth sign-up or insert manually

## 🟡 Verify Integration

- [ ] **Test `npm run dev`** — all pages should load (dashboard will show error/empty until DB is connected)
- [ ] **Test login** at `/login` — sign in with test editor credentials
- [ ] **Test project creation** at `/projects/new` — paste a video URL, create project
- [ ] **Test client review** at `/v/{shareToken}` — add comments, see them appear
- [ ] **Test resolve flow** — editor marks comment resolved, refresh client page to verify

## 🟢 Polish / Remove

- [ ] **Remove `src/lib/store.ts`** — frontend-only comment store, no longer used
- [ ] **Remove mock data** — any remaining hardcoded test URLs/objects
- [ ] **Wire full auth in actions** — replace `"dev-editor"` placeholder with real `session.user.id`
- [ ] **Wire middleware auth** — add `proxy.ts` with BetterAuth session check for protected routes
- [ ] **Add sign-up page** — allow new editors to register via BetterAuth

## 🔵 Nice to Have

- [ ] **`useOptimistic`** — optimistic comment submission (appear instantly, rollback on error)
- [ ] **Real-time sync** — poll or websocket for cross-tab comment updates
- [ ] **Uploadthing integration** — replace URL-only video with actual file upload
- [ ] **Timeline marker sync** — comment markers on progress bar update from DB
