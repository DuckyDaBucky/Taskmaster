/**
 * Health check endpoint
 * Test: GET /api/health
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    }
  });
}

