import { NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    return NextResponse.json({ status: 'ok' }, { status: 200, headers: corsHeaders });
}

export async function POST() {
    return NextResponse.json({ status: 'ok' }, { status: 200, headers: corsHeaders });
}
