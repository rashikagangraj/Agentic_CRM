#!/usr/bin/env node
// aiKart AgentManifest v1 runner.
//
// Reuses the existing Agentic CRM Next.js API routes (/api/marketing/research
// and /api/marketing/generate) over HTTP against the app's own running
// server — no Gemini/Perplexity logic is duplicated here.
//
// Buyer input normally arrives as a FLAT object matching the manifest's
// structured `inputs` (aiKart's Batch Mode form). But aiKart also has a
// free-text "Try Me" chat interface that may send a single natural-language
// description with no separate fields at all — not even `workflow`. To work
// under either UI, this runner calls /api/marketing/extract (Gemini-backed,
// same server) to derive structured fields AND infer the workflow itself
// from free text, ONLY when something required is missing — the primary,
// documented structured input shape is untouched and never pays this extra
// cost. No Gemini SDK is imported here directly: the Next.js standalone
// output only bundles @google/genai into its own compiled server chunks,
// so it isn't resolvable from an external script.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const INPUT_PATH = process.env.AIKART_INPUT_PATH || "/aikart/input.json";
const OUTPUT_PATH = process.env.AIKART_OUTPUT_PATH || "/aikart/output.json";
const PORT = process.env.PORT || "8100";
const BASE_URL = process.env.AIKART_BASE_URL || `http://127.0.0.1:${PORT}`;

function loadInput() {
  if (process.env.AIKART_INPUT) {
    try {
      return typeof process.env.AIKART_INPUT === "string"
        ? JSON.parse(process.env.AIKART_INPUT)
        : process.env.AIKART_INPUT;
    } catch {
      return { prompt: process.env.AIKART_INPUT };
    }
  }
  if (existsSync(INPUT_PATH)) {
    try {
      const content = readFileSync(INPUT_PATH, "utf-8").trim();
      return JSON.parse(content);
    } catch {
      const rawText = readFileSync(INPUT_PATH, "utf-8").trim();
      return { prompt: rawText };
    }
  }
  throw new Error(
    `No input provided. Set the AIKART_INPUT env var or mount a file at ${INPUT_PATH}`
  );
}

function writeOutput(response) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify({ format: "markdown", response }));
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing or invalid required field: ${fieldName}`);
  }
}

function parseChannels(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeInput(raw) {
  if (typeof raw === "string") {
    return { prompt: raw };
  }
  const input = { ...raw };

  // Support nested businessProfile
  if (raw.businessProfile && typeof raw.businessProfile === "object") {
    input.businessName = input.businessName || raw.businessProfile.businessName;
    input.niche = input.niche || raw.businessProfile.niche;
    input.category = input.category || raw.businessProfile.category;
    input.city = input.city || raw.businessProfile.address?.city;
  }

  // Support nested businessContext
  if (raw.businessContext && typeof raw.businessContext === "object") {
    input.businessName = input.businessName || raw.businessContext.businessName;
    input.niche = input.niche || raw.businessContext.niche;
    input.category = input.category || raw.businessContext.category;
    input.targetAudience = input.targetAudience || raw.businessContext.targetAudience;
  }

  // Support nested marketingConfig
  if (raw.marketingConfig && typeof raw.marketingConfig === "object") {
    input.marketingGoal = input.marketingGoal || raw.marketingConfig.goal;
    input.budget = input.budget || raw.marketingConfig.budget;
    input.channels = input.channels || raw.marketingConfig.channels;
  }

  // Support format vs contentFormat
  if (!input.contentFormat && raw.format) {
    input.contentFormat = raw.format;
  }

  return input;
}

const KNOWN_STRUCTURED_KEYS = new Set([
  "workflow", "businessName", "niche", "category", "city", "marketingGoal", "budget",
  "channels", "simulatePerplexity", "topic", "tone", "contentFormat", "targetAudience",
  "businessProfile", "businessContext", "marketingConfig", "format",
]);
const FREE_TEXT_KEYS = [
  "prompt", "message", "text", "input", "query", "description", "task",
  "document_text", "user_input", "request", "content"
];

function findFreeTextCandidate(raw) {
  if (typeof raw === "string") return raw;
  for (const key of FREE_TEXT_KEYS) {
    if (typeof raw[key] === "string" && raw[key].trim().length > 0) return raw[key];
  }
  for (const [key, value] of Object.entries(raw)) {
    if (!KNOWN_STRUCTURED_KEYS.has(key) && typeof value === "string" && value.trim().length > 10) {
      return value;
    }
  }
  return null;
}

function missingRequiredFields(input) {
  if (input.workflow !== "research" && input.workflow !== "generate") return true;
  if (!input.businessName || !input.niche || !input.category) return true;
  if (input.workflow === "generate" && (!input.topic || !input.tone || !input.contentFormat)) {
    return true;
  }
  return false;
}

function validate(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Input must be a JSON object");
  }
  if (input.workflow !== "research" && input.workflow !== "generate") {
    throw new Error('Field "workflow" must be either "research" or "generate"');
  }

  requireString(input.businessName, "businessName (or businessProfile.businessName)");
  requireString(input.niche, "niche (or businessProfile.niche)");
  requireString(input.category, "category (or businessProfile.category)");

  if (input.workflow === "generate") {
    input.topic = input.topic || "Business Overview & Value Proposition";
    input.tone = input.tone || "professional";
    input.contentFormat = input.contentFormat || "social post";
  }
}

async function callApi(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Request to ${path} returned a non-JSON response (status ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.details || `Request to ${path} failed with status ${res.status}`);
  }
  return data;
}

function formatResearchMarkdown(businessName, report) {
  const competitors =
    Array.isArray(report.competitors) && report.competitors.length
      ? report.competitors
          .map((c) => `| ${c.name || "-"} | ${c.strength || "-"} | ${c.weakness || "-"} |`)
          .join("\n")
      : "| _None found_ | | |";

  const trends =
    Array.isArray(report.trends) && report.trends.length
      ? report.trends.map((t) => `- ${t}`).join("\n")
      : "- No trends identified.";

  const strategy =
    Array.isArray(report.strategy) && report.strategy.length
      ? report.strategy.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "1. No strategy recommendations available.";

  return `# Market Research Report — ${businessName}

