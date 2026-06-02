# Folder Architecture — Planning Document

## Overview
Add a folder layer above video versions, similar to Google Drive.
Folders contain video versions directly (no nested project abstraction).

```
Dashboard
 └── Folder A
      ├── v1  (video + thumbnail + comments)
      └── v2  (video + thumbnail + comments)
```

---

## 1. Database Schema

### New Table: `folders`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (defaultRandom) PK | |
| name | text NOT NULL | Folder name |
| owner_id | text NOT NULL → user.id | Creator / owner |
| color | text (nullable) | Accent color for UI |
| created_at | timestamp | |
| updated_at | timestamp | |

### New Table: `folder_shares`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| folder_id | uuid → folders.id (cascade) | |
| user_id | text → user.id (cascade) | Shared with |
| permission | text ('view' / 'edit') | |
| created_at | timestamp | |

### Modified Table: `projects`

Add column: `folder_id` → folders.id (nullable, set null on delete set null)

The `projects` table already represents individual video entries.
Each project = one video with its versions and comments.
A project gets a `folder_id` to place it inside a folder.

---

## 2. Data Flow

```
Dashboard
 └── Folder A
      ├── v1  (video + thumbnail + comments)
      └── v2  (video + thumbnail + comments)
```

Each row in the `projects` table IS a single version (v1, v2, ...).
No intermediate project abstraction — folders contain versions directly.
The `project_versions` table can be removed or repurposed later.

```
User
 └── Dashboard
      ├── 📁 Folder A (shared)
      │    ├── 🎬 v1 — Client Brand Video
      │    └── 🎬 v2 — Product Launch Update
      ├── 📁 Folder B (private)
      │    └── 🎬 v1 — Internal Training
      └── 🎬 Unfiled (no folder)
```

---

## 3. Routes / Pages

### Dashboard (`/dashboard`)
- Folder-first view with folder cards
- Each folder card shows: name, project count, shared status indicator
- "Unfiled" section at bottom for projects without folders
- Create Folder button

### Folder Detail (`/folders/[id]`)
- Shows all projects inside the folder
- Shows folder header with name, color, share button
- Create new project in this folder
- Drag to reorder projects

### Share Sheet (dialog, not page)
- Search users by email
- Assign view/edit permissions
- List current shares with remove option

---

## 4. Server Actions

```
── Folders ──
createFolder(name, color?)
renameFolder(id, name, color?)
deleteFolder(id)
getUserFolders()           → folders with project count
getFolderProjects(id)      → projects inside folder

── Sharing ──
shareFolder(folderId, userEmail, permission)
removeShare(shareId)
getFolderShares(folderId)

── Projects (modified) ──
moveProjectToFolder(projectId, folderId)
createProject(formData)    ← now accepts optional folderId
```

---

## 5. UI Components

```
Dashboard:
  ├── FolderGrid
  │    └── FolderCard (name, project count, color dot, shared badge)
  ├── CreateFolderDialog
  └── UnfiledSection (existing ProjectCard list)

FolderDetail:
  ├── FolderHeader (name, edit, share, delete buttons)
  ├── CreateProjectButton
  └── ProjectList (existing ProjectCard)

ShareSheet:
  ├── UserSearchInput
  ├── PermissionSelect (view / edit)
  └── CurrentShareList (avatar, email, permission, remove)
```

---

## 6. Implementation Order

| Phase | What | Why |
|-------|------|------|
| **1** | DB: `folders`, `folder_shares` tables + `projects.folder_id` | Foundation |
| **2** | Server actions: folder CRUD + sharing | Backend |
| **3** | Dashboard: folder-first view | Users see value |
| **4** | Folder detail page + move projects | Core UX |
| **5** | Share dialog | Collaboration |

---

## 7. Backward Compatibility

- `folder_id` is nullable → existing projects show in "Unfiled"
- All existing routes/pages keep working
- Share tokens and client review pages unaffected
- Version history (`project_versions`) stays the same
