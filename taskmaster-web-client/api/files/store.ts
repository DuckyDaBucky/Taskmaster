/**
 * Gemini File Search Store API
 * POST /api/files/store - Create or get user's file search store
 * GET /api/files/store - Get store info
 * DELETE /api/files/store - Delete store
 * 
 * Uses Gemini File Search for zero-maintenance RAG
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    switch (req.method) {
      case 'POST':
        return await createStore(req, res);
      case 'GET':
        return await getStore(req, res);
      case 'DELETE':
        return await deleteStore(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Store API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Create a new File Search Store for a user
 */
async function createStore(req: VercelRequest, res: VercelResponse) {
  const { user_id, display_name } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  // Check if user already has a store
  if (supabase) {
    const { data: existing } = await supabase
      .from('file_search_stores')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.status(200).json({
        store: existing,
        message: 'Store already exists',
        created: false,
      });
    }
  }

  // Create store via Gemini API
  const storeName = display_name || `taskmaster_${user_id.slice(0, 8)}`;
  
  const response = await fetch(`${GEMINI_BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: storeName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create store:', error);
    return res.status(response.status).json({ error: 'Failed to create file search store' });
  }

  const storeData = await response.json();

  // Save store reference in Supabase
  if (supabase) {
    const { error: insertError } = await supabase
      .from('file_search_stores')
      .insert({
        user_id,
        store_name: storeData.name,
        display_name: storeName,
        metadata: storeData,
      });

    if (insertError) {
      console.error('Failed to save store reference:', insertError);
    }
  }

  return res.status(201).json({
    store: {
      name: storeData.name,
      display_name: storeName,
      user_id,
    },
    message: 'Store created successfully',
    created: true,
  });
}

/**
 * Get user's File Search Store info
 */
async function getStore(req: VercelRequest, res: VercelResponse) {
  const user_id = req.query.user_id as string;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const { data: store, error } = await supabase
    .from('file_search_stores')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error || !store) {
    return res.status(404).json({ error: 'No store found for user' });
  }

  // Optionally fetch store status from Gemini
  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/${store.store_name}?key=${GEMINI_API_KEY}`
    );
    
    if (response.ok) {
      const geminiStore = await response.json();
      return res.status(200).json({
        ...store,
        gemini_status: geminiStore,
      });
    }
  } catch (e) {
    console.warn('Could not fetch Gemini store status:', e);
  }

  return res.status(200).json(store);
}

/**
 * Delete user's File Search Store
 */
async function deleteStore(req: VercelRequest, res: VercelResponse) {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Get store name
  const { data: store } = await supabase
    .from('file_search_stores')
    .select('store_name')
    .eq('user_id', user_id)
    .single();

  if (store?.store_name) {
    // Delete from Gemini
    try {
      await fetch(`${GEMINI_BASE_URL}/${store.store_name}?key=${GEMINI_API_KEY}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Could not delete Gemini store:', e);
    }
  }

  // Delete from our database
  await supabase
    .from('file_search_stores')
    .delete()
    .eq('user_id', user_id);

  // Also delete file references
  await supabase
    .from('file_search_files')
    .delete()
    .eq('user_id', user_id);

  return res.status(200).json({ message: 'Store deleted' });
}
