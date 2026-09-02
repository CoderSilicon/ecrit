// Security utilities: input sanitization, JSON Schema validation, and limits.

export const MAX_TITLE_LENGTH = 100;
export const MAX_CONTENT_LENGTH = 2000;

// Keywords and patterns that indicate an attempted system/instruction override,
// prompt injection, or raw HTML injection. Stripping these prevents them from
// surfacing in rendered output or bleeding into AI agent execution contexts.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+previous\s+instructions/gi,
  /ignore\s+all\s+previous\s+instructions/gi,
  /\bsystem\s*:\s*/gi,
  /\bdisregard\s+(prior|previous|earlier)/gi,
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<\s*script[^>]*>/gi,
  /\boverride\s+(the\s+)?(system|instructions)/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /javascript\s*:/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onload\s*=/gi,
];

/**
 * Strip prompt-injection keywords and dangerous HTML from a raw string.
 * Order matters: executable HTML is removed first, then keyword overrides.
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== "string") return "";

  let value = input;
  // Remove complete HTML tags first (script/iframe with content).
  value = value.replace(
    /<\s*(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ""
  );
  // Remove any remaining executable tag openers.
  value = value.replace(/<\s*\/(script|iframe|object|embed)\s*>/gi, "");
  value = value.replace(/<\s*(script|iframe|object|embed)\b[^>]*>/gi, "");

  // Neutralize prefix-style injection keywords.
  for (const pattern of INJECTION_PATTERNS) {
    value = value.replace(pattern, "");
  }

  // Collapse dangerously long whitespace runs that could be used for padding.
  value = value.replace(/[ \t]{4,}/g, " ");

  return value.trim();
}

/**
 * Sanitize a string and enforce a maximum length.
 */
export function sanitizeString(input: string, maxLength: number): string {
  const cleaned = sanitizePlainText(input);
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Sanitize a markdown body. Keeps markdown syntax intact (parse-time safety
 * is handled separately at render time), but strips raw HTML and injection
 * keywords before the text enters application state.
 */
export function sanitizeMarkdown(input: string, maxLength: number): string {
  let value = sanitizePlainText(input);
  if (value.length > maxLength) value = value.slice(0, maxLength);
  return value;
}

/**
 * Validate that a status value is one of the allowed columns.
 */
export function isValidStatus(value: unknown): value is "todo" | "in-progress" | "done" {
  return value === "todo" || value === "in-progress" || value === "done";
}

/**
 * Lightweight JSON Schema validator for tool arguments.
 * Supports the subset of JSON Schema used by our tool registerTool defs:
 * type, enum, required, properties, string/number constraints.
 */
interface SchemaNode {
  type?: string;
  enum?: unknown[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  nullable?: boolean;
  minLength?: number;
  description?: string;
}

export function validateAgainstSchema(
  args: Record<string, unknown>,
  properties: Record<string, SchemaNode>,
  required: string[]
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  for (const key of required) {
    if (args[key] === undefined || args[key] === null || args[key] === "") {
      return { ok: false, error: `Missing required argument: '${key}'.` };
    }
  }

  for (const [key, node] of Object.entries(properties)) {
    const value = args[key];
    if (value === undefined || value === null) continue;

    if (node.type === "string") {
      if (typeof value !== "string") {
        return { ok: false, error: `Argument '${key}' must be a string.` };
      }
      if (node.minLength && value.length < node.minLength) {
        return { ok: false, error: `Argument '${key}' is too short.` };
      }
    } else if (node.type === "number" || node.type === "integer") {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { ok: false, error: `Argument '${key}' must be a number.` };
      }
      if (node.type === "integer" && !Number.isInteger(value)) {
        return { ok: false, error: `Argument '${key}' must be an integer.` };
      }
    }

    if (node.enum && !node.enum.includes(value)) {
      return {
        ok: false,
        error: `Argument '${key}' has an invalid value. Allowed: ${node.enum.join(", ")}.`,
      };
    }
  }

  const allowedKeys = new Set([...Object.keys(properties), ...required]);
  for (const key of Object.keys(args)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: `Unexpected argument: '${key}'.` };
    }
  }

  return { ok: true, value: args };
}

export type { SchemaNode };
