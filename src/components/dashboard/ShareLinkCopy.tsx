"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ExternalLink } from "lucide-react";

export interface ShareLinkCopyProps {
  shareToken: string;
}

export function ShareLinkCopy({ shareToken }: ShareLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5">
      <code className="flex-1 text-sm font-mono text-muted-foreground truncate">
        {link}
      </code>
      <Button
        variant={copied ? "primary" : "secondary"}
        size="sm"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Link
          </>
        )}
      </Button>
      <a
        href={`/v/${shareToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg p-2 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
