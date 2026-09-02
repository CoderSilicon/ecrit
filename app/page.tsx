"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Board from "./components/Board";
import PromptBar from "./components/PromptBar";
import type { Card, Status } from "./types";
import Image from "next/image";
import logo from "@/public/logo.svg";

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute(args: Record<string, unknown>): unknown | Promise<unknown>;
}

interface ModelContextLike {
  registerTool?(
    tool: WebMCPTool,
    opts?: { signal?: AbortSignal }
  ): Promise<void> | void;
}

const INITIAL: Card[] = [
  {
    id: 1,
    title: "Welcome to ecrit",
    content:
      "This is a **clean notes app** with markdown support and an AI assistant.\n\n- Click a note to edit\n- Use the prompt bar below to command the AI\n\nTry: `add a note about grocery shopping`",
    status: "todo",
  },
  {
    id: 2,
    title: "Ideas",
    content: "Jot down thoughts, inspiration, or anything on your mind.",
    status: "in-progress",
  },
  {
    id: 3,
    title: "Done",
    content: "Completed items stay here for reference.",
    status: "done",
  },
];

export default function Home() {
  const [cards, setCards] = useState<Card[]>(INITIAL);
  const idRef = useRef(4);

  const addCard = useCallback(() => {
    const id = idRef.current++;
    const newCard: Card = {
      id,
      title: "New Note",
      content: "",
      status: "todo",
    };
    setCards((prev) => [...prev, newCard]);
    return newCard;
  }, []);

  const updateCard = useCallback((card: Card, content: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, content } : c))
    );
  }, []);

  const moveCard = useCallback((card: Card, status: Status) => {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, status } : c))
    );
  }, []);

  const deleteCard = useCallback((cardId: number) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const updateTitle = useCallback((card: Card, title: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, title: title.trim() || "Untitled" } : c))
    );
  }, []);

  // Shared tool runner used by both the local agent prompt bar and WebMCP.
  const runTool = useCallback(
    (name: string, args: Record<string, unknown>) => {
      switch (name) {
        case "create_task_card": {
          const id = idRef.current++;
          const card: Card = {
            id,
            title: String(args.title ?? "Untitled"),
            content: String(args.content ?? ""),
            status: (args.status as Status) || "todo",
          };
          setCards((prev) => [...prev, card]);
          return { success: true, message: "Note created" };
        }
        case "move_card": {
          const cardId = Number(args.cardId);
          const targetColumn = (args.targetColumn as Status) || "todo";
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, status: targetColumn } : c))
          );
          return { success: true, message: "Note moved" };
        }
        case "update_markdown": {
          const cardId = Number(args.cardId);
          const content = String(args.content ?? "");
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, content } : c))
          );
          return { success: true, message: "Note updated" };
        }
        default:
          return { success: false, message: "Unknown tool" };
      }
    },
    []
  );

  // Handler for the local agent prompt bar (ignore the JSON status return).
  const handleAgentTool = useCallback(
    (name: string, args: Record<string, unknown>) => {
      runTool(name, args);
    },
    [runTool]
  );

  // Tool registration for WebMCP (Chrome DevTools "Tools" tab).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("modelContext" in navigator)) return;

    const mc = (navigator as unknown as { modelContext?: ModelContextLike })
      .modelContext;
    if (!mc || typeof mc.registerTool !== "function") return;

    const tools: WebMCPTool[] = [
      {
        name: "create_task_card",
        description:
          "Create a new note card and add it to the board. status is one of: todo, in-progress, done (defaults to todo).",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short title of the note." },
            content: { type: "string", description: "Markdown body of the note." },
            status: {
              type: "string",
              enum: ["todo", "in-progress", "done"],
              description: "Column to place the note in.",
            },
          },
          required: ["title", "content"],
        },
        execute: (args) => runTool("create_task_card", args),
      },
      {
        name: "move_card",
        description:
          "Move an existing note card to a different column. targetColumn is one of: todo, in-progress, done.",
        inputSchema: {
          type: "object",
          properties: {
            cardId: { type: "number", description: "Numeric id of the card to move." },
            targetColumn: {
              type: "string",
              enum: ["todo", "in-progress", "done"],
              description: "Column to move the card into.",
            },
          },
          required: ["cardId", "targetColumn"],
        },
        execute: (args) => runTool("move_card", args),
      },
      {
        name: "update_markdown",
        description:
          "Replace the markdown body content of an existing note card with new content.",
        inputSchema: {
          type: "object",
          properties: {
            cardId: { type: "number", description: "Numeric id of the card to edit." },
            content: { type: "string", description: "New markdown body content." },
          },
          required: ["cardId", "content"],
        },
        execute: (args) => runTool("update_markdown", args),
      },
    ];

    const controllers: AbortController[] = [];

    for (const tool of tools) {
      const controller = new AbortController();
      controllers.push(controller);
      try {
        mc.registerTool(tool, { signal: controller.signal });
      } catch {
        // Tool may already be registered; ignore duplicates.
      }
    }

    return () => {
      for (const c of controllers) c.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boardSummary = useMemo(
    () =>
      cards.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        status: c.status,
      })),
    [cards]
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-12 pt-8">
      <header className="mb-8 flex items-center justify-between ">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            <Image src={logo} width={40} height={40} alt="ecrit" />
          </h1>
        </div>
        <button
          onClick={addCard}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/85"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Note
        </button>
      </header>

      <main className="flex-1">
        <Board
          cards={cards}
          onSaveContent={updateCard}
          onMove={moveCard}
          onDelete={deleteCard}
          onUpdateTitle={updateTitle}
        />
      </main>

      <div className="mt-8">
        <PromptBar currentBoard={boardSummary} onAgentTool={handleAgentTool} />
      </div>
    </div>
  );
}