import type { Comment } from "@/types";

type Listener = () => void;

// ─── Shared Comment Store ───
// Both the client page and editor dashboard read/write from this
// module-level store so comments stay synchronized during development.

let _comments: Comment[] = [
  {
    id: 1, projectId: "1", authorName: "Sarah (Client)",
    content: "Can we speed up this transition? It feels a little slow.",
    timestamp: 5.2, isResolved: null, parentId: null,
    createdAt: new Date("2025-05-09"),
    replies: [
      { id: 4, projectId: "1", authorName: "Editor Mike", content: "Good catch — I'll tighten that up to 0.5s.", timestamp: 5.2, isResolved: null, parentId: 1, createdAt: new Date("2025-05-10") },
    ],
  },
  {
    id: 2, projectId: "1", authorName: "Sarah (Client)",
    content: "The background music is too loud here.",
    timestamp: 15.8, isResolved: new Date("2025-05-10"), parentId: null,
    createdAt: new Date("2025-05-09"), replies: [],
  },
  {
    id: 3, projectId: "1", authorName: "Sarah (Client)",
    content: "Love this shot! Keep it exactly as is.",
    timestamp: 22.0, isResolved: null, parentId: null,
    createdAt: new Date("2025-05-09"), replies: [],
  },
];

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export const commentStore = {
  getAll(): Comment[] {
    return _comments;
  },

  add(comment: Comment): void {
    _comments = [..._comments, comment];
    notify();
  },

  addReply(parentId: number, reply: Comment): void {
    _comments = _comments.map((c) =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies ?? []), reply] }
        : c,
    );
    notify();
  },

  resolve(commentId: number, resolved: boolean): void {
    _comments = _comments.map((c) => {
      if (c.id === commentId) return { ...c, isResolved: resolved ? new Date() : null };
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, isResolved: resolved ? new Date() : null } : r,
          ),
        };
      }
      return c;
    });
    notify();
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
