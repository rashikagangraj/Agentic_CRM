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
        content: "🚀 AI Marketing Content Engine is online and ready to generate high-converting copy."
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

        const { topic, tone, format, businessContext } = body;
        const ctx = businessContext || {};

        const businessName = ctx.businessName || body.businessName || "Sample Business";
        const niche = ctx.niche || body.niche || "CRM & Automation";
        const category = ctx.category || body.category || 'services';
        const targetAudience = ctx.targetAudience || body.targetAudience || 'General audience';
        const postTopic = topic || body.topic || 'Product Launch';
        const postTone = tone || body.tone || 'professional';
        const postFormat = format || body.contentFormat || body.format || 'social post';

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.error("Missing GEMINI_API_KEY");
            return NextResponse.json(
                { error: "Server configuration error: Missing GEMINI_API_KEY" },
                { status: 500, headers: corsHeaders }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const prompt = `
You are an expert marketing copywriter. Generate marketing content based on the following context.

Business Context:
- Business Name: ${businessName}
- Niche: ${niche}
- Category: ${category}
- Target Audience: ${targetAudience}

Task:
Write a ${postFormat} about the topic: "${postTopic}".
The tone should be: "${postTone}".

Make the content engaging, professional (unless tone says otherwise), and ready to publish.
Do not output JSON, just plain text ready to be copied.
`;

        let content = "";

        if (postTone === 'banana') {
            const bananaPrompt = prompt + "\n\nCRITICAL INSTRUCTION: You MUST activate BANANA MODE. Use banana puns, emojis, and references to yellow, monkeys, peeling, etc. Go absolutely bananas.";

            const geminiResponse = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: bananaPrompt,
            });
            content = geminiResponse.text || "Banana mode failed to generate text.";
        } else {
            const geminiResponse = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt,
            });
            content = geminiResponse.text || "Failed to generate text.";
        }

        return NextResponse.json({ content }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Generation API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate content', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
