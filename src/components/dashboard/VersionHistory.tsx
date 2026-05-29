"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Film, Clock, CheckCircle, RotateCcw } from "lucide-react";
import { getProjectVersions, setCurrentVersion } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  versionNumber: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  notes: string;
  storageBytes: number;
  createdAt: Date;
}

interface VersionHistoryProps {
  projectId: string;
  currentVersion: number;
  onVersionChange: () => void;
}

export function VersionHistory({ projectId, currentVersion, onVersionChange }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await getProjectVersions(projectId);
      setVersions(data as Version[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSetCurrent = async (versionId: string) => {
    setSetting(versionId);
    try {
      await setCurrentVersion(projectId, versionId);
      onVersionChange();
      await loadVersions();
    } catch { /* ignore */ }
    setSetting(null);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div
          key={v.id}
          className={cn(
            "flex items-center gap-4 rounded-lg border p-3 transition-all",
            v.versionNumber === currentVersion
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-card hover:border-primary/20",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {v.versionNumber === currentVersion ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Film className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Version {v.versionNumber}
              {v.versionNumber === currentVersion && (
                <span className="ml-2 text-xs text-primary font-normal">(current)</span>
              )}
            </p>
            {v.notes && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{v.notes}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date(v.createdAt).toLocaleDateString()}
            </p>
          </div>
          {v.versionNumber !== currentVersion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSetCurrent(v.id)}
              loading={setting === v.id}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </Button>
          )}
        </div>
      ))}
      {versions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No version history yet.</p>
      )}
    </div>
  );
}
