# Problex

> Validate your MCP server before you ship.

This is what Problex found on DeepWiki's live MCP server:

```
CHECK 1 · CLARITY ANALYSIS

  [2/3] read_wiki_contents
       Clarity: 5/10 — Fails to specify which documentation page is
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

**Reproduce this yourself:** go to [problex.dev/check](https://problex.dev/check), paste `https://mcp.deepwiki.com/mcp`, and run a full validation. The exact clarity score may shift slightly between runs — the underlying model isn't deterministic on scoring — but the confusion pair itself is structural and shows up consistently.

Also tested against Microsoft's Release Communications server, Roundtable MCP (13 tools, 9+ confusion pairs flagged), and others — the pattern holds on every real server we've thrown at it, not just this one.

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
- **❌ Not Ready** — one or more critical issues found (a schema failure, or a scenario where an agent picked the wrong tool) — these should be fixed before shipping.

## CLI

For public MCP servers, the CLI runs the same checks as [problex.dev/check](https://problex.dev/check) from your terminal.

```bash
git clone https://github.com/Problex08/Problex.git
cd Problex
npm install
npm run check <url> --ai
```

Requires an `ANTHROPIC_API_KEY` environment variable for Layer 2 checks. Omit `--ai` to run Layer 1 (protocol/schema validation) only, with no API key required.

> The CLI currently supports the same Streamable HTTP transport as the web app — it does not yet support connecting to local servers over stdio.

## Links

[problex.dev](https://problex.dev) · [Report an issue](https://github.com/Problex08/Problex/issues)
