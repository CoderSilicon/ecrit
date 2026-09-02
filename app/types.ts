export type Status = "todo" | "in-progress" | "done";

export interface Card {
  id: number;
  title: string;
  content: string;
  status: Status;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolLogEntry {
  id: number;
  tool: string;
  args: Record<string, unknown>;
  ts: number;
}
