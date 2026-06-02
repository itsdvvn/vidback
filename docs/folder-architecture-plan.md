# Folder Architecture — Planning Document

## Overview
Add a folder/workspace layer above projects, similar to Google Drive. 
Folders contain video projects, can be shared with other editors, and 
provide a clean organizational structure for the dashboard.

---

## 1. Database Schema

### New Table: `folders`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (defaultRandom) PK | |
| name | text NOT NULL | Folder name |
| owner_id | text NOT NULL → user.id | Creator / owner |
| parent_id | uuid → folders.id (nullable) | Nested folders (optional v2) |
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

---

## 2. Data Flow

```
User
 └── Dashboard
      ├── 📁 Folder A (shared with editor@example.com)
      │    ├── 🎬 Project 1 (v1, v2, v3)
      │    └── 🎬 Project 2
      ├── 📁 Folder B (private)
      │    └── 🎬 Project 3
      └── 🎬 Project 4 (no folder — stays as-is for backward compat)
```

---

## 3. Routes / Pages

### Dashboard (`/dashboard`)
- Replaces flat project list with a folder-first view
- Shows folders as cards/rows (name, project count, shared status)
- Shows "Unfiled" section at bottom for projects without a folder
- Drag-and-drop to move projects into folders (future)

### Folder Detail (`/folders/[id]`)
- Shows projects inside the folder
- Shows folder name, member avatars, share button
- Create new project inside this folder
- Edit folder name / color

### Share Dialog (`/folders/[id]/share`)
- Search users by email/name
- Assign view/edit permissions
- Shows current shares with remove option

---

## 4. Server Actions

```
── Folders ──
createFolder(name, color?)
renameFolder(id, name, color?)
deleteFolder(id)
getUserFolders()
getFolder(id)
getFolderProjects(folderId)

── Sharing ──
shareFolder(folderId, userEmail, permission)
updateSharePermission(shareId, permission)
removeShare(shareId)
getFolderShares(folderId)

── Projects (modified) ──
moveProjectToFolder(projectId, folderId)
createProject(formData) ← folderId optional
```

---

## 5. UI Components

```
Dashboard:
  └── FolderGrid
       ├── FolderCard (name, count, color, shared badges)
       └── CreateFolderDialog

Folder Detail:
  └── FolderHeader (name, edit, share, delete)
  └── FolderProjectList (existing ProjectCard)
  └── ShareSheet (user search, permission select)

Sidebar (optional v2):
  └── FolderTree (nested folders)
```

---

## 6. Implementation Order

| Phase | What | Why |
|-------|------|-----|
| **1** | DB schema: `folders`, `folder_shares`, `projects.folder_id` | Foundation |
| **2** | Server actions: CRUD folders | Backend logic |
| **3** | Dashboard: folder-first view | Users see value immediately |
| **4** | Folder detail page + move projects | Core UX |
| **5** | Share dialog + permission checks | Collaboration |
| **6** | Drag-and-drop, nested folders (optional) | Polish |

---

## 7. Backward Compatibility

- The `folder_id` column is nullable
- Projects without a folder appear in "Unfiled" section
- All existing API routes keep working
- Share tokens and client review pages are unaffected
