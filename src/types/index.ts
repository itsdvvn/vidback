// ─── Project ───
export interface Project {
  id: string;
  name: string;
  videoUrl: string;
  shareToken: string;
  editorId: string;
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
  /** Populated at query time */
  replies?: Comment[];
}

// ─── UI States ───
export type UIStatus = "loading" | "empty" | "error" | "success";
