"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ExternalLink, Shield } from "lucide-react";

export interface ShareLinkCopyProps {
  shareToken: string;
  password?: string;
}

export function ShareLinkCopy({ shareToken, password }: ShareLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/v/${shareToken}` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    const text = `Link: ${link}\nPassword: ${password || "none"}`;
    try {
      await navigator.clipboard.writeText(text);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
        <code className="flex-1 text-sm font-mono text-muted-foreground truncate">{link}</code>
        <Button variant={copied ? "primary" : "secondary"} size="sm" onClick={handleCopyLink}>
          {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Link</>}
        </Button>
        <a href={`/v/${shareToken}`} target="_blank" rel="noopener noreferrer"
          className="shrink-0 rounded-lg p-2 text-muted-foreground/70 hover:text-foreground hover:bg-accent transition-colors">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {password && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Review Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">Share this password with your client to access the review page.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="inline-block rounded-md bg-primary/10 px-3 py-1.5 text-base font-mono font-bold tracking-widest text-primary select-all">
                  {password}
                </code>
                <Button variant="secondary" size="sm" onClick={handleCopyAll}>
                  {passwordCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy All</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
