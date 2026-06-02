// ─── Project ───
export interface Project {
  id: string;
  name: string;
  videoUrl: string;
  shareToken: string;
  editorId: string;
  folderId?: string | null;
  status?: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Populated at query time */
  projectCount?: number;
}

export interface FolderShare {
  id: string;
  folderId: string;
  userId: string;
  permission: "view" | "edit";
  createdAt: Date;
}

// ─── Comment ───
export interface Comment {
  id: number;
  projectId: string;
  authorName: string;
  content: string;
  /** Time in seconds (e.g. 45.5) */
  timestamp: number;
  /** null = active; Date = resolved */
  isResolved: Date | null;
  /** For one-level threaded replies */
  parentId: number | null;
  createdAt: Date;
  /** JSON array of drawing annotations */
  annotations?: {
    type: string;
    points: { x: number; y: number }[];
    color: string;
    strokeWidth: number;
  }[];
  /** Populated at query time */
  replies?: Comment[];
}

// ─── UI States ───
export type UIStatus = "loading" | "empty" | "error" | "success";
