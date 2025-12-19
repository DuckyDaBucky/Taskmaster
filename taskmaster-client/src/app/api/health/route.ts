import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check API
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
