import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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
        message: "Entity extraction engine is ready."
    }, { status: 200, headers: corsHeaders });
}

/**
 * Extracts structured business/task fields from a free-text description.
 * Used by the aiKart runner when a UI sends natural-language prose instead
 * of the manifest's structured input fields.
 */
export async function POST(req: Request) {
    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const { text, workflow } = body;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: "Missing required field: text" },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!geminiApiKey) {
            console.error("Missing GEMINI_API_KEY");
            return NextResponse.json(
                { error: "Server configuration error: Missing GEMINI_API_KEY" },
                { status: 500, headers: corsHeaders }
            );
        }

        const knownWorkflow = workflow === 'research' || workflow === 'generate' ? workflow : null;

        const workflowInstruction = knownWorkflow
            ? `The workflow is already known to be "${knownWorkflow}" — do not include a "workflow" key.`
            : `First determine "workflow": use "research" if the request is about researching a market, competitors, or trends; use "generate" if it's about writing/creating marketing content (a post, blog intro, ad copy, etc.). Always include "workflow" in your output with one of those two exact values.`;

        const researchFields = 'businessName, niche, category, city, marketingGoal, budget, channels';
        const generateFields = 'businessName, niche, category, topic, tone, contentFormat, targetAudience';
        const fieldsInstruction = knownWorkflow
            ? `Also extract these fields where present: ${knownWorkflow === 'generate' ? generateFields : researchFields}.`
            : `Also extract these fields where present — use ${researchFields} if workflow is "research", or ${generateFields} if workflow is "generate".`;

        const prompt = `Extract structured business/task information from the user's free-text request below.
${workflowInstruction}
${fieldsInstruction}
"category" is a broad business classification — pick the closest match from: retail, restaurant, e-commerce, services, healthcare, education, technology, manufacturing, real_estate, other. Always set "category" to one of these, even if the text only implies it (e.g. an interior design studio is "services").
"niche" is the specific focus within that category (e.g. "residential and boutique commercial interior design").
Return ONLY a JSON object. Include only keys you can confidently determine from the text; omit anything you can't find — do not invent values, except always include "category" per the rule above.
"channels" must be a single comma-separated string if present, not an array.
Do not include markdown, code fences, or commentary. Return ONLY raw JSON.

User request:
"""
${text}
"""`;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });

        let extracted = {};
        try {
            const parsed = JSON.parse(response.text ?? "{}");
            if (parsed && typeof parsed === 'object') extracted = parsed;
        } catch {
            // Extraction is best-effort — the runner's own validation is the safety net.
        }

        return NextResponse.json(extracted, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Extraction API Error:', error);
        return NextResponse.json(
            { error: 'Failed to extract structured input', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
