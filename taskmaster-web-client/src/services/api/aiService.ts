/**
 * AI Service - Connects to Hugging Face Spaces TaskmasterRAG
 */

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'https://hasnainmn7-taskmasterrag.hf.space';

export interface SearchResult {
  text: string;
  score: number;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export const aiService = {
  /**
   * Process an uploaded document - extracts text, generates embeddings, stores in Qdrant
   */
  async processDocument(resourceId: string, userId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${AI_SERVICE_URL}/api/documents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resourceId, user_id: userId }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
      throw new Error(error.detail || 'Failed to process document');
    }
    
    return response.json();
  },

  /**
   * Semantic search across user's documents
   */
  async search(query: string, userId: string, classId?: string, limit: number = 5): Promise<{ results: SearchResult[] }> {
    const response = await fetch(`${AI_SERVICE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        user_id: userId, 
        class_id: classId || null,
        limit 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Search failed' }));
      throw new Error(error.detail || 'Failed to search');
    }
    
    return response.json();
  },

  /**
   * Generate flashcards using RAG
   */
  async generateFlashcards(classId: string, userId: string, topic?: string, count: number = 5): Promise<{ flashcards: Flashcard[] }> {
    const response = await fetch(`${AI_SERVICE_URL}/api/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        class_id: classId, 
        user_id: userId, 
        topic: topic || null,
        count 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Flashcard generation failed' }));
      throw new Error(error.detail || 'Failed to generate flashcards');
    }
    
    return response.json();
  },

  /**
   * Chat with AI agent that has context from user's documents
   */
  async chat(message: string, userId: string, conversationHistory: any[] = []): Promise<{ response: string }> {
    const response = await fetch(`${AI_SERVICE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        user_id: userId, 
        conversation_history: conversationHistory 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Chat failed' }));
      throw new Error(error.detail || 'Failed to chat');
    }
    
    return response.json();
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    return response.json();
  },
};

