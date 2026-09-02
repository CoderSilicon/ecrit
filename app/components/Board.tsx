"use client";

import { useCallback, useMemo } from "react";
import Card from "./Card";
import type { Card as CardType, Status } from "../types";

interface BoardProps {
  cards: CardType[];
  onSaveContent(card: CardType, content: string): void;
  onMove(card: CardType, status: Status): void;
  onDelete(cardId: number): void;
  onUpdateTitle(card: CardType, title: string): void;
}

const COLUMNS: { key: Status; label: string; emoji: string }[] = [
  { key: "todo", label: "To Do", emoji: "📝" },
  { key: "in-progress", label: "In Progress", emoji: "🌱" },
  { key: "done", label: "Done", emoji: "🌿" },
];

export default function Board({
  cards,
  onSaveContent,
  onMove,
  onDelete,
  onUpdateTitle,
}: BoardProps) {
  const colCardsByStatus = useMemo(() => {
    const map: Record<Status, CardType[]> = { todo: [], "in-progress": [], done: [] };
    for (const c of cards) map[c.status].push(c);
    return map;
  }, [cards]);

  const makeHandlers = useCallback(
    (card: CardType) => ({
      onSave: (content: string) => onSaveContent(card, content),
      onMove: (status: Status) => onMove(card, status),
      onDelete: () => onDelete(card.id),
      onUpdateTitle: (title: string) => onUpdateTitle(card, title),
    }),
    [onSaveContent, onMove, onDelete, onUpdateTitle]
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {COLUMNS.map((col) => {
        const colCards = colCardsByStatus[col.key];
        return (
          <section
            key={col.key}
            className="flex w-full flex-1 flex-col rounded-2xl border border-border bg-column p-5"
          >
            <header className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <span className="text-base">{col.emoji}</span>
              <h2 className="text-sm font-semibold tracking-wide text-text">
                {col.label}
              </h2>
              <span className="ml-auto rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
                {colCards.length}
              </span>
            </header>

            <div className="flex min-h-50 flex-1 flex-col gap-4">
              {colCards.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
                  <p className="text-sm text-text-muted">No notes here yet</p>
                </div>
              ) : (
                colCards.map((card) => {
                  const h = makeHandlers(card);
                  return (
                    <Card
                      key={card.id}
                      card={card}
                      onSave={h.onSave}
                      onMove={h.onMove}
                      onDelete={h.onDelete}
                      onUpdateTitle={h.onUpdateTitle}
                    />
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}