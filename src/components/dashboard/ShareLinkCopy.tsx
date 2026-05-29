"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ExternalLink, Shield } from "lucide-react";

export interface ShareLinkCopyProps {
  shareToken: string;
  password?: string;
}

export function ShareLinkCopy({ shareToken, password }: ShareLinkCopyProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/v/${shareToken}` : "";

  const copy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Link row */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{link}</code>
        <a href={`/v/${shareToken}`} target="_blank" rel="noopener noreferrer"
          className="shrink-0 rounded p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-accent transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <Button variant="ghost" size="sm" onClick={() => copy(link, setCopiedLink)}>
          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedLink ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* Password row */}
      {password && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">Password:</span>
          <code className="text-sm font-mono font-bold text-primary tracking-wider select-all">{password}</code>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => copy(password, setCopiedPassword)}>
            {copiedPassword ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedPassword ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}
