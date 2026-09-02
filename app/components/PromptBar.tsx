"use client";

import { FormEvent, useState } from "react";
import type { Card } from "../types";

interface PromptBarProps {
  currentBoard: Card[];
  onAgentTool(tool: string, args: Record<string, unknown>): void;
}

interface AgentResponse {
  toolCalls?: { name: string; arguments: Record<string, unknown> }[];
  error?: string;
}

export default function PromptBar({ currentBoard, onAgentTool }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt || busy) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, currentBoard }),
      });

      const data = (await res.json()) as AgentResponse;

      if (!res.ok || data.error) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }

      const calls = data.toolCalls ?? [];
      if (calls.length === 0) {
        setSuccess("Nothing to change.");
      } else {
        for (const call of calls) {
          onAgentTool(call.name, call.arguments);
        }
        setSuccess(`Done — ${calls.length} change${calls.length > 1 ? "s" : ""}.`);
      }
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — is the API key set?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-xl border border-[#f3d5d5] bg-[#fdf5f5] px-4 py-3 text-sm text-[#c25555]">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="rounded-xl border border-[#d5e8d8] bg-[#f5fdf7] px-4 py-3 text-sm text-accent">
          {success}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <span className="shrink-0 text-base">🌱</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Ask your assistant — e.g. "add a note about dinner ideas"'
          className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted/50"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}