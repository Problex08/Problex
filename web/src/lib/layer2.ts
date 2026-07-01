import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ToolInfo, Layer2Report, ClarityResult, ConfusionPair, SimulationResult } from './types';

// ─── Zod schemas for Claude responses ────────────────────────────────────────

const ClarityResponseSchema = z.array(z.object({
  name:    z.string(),
  score:   z.number(),
  verdict: z.string(),
}));

const ConfusionResponseSchema = z.object({
  confusedPairs: z.array(z.object({
    tool1:  z.string(),
    tool2:  z.string(),
    reason: z.string(),
  })),
});

const ScenariosResponseSchema = z.array(z.object({
  request:      z.string(),
  expectedTool: z.string(),
}));

const ToolPickResponseSchema = z.object({
  tool:      z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/s);
  return JSON.parse(fenced ? fenced[1].trim() : text.trim());
}

function toolsToPromptText(tools: ToolInfo[]): string {
  return JSON.stringify(
    tools.map(t => ({
      name:        t.name,
      description: t.description ?? '(no description)',
      inputSchema: t.inputSchema,
    })),
    null, 2,
  );
}

async function callClaude(
  anthropic: Anthropic,
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string> {
  const res = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system,
    messages:   [{ role: 'user', content: user }],
  });
  const block = res.content.find(b => b.type === 'text');
  return block?.type === 'text' ? block.text : '';
}

// ─── Check 1: Description Clarity ────────────────────────────────────────────

async function check1Clarity(tools: ToolInfo[], anthropic: Anthropic): Promise<ClarityResult[]> {
  const text = await callClaude(
    anthropic,
    'You are a tool quality evaluator for MCP servers. Respond only with valid JSON — no prose, no markdown.',
    `Evaluate the clarity of these MCP tools for an AI agent.
For each tool, rate its clarity 1–10 and give a one-line verdict: would an AI reliably know when to use it and what arguments to pass?

Tools:
${toolsToPromptText(tools)}

Respond with a JSON array in the same order as the input:
[{"name":"<tool_name>","score":<1-10>,"verdict":"<one-line explanation>"}]`,
  );
  return ClarityResponseSchema.parse(extractJSON(text));
}

// ─── Check 2: Tool Confusion Detection ───────────────────────────────────────

async function check2Confusion(tools: ToolInfo[], anthropic: Anthropic): Promise<ConfusionPair[]> {
  const text = await callClaude(
    anthropic,
    'You detect potential confusion between MCP tools. Respond only with valid JSON.',
    `Review these MCP tools and identify every pair whose descriptions are similar enough that an AI agent might pick the wrong one.

Tools:
${toolsToPromptText(tools)}

Respond with JSON:
{"confusedPairs":[{"tool1":"<name>","tool2":"<name>","reason":"<brief explanation>"}]}

If no pairs are confused, return {"confusedPairs":[]}`,
  );
  const parsed = ConfusionResponseSchema.parse(extractJSON(text));
  return parsed.confusedPairs;
}

// ─── Check 3: Scenario Simulation ────────────────────────────────────────────

async function check3Simulation(tools: ToolInfo[], anthropic: Anthropic): Promise<SimulationResult[]> {
  const genText = await callClaude(
    anthropic,
    'You generate realistic test scenarios for MCP tools. Respond only with valid JSON.',
    `Given these MCP tools, generate exactly 5 diverse, realistic user request scenarios. Each scenario must have a clear single correct tool.

Tools:
${toolsToPromptText(tools)}

Respond with a JSON array of exactly 5 items:
[{"request":"<user request>","expectedTool":"<tool_name>"}]`,
    1024,
  );
  const scenarios = ScenariosResponseSchema.parse(extractJSON(genText));

  const toolMenu = tools
    .map(t => `• ${t.name}: ${t.description ?? '(no description)'}`)
    .join('\n');

  const picks = await Promise.all(
    scenarios.map(s =>
      callClaude(
        anthropic,
        'You are an AI agent selecting MCP tools. Respond only with valid JSON.',
        `Available tools:\n${toolMenu}\n\nUser request: "${s.request}"\n\nWhich tool would you use and what arguments would you pass?\nRespond with JSON: {"tool":"<tool_name>","arguments":{<key>:<value>,...}}`,
        512,
      ),
    ),
  );

  return scenarios.map((s, i) => {
    let pick: z.infer<typeof ToolPickResponseSchema>;
    try {
      pick = ToolPickResponseSchema.parse(extractJSON(picks[i]));
    } catch {
      pick = { tool: '(parse error)', arguments: {} };
    }
    return {
      request:      s.request,
      expectedTool: s.expectedTool,
      pickedTool:   pick.tool,
      pickedArgs:   pick.arguments ?? {},
      correct:      pick.tool === s.expectedTool,
    };
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runLayer2(tools: ToolInfo[], apiKey: string): Promise<Layer2Report> {
  const anthropic = new Anthropic({ apiKey });

  // Clarity + Confusion run in parallel (each is one Claude call)
  const [clarity, confusedPairs] = await Promise.all([
    check1Clarity(tools, anthropic),
    check2Confusion(tools, anthropic),
  ]);

  const simulation = await check3Simulation(tools, anthropic);

  return {
    clarity,
    confusedPairs,
    simulation,
    simulationScore: simulation.filter(s => s.correct).length,
  };
}