## Executive Summary
${report.summary || "No summary available."}

## Competitor Analysis
| Competitor | Strength | Weakness |
|---|---|---|
${competitors}

## Key Trends
${trends}

## Recommended Strategy
${strategy}
`;
}

function formatGenerateMarkdown(topic, content) {
  return `# ${topic}\n\n${content}`;
}

async function main() {
  const raw = loadInput();
  let input = normalizeInput(raw);

  if (missingRequiredFields(input)) {
    const freeText = findFreeTextCandidate(raw);
    if (freeText) {
      console.log("[aikart-runner] Structured fields missing — extracting from free-text input.");
      try {
        const knownWorkflow =
          input.workflow === "research" || input.workflow === "generate" ? input.workflow : undefined;
        const extracted = await callApi("/api/marketing/extract", {
          text: freeText,
          workflow: knownWorkflow,
        });

        // Merge extracted values, keeping non-empty input properties
        for (const [k, v] of Object.entries(extracted)) {
          if (!input[k] || (typeof input[k] === "string" && input[k].trim().length === 0)) {
            input[k] = v;
          }
        }
      } catch (err) {
        console.error("[aikart-runner] Free-text extraction failed:", err.message);
      }

      // "category" is only ever used as descriptive prompt context downstream
      // (never branched on), so if extraction still couldn't pin it down —
      // LLM extraction is non-deterministic and can fold it into "niche" —
      // default it rather than hard-failing a run that otherwise has
      // everything it needs. businessName/niche/topic/tone/contentFormat are
      // NOT defaulted: those are genuinely required, and inventing fake
      // values for them (e.g. "Target Business") would silently produce
      // meaningless output instead of a clear, actionable validation error.
      if (!input.category && input.businessName) {
        input.category = "services";
      }
    }
  }

  validate(input);

  let markdown;

  if (input.workflow === "research") {
    const businessProfile = {
      businessName: input.businessName,
      niche: input.niche,
      category: input.category,
      address: input.city ? { city: input.city } : undefined,
    };
    const marketingConfig = {
      goal: input.marketingGoal || undefined,
      budget: input.budget || undefined,
      channels: parseChannels(input.channels),
    };

    // Live market research powered by Gemini
    const report = await callApi("/api/marketing/research", {
      businessProfile,
      marketingConfig,
      simulatePerplexity: false,
    });
    markdown = formatResearchMarkdown(input.businessName, report);
  } else {
    const businessContext = {
      businessName: input.businessName,
      niche: input.niche,
      category: input.category,
      targetAudience: input.targetAudience || undefined,
    };

    const { content } = await callApi("/api/marketing/generate", {
      topic: input.topic,
      tone: input.tone,
      format: input.contentFormat,
      businessContext,
    });
    markdown = formatGenerateMarkdown(input.topic, content);
  }

  writeOutput(markdown);
  console.log(`[aikart-runner] Success. Output written to ${OUTPUT_PATH}`);
  process.exitCode = 0;
}

main().catch((err) => {
  console.error("[aikart-runner] Error:", err.message);
  try {
    writeOutput(`**Error:** ${err.message}`);
  } catch (writeErr) {
    console.error("[aikart-runner] Failed to write error output:", writeErr.message);
  }
  process.exitCode = 1;
});
