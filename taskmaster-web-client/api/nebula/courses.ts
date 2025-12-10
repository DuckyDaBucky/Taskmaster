/**
 * Nebula API Proxy - Courses
 * Vercel Serverless Function
 * 
 * Proxies requests to Nebula API with API key (kept secret)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEBULA_API_URL = 'https://api.utdnebula.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEBULA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Nebula API key not configured' });
  }

  try {
    // Build query string from request query params
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        queryParams.append(key, value);
      }
    });

    const url = `${NEBULA_API_URL}/course?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Nebula API error: ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    // Cache for 1 hour (courses don't change often)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Nebula API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch from Nebula' });
  }
}

