![ecrit](./public/e.png)

# ecrit

**ecrit** is a minimal, agent-native note-taking and Kanban workspace built for the **merging** the ability of AI to tinker with notes. 

Designed with a soft "Cactus & Paper" light aesthetic, ecrit seamlessly pairs human workflow with AI agent capabilities. Instead of relying on brittle DOM scraping or visual coordinates, ecrit exposes client-side tool primitives via the emerging **WebMCP standard** (`navigator.modelContext`), allowing in-browser AI agents (such as ChatGPT's in-app browser) to safely navigate, create, and organize notes alongside you in real time.

## Key Features

* **WebMCP Native Integration:** Registers structured client tools (`create_task_card`, `move_card`, `update_markdown`) directly to `navigator.modelContext` using `@mcp-b/global`.
* **Cactus & Paper Design System:** Soft cream background, warm paper containers, subtle sage borders, and rounded typography designed to complement the friendly `ecrit` brand identity.
* **Fluid 3-Column Kanban:** Vertical auto-layout (To Do, In Progress, Done) with clean Markdown rendering via `marked`.
* **Prompt Injection Defenses:** Input sanitization, strict JSON schema validation, string length constraints, and safe HTML output parsing to isolate untrusted agent/user inputs.
* **Real-time Tool Execution Logs:** Minimal UI toast strip monitoring tool calls executed by connected AI agents.

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Typography:** Quicksand (Headings) & Noto Serif (Card Body)
* **Markdown Engine:** [marked](https://marked.js.org/)
* **Agent Context Protocol:** `@mcp-b/global` (WebMCP Polyfill)

## Getting Started

### Prerequisites

Ensure you have **Node.js 18+** installed on your machine.

### Installation

1. Clone the repository:

```bash
git clone [https://github.com/codersilicon/ecrit.git](https://github.com/codersilicon/ecrit.git)
cd ecrit
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing WebMCP Integration

To test and inspect registered tools locally:

### 1. In Google Chrome

1. Navigate to `chrome://flags/#enable-webmcp-testing` in Chrome Canary/Dev.
2. Enable the flag and relaunch Chrome.
3. Open DevTools (`F12`), navigate to the **Application** tab, and inspect the **WebMCP** panel to view registered tools (`create_task_card`, `move_card`, `update_markdown`).

### 2. In ChatGPT Browser

Deploy your application to Vercel, Netlify, or Cloudflare, and open your live URL directly inside **ChatGPT’s in-app browser**. The agent will automatically discover the exposed WebMCP tool definitions.



## Exposed WebMCP Tools

ecrit exposes 7 client-side tools to connected AI agents via `navigator.modelContext`. Tools are categorized into `READ` operations (safe query actions) and `WRITE` operations (state-mutating actions requiring validation or human approval).

| Tool Name | Type | Description | Parameters |
| :--- | :--- | :--- | :--- |
| `create_task_card` | WRITE | Creates a new markdown note on the board | `title` (string), `content` (markdown string), `status` (`todo` \| `in-progress` \| `done`) |
| `move_card` | WRITE | Moves an existing note to a different column | `cardId` (number), `targetColumn` (`todo` \| `in-progress` \| `done`) |
| `update_markdown` | WRITE | Updates the body text of a note in real time | `cardId` (number), `markdownContent` (string) |
| `rename_card` | WRITE | Updates the title of an existing card | `cardId` (number), `newTitle` (string) |
| `delete_card` | WRITE | Prompts user confirmation (`window.confirm`) to delete a note | `cardId` (number) |
| `search_cards` | READ | Case-insensitive keyword search across note titles and content | `query` (string) |
| `get_board_summary` | READ | Returns a full structured inventory of all cards and column counts | *None* |

## Security & Guardrails

* **Sanitization:** All input strings passed to tool handlers are sanitized to prevent stored XSS and context-stuffing attacks.
* **Privilege Boundaries:** WebMCP tools operate purely within client-side application state, ensuring agents cannot perform unauthenticated API side effects.



## License

MIT License. Built for the OpenAI WebMCP Challenge.
