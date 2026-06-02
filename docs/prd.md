## 1. Project Overview
VidBack is a streamlined web application designed for video editors to collect precise feedback from clients. The goal is to replace long email chains and vague timestamps with a single, unique link where clients can leave comments directly on a video timeline.

### Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js or Clerk (for Editors only)

---

## 2. Core User Flow

### Phase 1: Editor Setup
1. The Editor logs into the dashboard.
2. The Editor uploads a video file (or provides a URL from a storage provider like Mux/Cloudinary).
3. The system generates a unique, obfuscated public link (e.g., `/v/sh72-91sa-k182`).

### Phase 2: Client Review
1. The Client opens the link (no login required).
2. The Client watches the video.
3. When the Client sees something to change, they click the "Add Comment" button or start typing.
4. The video pauses automatically, capturing the current timestamp.
5. The Client enters their name and comment.

### Phase 3: Resolution
1. The Editor receives a notification.
2. The Editor views the comments, which are pinned to the timeline.
3. The Editor marks comments as "Resolved" once changes are made.

---

## 3. Feature Breakdown

### 3.1 Custom Video Player
- **Timestamp Capture:** The player must interface with the HTML5 `video` API to extract `currentTime` with millisecond precision.
- **Timeline Markers:** Visual indicators (dots) on the progress bar showing where comments exist.
- **Playback Control:** Spacebar to play/pause, and "J-K-L" shortcuts for 10s rewinds/forwards.

### 3.2 Commenting Logic
- **Contextual Input:** The comment input field appears only when a user triggers a "New Comment" action, preventing UI clutter.
- **Threaded Replies:** Simple one-level deep threading for Editors to respond to Client feedback.
- **State Management:** Use optimistic updates via `useOptimistic` (Next.js) so comments appear instantly without waiting for the database.

---

## 4. Database Schema (Drizzle ORM)

```typescript
import { pgTable, serial, text, timestamp, doublePrecision, uuid } from 'drizzle-orm/pg-core';

// Projects table managed by Editors
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  videoUrl: text('video_url').notNull(),
  shareToken: text('share_token').unique().notNull(), // The unique part of the public URL
  editorId: text('editor_id').notNull(), // Link to Auth provider ID
  createdAt: timestamp('created_at').defaultNow(),
});

// Comments table for feedback
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  timestamp: doublePrecision('timestamp').notNull(), // Time in seconds (e.g., 45.5)
  isResolved: timestamp('is_resolved'), // Null if active, contains timestamp if resolved
  createdAt: timestamp('created_at').defaultNow(),
});
