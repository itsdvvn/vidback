# Feature Specification: Media Versioning & Video Annotations

## Feature 1: Media Version Revision

### Overview
Editors need to upload multiple revisions of the same video project. Clients should be able to view previous versions, compare them, and leave comments on specific versions.

### Database Schema Changes

Add a new table `project_versions` in `src/db/schema.ts`:

```typescript
export const projectVersions = pgTable("project_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  storageBytes: bigint("storage_bytes", { mode: "number" }).default(0),
  notes: text("notes"), // Editor's notes about this revision
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add currentVersion to projects table
// projects.currentVersion: integer("current_version").default(1).notNull(),
```

### API Routes

#### `POST /api/projects/[id]/versions` — Upload new version
- Auth required (editor only)
- Accepts multipart form with video file and optional notes
- Creates new `project_versions` row with incremented version number
- Updates `projects.currentVersion`
- Returns the new version object

#### `GET /api/projects/[id]/versions` — List all versions
- Auth required (editor) or public (via share token)
- Returns array of versions with metadata (version number, created at, notes)
- Does not include the full video URL for older versions

#### `GET /api/projects/[id]/versions/[versionId]` — Get specific version
- Returns the version details including presigned video URL

#### `PATCH /api/projects/[id]/versions/[versionId]` — Set as current
- Updates `projects.currentVersion`

### Server Actions to add in `src/lib/actions.ts`

```typescript
export async function createProjectVersion(projectId: string, formData: FormData) {
  const session = await requireAuth();
  // 1. Verify project ownership
  // 2. Get current max version number
  // 3. Upload video to R2 (or use existing URL)
  // 4. Insert new version record
  // 5. Update project's currentVersion
  // 6. Revalidate path
}

export async function getProjectVersions(projectId: string) {
  const session = await requireAuth();
  // Return all versions ordered by versionNumber DESC
}

export async function setCurrentVersion(projectId: string, versionId: string) {
  const session = await requireAuth();
  // Update projects.currentVersion to the selected version
}
```

### UI Components

#### `src/components/dashboard/VersionHistory.tsx`
- Shows a timeline/list of all versions
- Each entry shows: version number, date, notes, thumbnail
- "Set as current" button for each version
- Current version is highlighted

#### `src/app/(dashboard)/projects/[id]/page.tsx` Updates
- Add a "Version History" button/section in the top bar
- Show the current version number next to the project name
- When viewing an older version, show a banner: "Viewing v2 — click to restore"

### Client Side
- Client review page shows the current version
- Older versions are not shown to clients (only the latest)
- Comments are associated with the project, not specific versions (keeps it simple)

---

## Feature 2: Draw on Video / Annotate Clips

### Overview
Reviewers (both editors and clients) should be able to draw on the video frame to point out specific areas. Drawings are saved as part of the comment.

### Database Schema Changes

Add annotations to comments or create a separate table:

```typescript
// Option A: Add to existing comments table
// comments.annotations: jsonb("annotations").default([]),

// Option B: New table
export const annotations = pgTable("annotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "rectangle", "circle", "arrow", "freehand", "text"
  data: jsonb("data").notNull(), // shape-specific coordinates
  color: text("color").notNull().default("#ff0000"),
  strokeWidth: integer("stroke_width").default(2),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Drawing Canvas Component

Create `src/components/comments/AnnotationCanvas.tsx`:

```typescript
"use client";
// Uses HTML5 Canvas + mouse/touch events
// Tools: rectangle, circle, arrow, freehand, text, highlight
// Features:
// - Draw shapes on a canvas overlay positioned on top of the video
// - Undo/redo support (store action history)
// - Color picker (default: red, yellow, green, blue, white)
// - Clear all button
// - The canvas is transparent so the video shows through
// - When a comment is submitted, the current drawing is saved as annotations
// - When viewing a comment with annotations, the annotations are replayed on the video

interface AnnotationTool {
  type: "rectangle" | "circle" | "arrow" | "freehand" | "text";
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
}
```

### Component States
- **Idle**: Canvas is hidden. "Annotate" button is visible next to comment input.
- **Drawing**: Canvas overlay appears. Tools palette shows at the top. Video is paused.
- **Viewing**: Annotations are displayed as overlays on the video when hovering/clicking a comment.

### Implementation Steps

1. `AnnotationCanvas.tsx` — The drawing canvas component
2. `AnnotationToolbar.tsx` — Tool selection (rectangle, circle, arrow, freehand, text, color)
3. `AnnotationOverlay.tsx` — Displays saved annotations on the video
4. Update `CommentInput.tsx` — Add "Annotate" button that opens the canvas
5. Update `CommentItem.tsx` — Show annotation thumbnails or an "Annotated" badge
6. Update `CommentThread.tsx` — Clicking an annotation replays it on the video

### State Flow

```
User clicks "Annotate" → 
  Canvas opens, video pauses, frozen timestamp captured →
  User draws shapes →
  User clicks "Save & Comment" →
  Drawing data is serialized and included in the comment payload →
  Comment appears with annotation markers
```

### Server Storage

Annotations are stored as JSON in the database. No need for image generation on the server. The client replays the drawing commands on a canvas when viewing.

### API Changes

Update `createComment` server action to accept an `annotations` field:
```typescript
const schema = z.object({
  projectId: z.string().uuid(),
  authorName: z.string().min(1),
  content: z.string().min(1),
  timestamp: z.coerce.number().min(0),
  annotations: z.string().optional(), // JSON string of annotation array
});
```

---

## Implementation Order

### Sprint 1: Version History
1. Add `project_versions` table to schema
2. Push schema to database
3. Create server actions: `createProjectVersion`, `getProjectVersions`, `setCurrentVersion`
4. Create `VersionHistory` UI component
5. Update project detail page with version switcher
6. Update client review page to always show current version

### Sprint 2: Drawing Annotations
1. Add `annotations` table or field to schema
2. Create `AnnotationCanvas` component with drawing tools
3. Create `AnnotationToolbar` with tool selection
4. Create `AnnotationOverlay` for viewing annotations
5. Wire annotation data through comment submission flow
6. Update comment display to show annotation indicators

## Junior Developer / AI Agent Notes

- All new database tables should use the existing patterns from `src/db/schema.ts`
- Server actions must use `requireAuth()` for editor routes
- Public routes (client review) must not expose authentication requirements
- Drawing coordinates should be stored as ratios (0-1) so they work at any video resolution
- The canvas overlay should use `pointer-events: none` on the video and `pointer-events: auto` on the canvas
- Use CSS `object-fit: contain` video sizing and calculate annotation positions based on the rendered video rect
