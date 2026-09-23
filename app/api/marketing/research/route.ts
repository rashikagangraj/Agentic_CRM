import { NextResponse } from "next/server";
import { Perplexity } from "@perplexity-ai/perplexity_ai";
import { GoogleGenAI } from "@google/genai";

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
        summary: "Market research analysis engine is online and ready.",
        competitors: [
            { name: "Sample Competitor Inc", strength: "High brand awareness", weakness: "Slow client response time" }
        ],
        trends: [
            "AI-powered agentic CRM workflows",
            "Real-time intent-based lead scoring"
        ],
        strategy: [
            "Leverage autonomous market intelligence",
            "Optimize omnichannel outreach"
        ]
    }, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const { businessProfile, marketingConfig, simulatePerplexity } = body;
        const profile = businessProfile || {};
        const config = marketingConfig || {};

        // businessName/niche identify the business — faking them (e.g. "Sample
        // Business") would produce a report that's confidently wrong rather
        // than a clear error. category/city are just descriptive context, so
        // those can safely default.
        const businessName = profile.businessName || body.businessName;
        const niche = profile.niche || body.niche;
        if (!businessName || !niche) {
            return NextResponse.json(
                { error: "Missing required field: businessName and niche are required" },
                { status: 400, headers: corsHeaders }
            );
        }
        const category = profile.category || body.category || "services";
        const city = profile.address?.city || profile.city || body.city || "National/Global";

        const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.error("Missing GEMINI_API_KEY");
            return NextResponse.json(
                { error: "Server configuration error: Missing GEMINI_API_KEY" },
                { status: 500, headers: corsHeaders }
            );
        }

        let rawResearchText = "";

        // --- STEP 1: Research (Perplexity, Simulation, or Gemini Deep Analysis) ---
        if (simulatePerplexity) {
            console.log(
                "[Research] SIMULATION MODE: Skipping live web search API cost."
            );
            rawResearchText = `
[SIMULATED RESEARCH OUTPUT FOR TESTING]

Executive Summary:
The market for ${niche} in ${city} is growing steadily. Key opportunities exist in digital channels.

Competitors:
1. Big Corp Inc: Strong brand presence but slow customer service.
2. Local Hero Ltd: Great local loyalty but poor online website.
3. Budget Options LLC: Very cheap prices but low quality products.

Trends:
- Increasing demand for eco-friendly options.
- Shift towards mobile-first shopping experiences.
- Rise of subscription models in this sector.

Strategy:
- Focus on Instagram reels to capture younger audience.
- Launch a "Green" product line to address eco-trends.
- Improve website load speed for mobile users.
- Partner with local influencers for authenticity.
      `;
        } else if (perplexityApiKey) {
            const perplexityClient = new Perplexity({ apiKey: perplexityApiKey });

            const budget = marketingConfig?.budget || "Not specified";
            const channels = Array.isArray(marketingConfig?.channels)
                ? marketingConfig.channels.join(", ")
                : "None specified";

            console.log(
                `[Research] Starting deep research for: ${businessName}`
            );

            const researchSystemPrompt = `You are a world-class marketing researcher.
Conduct a thorough deep-dive analysis based on the user's business details.
Focus on finding REAL, current competitors and ACTUAL market trends from the live web.

Provide a comprehensive, detailed report covering:
1. Executive Summary
2. Detailed Competitor Analysis (Strengths/Weaknesses)
3. Key Market Trends
4. Strategic Recommendations

Do NOT output JSON. Just provide high-quality, dense information in plain text.`;

            const researchUserPrompt = `
Business Name: ${businessName}
Niche/Category: ${niche} (${category})
Marketing Goal: ${config?.goal || "Deep Market Analysis"}
Target Audience: People interested in ${niche}
Budget: ${budget}
Channels: ${channels}

Conduct deep research now.
`;

            const pplxResponse = await perplexityClient.chat.completions.create({
                model: "sonar-pro",
                messages: [
                    { role: "system", content: researchSystemPrompt },
                    { role: "user", content: researchUserPrompt },
                ],
                stream: true,
                web_search_options: {
                    search_type: "pro",
                },
            });

            for await (const chunk of pplxResponse) {
                const piece = chunk.choices[0]?.delta?.content;
                if (piece) rawResearchText += piece;
            }
            console.log(
                `[Research] Perplexity completed. Length: ${rawResearchText.length} chars.`
            );
        } else {
            // Live Research powered directly by Google Gemini
            const ai = new GoogleGenAI({ apiKey: geminiApiKey! });
            const geminiResearchPrompt = `You are a world-class marketing intelligence specialist.
Conduct a deep market research report for:
Business Name: ${businessName}
Niche/Category: ${niche} (${category})
Location: ${city}
Goal: ${config?.goal || "Market Growth & Competitor Analysis"}

Analyze real competitor landscape, industry trends, customer pain points, and actionable marketing strategies.
Provide dense, realistic, and insightful findings in plain text.`;

            const geminiRes = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: geminiResearchPrompt,
            });
            rawResearchText = geminiRes.text || "Market analysis completed.";
        }

        // --- STEP 2: Parse with Gemini into your ResearchReport shape ---
        const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

        const parsingPrompt = `
You are a strict JSON extraction engine.

You will be given a FULL raw marketing research report (including executive summary, competitors, trends, strategy, etc).
Read the ENTIRE report carefully and then return ONLY a JSON object in this EXACT shape:

{
  "summary": "A high-level executive summary (max 3 sentences)",
  "competitors": [
    { "name": "Name", "strength": "Key strength", "weakness": "Key weakness" }
  ],
  "trends": ["Trend 1", "Trend 2", "Trend 3"],
  "strategy": [
    "Specific actionable strategy step 1",
    "Step 2",
    "Step 3",
    "Step 4"
  ]
}

Rules:
- Always include ALL 4 top-level keys: "summary", "competitors", "trends", "strategy".
- If you can't find some section, still return the key with an empty array (e.g. "competitors": []).
- "summary" MUST be max 3 sentences and truly capture the full report, not just one section.
- "competitors" must be derived from ALL competitor info in the report (merge duplicates, be concise).
- "trends" must be the MOST important market/consumer/industry trends mentioned in the report.
- "strategy" must be concrete, actionable recommendations derived from the whole report, tailored to the business.
- Do NOT include any markdown, code fences, commentary, or extra fields. Return ONLY raw JSON.

Raw Report:
"""
${rawResearchText}
"""
`;

        let parsedJsonText: string | null = null;

        try {
            const geminiResponse = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: parsingPrompt,
                config: {
                    // Forces JSON-only output
                    responseMimeType: "application/json",
                },
            });

            // In @google/genai, text is a string property
            parsedJsonText = geminiResponse.text ?? null;
            console.log("[Research] Gemini Parsing complete.");
        } catch (geminiError) {
            console.warn(
                "[Research] Gemini Parsing Failed. Falling back to raw text.",
                geminiError
            );
        }

        let report: {
            summary: string;
            competitors: { name: string; strength: string; weakness: string }[];
            trends: string[];
            strategy: string[];
        } | null = null;

        if (parsedJsonText) {
            try {
                report = JSON.parse(parsedJsonText);
            } catch (e) {
                console.error("JSON parse failed on Gemini output", e);
            }
        }

        // Final fallback if Gemini/JSON fails
        if (!report) {
            report = {
                summary:
                    "Research completed, but structured JSON parsing failed. Showing raw report text under 'strategy'.",
                competitors: [],
                trends: [],
                strategy: [rawResearchText || "No data received."],
            };
        }

        return NextResponse.json(report, { headers: corsHeaders });
    } catch (error: any) {
        console.error("Research API Error:", error);
        return NextResponse.json(
            { error: "Failed to complete research", details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}

