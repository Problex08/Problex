# Problex

> Validate your MCP server before you ship.

This is what Problex found on DeepWiki's live MCP server:

```
CHECK 1 · CLARITY ANALYSIS

  [2/3] read_wiki_contents
       Clarity: 5/10  — Fails to specify which documentation page is
       returned or whether an agent must pass a topic name to retrieve
       specific content.

CHECK 2 · AMBIGUITY ANALYSIS

  ⚠ read_wiki_structure ↔ read_wiki_contents  [HIGH — confirmed by simulation]
    Both require only repoName and both access repository documentation —
    an agent has no signal to distinguish topic-listing from content-retrieval.
    Confirmed by Scenario 2 — agent picked read_wiki_structure instead.

CHECK 3 · COMPATIBILITY TESTING

  Scenario 2: "Show me the full documentation content for kubernetes/kubernetes.
  I want to read the actual pages"
    Expected: read_wiki_contents  →  Picked: read_wiki_structure  ✗
```

A real, publicly hosted MCP server. Its schemas all validate — every structural check passes. But two of its three tools describe the same thing well enough that an agent reliably picks the wrong one, and Problex's scenario simulation caught the exact failure the ambiguity check predicted. No hand-written test case found this. It was generated, run, and confirmed automatically.

## What it is

Problex checks whether an agent can actually use your MCP server correctly, not just whether its schemas parse. MCP servers expose tools to agents through nothing but a name, a description, and a JSON Schema — there's no compiler and no test suite that catches "this description is ambiguous enough that an agent will call the wrong tool 30% of the time." A server can pass every structural validator you throw at it and still fail in production, silently, because an agent picked `list_files` when it meant `search_files`. That's a reasoning failure, not a schema failure, and existing tools don't look for it. Problex does: it scores tool description clarity, flags ambiguous tool pairs, and then simulates real agent behavior against generated scenarios to confirm whether the confusion it predicted actually happens.

> ⚠ Known limitation: Behavior testing currently runs against a single model (Claude). A passing report means "verified for Claude-based agents" — not verified for all agents. A tool description that confuses Claude may not confuse GPT or Gemini, and vice versa. Multi-model testing is on the roadmap.

## How it's different

Tools like `mcp-evals`, `alpic-ai/mcp-eval`, and `lastmile-ai/mcp-eval` all require you to hand-write test cases before you get any signal — you have to already know what to test for. Problex needs none of that: paste a URL, and it generates realistic request scenarios from your actual tool set, runs them, and reports what broke. Zero setup, zero hand-written test cases.

This checks reasoning-clarity and agent compatibility — not security. MCP Inspector covers protocol-level debugging. Problex completes the workflow after Inspector: use Inspector to debug, use Problex to validate agents can actually use it.

## How it works

**Layer 1 — Protocol Validation** *(programmatic)*
Connects over MCP's Streamable HTTP transport, calls `tools/list`, and validates every tool's `inputSchema` against a full JSON Schema validator built on Zod — correct `properties`, `required`, nested `$ref`/`$defs`, composition keywords, the works. No model involved, no API key required.

**Layer 2 — Behavior Validation** *(automated)*
- **Clarity Analysis** — scores each tool's description 1–10 and states the specific problem, not a vague "could be clearer."
- **Ambiguity Analysis** — compares every pair of tools and flags pairs whose descriptions overlap enough that an agent has no reliable signal to pick between them, ranked HIGH when a scenario confirms the mix-up and LOW when it's only structural resemblance.
- **Compatibility Testing** — auto-generates realistic user requests from your tool set (more scenarios for servers with more tools or more flagged ambiguous pairs), then has an agent pick a tool for each request independently, blind to which tool was "expected." Zero hand-written test cases at any point.
- Argument validation is fully programmatic (Zod-based, zero LLM cost) — a tool's `inputSchema` is compiled into a Zod schema and picked arguments are validated against it deterministically.

Argument schema validation is code, not AI. LLM is only used where code cannot — judging description clarity and simulating agent reasoning.

## Production verdict explanation

- **✅ Ready for Production** — no critical issues or warnings found; safe to ship as-is.
- **⚠ Ready with Minor Improvements** — no critical issues, but warnings (low-clarity descriptions, confirmed ambiguous pairs, or argument-quality issues) should be addressed before scaling usage.
- **❌ Not Ready** — critical issues found (failed schemas or scenarios where the agent picked the wrong tool) that will misroute real requests; fix before shipping.

> Note: "Ready for Production" means schema valid and the tested model correctly selected tools across generated scenarios. Not exhaustive testing across all models, all possible phrasings, or edge cases outside generated scenarios.

## Quick start (CLI)

Requires Node 18+.

```bash
npm install
npm run check https://your-server.com/mcp --ai
```

Layer 1 (protocol validation) needs no API key. Layer 2 (`--ai`) needs `ANTHROPIC_API_KEY` set in a `.env` file at the project root or exported in your shell.

## Web app

Live at **https://problex.dev**

No account required. 10 free checks per hour.

- For private servers: use the Authorization Header field.
- For stdio servers: use the CLI tool.

## Tech stack

- [`zod`](https://github.com/colinhacks/zod) v4 for programmatic JSON Schema and argument validation
- [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript), model `claude-haiku-4-5`, for the AI reasoning layer only (clarity, ambiguity, scenario simulation)
- [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) for the MCP client / Streamable HTTP transport
- CLI: TypeScript run via [`tsx`](https://github.com/privatenumber/tsx), [`commander`](https://github.com/tj/commander.js) for the CLI surface
- Web: Next.js 15 (App Router) + React 19, Tailwind CSS, [Upstash Redis](https://upstash.com/) for rate limiting, deployed on Vercel

## Roadmap

- **V2** — Security scanning, check history, performance benchmarking
- **V3** — GitHub Action / watch mode, multi-model testing, billing
- **V4** — Enterprise features, badge program

## Contributing

Issues and PRs welcome. The root project (`src/checker.ts`) is the CLI; `web/` is a separate Next.js app that reimplements the same Layer 1/Layer 2 logic (`web/src/lib/layer1.ts`, `web/src/lib/layer2.ts`) behind API routes — if you change checker behavior, update both. Layer 2 prompts are deliberately strict about output format to keep verdicts specific instead of hedgy; if you touch those, sanity-check a few real runs, not just the schema. Open a PR against `main`.
