"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import type { Card as CardType } from "../types";

interface CardProps {
  card: CardType;
  onSave(content: string): void;
  onMove(status: CardType["status"]): void;
  onDelete(): void;
  onUpdateTitle(title: string): void;
}

const STATUS_ORDER: CardType["status"][] = ["todo", "in-progress", "done"];

marked.setOptions({ breaks: true, gfm: true });

export default function Card({
  card,
  onSave,
  onMove,
  onDelete,
  onUpdateTitle,
}: CardProps) {
  const [editing, setEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState(card.content);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const currentIndex = STATUS_ORDER.indexOf(card.status);
  const canMoveLeft = currentIndex > 0;
  const canMoveRight = currentIndex < STATUS_ORDER.length - 1;

  function startEditing() {
    setDraft(card.content);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function startTitleEdit() {
    setTitleDraft(card.title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function commitContent() {
    if (draft.trim() !== card.content) {
      onSave(draft.trim());
    }
    setEditing(false);
  }

  const commitTitle = useCallback(() => {
    if (titleDraft.trim() !== card.title) {
      onUpdateTitle(titleDraft.trim());
    }
    setEditingTitle(false);
  }, [titleDraft, card.title, onUpdateTitle]);

  const cancelTitleEdit = useCallback(() => {
    setTitleDraft(card.title);
    setEditingTitle(false);
  }, [card.title]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (editingTitle && e.key === "Enter") {
        commitTitle();
      }
      if (editingTitle && e.key === "Escape") {
        cancelTitleEdit();
      }
      if (editing && e.key === "Escape") {
        setDraft(card.content);
        setEditing(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editing, editingTitle, card.content, commitTitle, cancelTitleEdit]);

  const moveLeft = () => {
    if (canMoveLeft) onMove(STATUS_ORDER[currentIndex - 1]);
  };

  const moveRight = () => {
    if (canMoveRight) onMove(STATUS_ORDER[currentIndex + 1]);
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/40">
      <div className="mb-1 flex items-start justify-between gap-2">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") cancelTitleEdit();
            }}
            className="flex-1 min-w-0 rounded-full border border-accent bg-accent-light/40 px-3.5 py-1.5 text-sm font-semibold text-text outline-none"
          />
        ) : (
          <h3
            onClick={startTitleEdit}
            className="flex-1 min-w-0 cursor-pointer truncate text-base font-semibold text-text hover:text-accent"
            title="Click to rename"
          >
            {card.title}
          </h3>
        )}
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitContent}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") commitContent();
          }}
          className="min-h-[120px] w-full rounded-xl border border-accent bg-accent-light/20 p-4 text-sm text-text outline-none placeholder:text-text-muted/50"
          style={{ fontFamily: "var(--font-serif)" }}
          placeholder="Write your note..."
          spellCheck={false}
        />
      ) : (
        <div
          onClick={startEditing}
          className="cursor-text rounded-xl p-1.5 transition-colors hover:bg-accent-light/20"
        >
          <div
            className="wmcp-markdown"
            dangerouslySetInnerHTML={{
              __html: marked.parse(card.content || " ") as string,
            }}
          />
          {!card.content && (
            <p className="font-serif text-sm italic text-text-muted/50">
              Click to start writing...
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={moveLeft}
            disabled={!canMoveLeft}
            title="Move to previous label"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-accent-light/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
            {card.status === "todo" ? "To Do" : card.status === "in-progress" ? "In Progress" : "Done"}
          </span>
          <button
            onClick={moveRight}
            disabled={!canMoveRight}
            title="Move to next label"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-accent-light/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <button
          onClick={onDelete}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-[#fde8e8] hover:text-[#d97777]"
          title="Delete"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}