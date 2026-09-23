import { NextResponse } from 'next/server';

// Single entrypoint for aiKart's "Test Endpoint" / Input Fields builder.
// aiKart's Batch Mode form (and its free-text "Try Me" box) POST a FLAT
// JSON object here — {workflow, businessName, niche, ...} at the top level,
// or a single free-text field with no structure at all — unlike
// /api/marketing/research and /api/marketing/generate, which expect nested
// businessProfile/businessContext shapes. This route normalizes either
// shape, reuses those two routes internally (no Gemini logic duplicated
// here, same pattern as aikart/runner.mjs), and always replies with a 2xx
// {format, response} body so aiKart's endpoint tester is satisfied.

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Agentic CRM aiKart endpoint is online. POST { workflow, businessName, niche, ... } or free text.",
    }, { status: 200, headers: corsHeaders });
}

function parseChannels(value: any): string[] {
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
}

function normalizeInput(raw: any) {
    if (typeof raw === "string") return { prompt: raw };
    const input: any = { ...raw };

    if (raw.businessProfile && typeof raw.businessProfile === "object") {
        input.businessName = input.businessName || raw.businessProfile.businessName;
        input.niche = input.niche || raw.businessProfile.niche;
        input.category = input.category || raw.businessProfile.category;
        input.city = input.city || raw.businessProfile.address?.city;
    }
    if (raw.businessContext && typeof raw.businessContext === "object") {
        input.businessName = input.businessName || raw.businessContext.businessName;
        input.niche = input.niche || raw.businessContext.niche;
        input.category = input.category || raw.businessContext.category;
        input.targetAudience = input.targetAudience || raw.businessContext.targetAudience;
    }
    if (raw.marketingConfig && typeof raw.marketingConfig === "object") {
        input.marketingGoal = input.marketingGoal || raw.marketingConfig.goal;
        input.budget = input.budget || raw.marketingConfig.budget;
        input.channels = input.channels || raw.marketingConfig.channels;
    }
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

function findFreeTextCandidate(raw: any): string | null {
    if (typeof raw === "string") return raw;
    for (const key of FREE_TEXT_KEYS) {
        if (typeof raw[key] === "string" && raw[key].trim().length > 0) return raw[key];
    }
    for (const [key, value] of Object.entries(raw)) {
        if (!KNOWN_STRUCTURED_KEYS.has(key) && typeof value === "string" && value.trim().length > 10) {
            return value as string;
        }
    }
    return null;
}

function missingRequiredFields(input: any): boolean {
    if (input.workflow !== "research" && input.workflow !== "generate") return true;
    if (!input.businessName || !input.niche || !input.category) return true;
    if (input.workflow === "generate" && (!input.topic || !input.tone || !input.contentFormat)) {
        return true;
    }
    return false;
}

function requireString(value: any, fieldName: string) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Missing or invalid required field: ${fieldName}`);
    }
}

function validate(input: any) {
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

async function callApi(baseUrl: string, path: string, body: any) {
    const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    let data: any;
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

function formatResearchMarkdown(businessName: string, report: any) {
    const competitors =
        Array.isArray(report.competitors) && report.competitors.length
            ? report.competitors
                .map((c: any) => `| ${c.name || "-"} | ${c.strength || "-"} | ${c.weakness || "-"} |`)
                .join("\n")
            : "| _None found_ | | |";

    const trends =
        Array.isArray(report.trends) && report.trends.length
            ? report.trends.map((t: string) => `- ${t}`).join("\n")
            : "- No trends identified.";

    const strategy =
        Array.isArray(report.strategy) && report.strategy.length
            ? report.strategy.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
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

function formatGenerateMarkdown(topic: string, content: string) {
    return `# ${topic}\n\n${content}`;
}

export async function POST(req: Request) {
    const baseUrl = new URL(req.url).origin;

    let raw: any = {};
    try {
        raw = await req.json();
    } catch {
        try {
            raw = { prompt: await req.text() };
        } catch {
            raw = {};
        }
    }

    try {
        let input = normalizeInput(raw);

        if (missingRequiredFields(input)) {
            const freeText = findFreeTextCandidate(raw);
            if (freeText) {
                const knownWorkflow =
                    input.workflow === "research" || input.workflow === "generate" ? input.workflow : undefined;
                try {
                    const extracted = await callApi(baseUrl, "/api/marketing/extract", {
                        text: freeText,
                        workflow: knownWorkflow,
                    });
                    for (const [k, v] of Object.entries(extracted)) {
                        if (!input[k] || (typeof input[k] === "string" && input[k].trim().length === 0)) {
                            input[k] = v;
                        }
                    }
                } catch (err: any) {
                    console.error("[aikart/run] Free-text extraction failed:", err.message);
                }

                // Identity fields (businessName/niche/topic/tone/contentFormat) are
                // never defaulted — see the anti-pattern note in research/generate
                // routes. category is purely descriptive context, so it's safe to
                // default when extraction couldn't pin it down.
                if (!input.category && input.businessName) {
                    input.category = "services";
                }
            }
        }

        validate(input);

        let markdown: string;

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
            const report = await callApi(baseUrl, "/api/marketing/research", {
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
            const { content } = await callApi(baseUrl, "/api/marketing/generate", {
                topic: input.topic,
                tone: input.tone,
                format: input.contentFormat,
                businessContext,
            });
            markdown = formatGenerateMarkdown(input.topic, content);
        }

        return NextResponse.json(
            { format: "markdown", response: markdown },
            { status: 200, headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('aiKart run endpoint error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request', format: "markdown", response: `**Error:** ${error.message}` },
            { status: 400, headers: corsHeaders }
        );
    }
}
