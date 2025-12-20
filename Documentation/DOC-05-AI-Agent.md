# DOC-05: AI Agent (Chatbot)

## Overview
The AI Agent is a floating chat widget that provides context-aware assistance. It can answer questions about your tasks, classes, deadlines, and study materials.

## How It Works
1. **User opens the chat widget** (bottom-right corner).
2. **Context is loaded**: The agent fetches your tasks, classes, and activities to understand your situation.
3. **User sends a message**: The message + context is sent to Google Gemini.
4. **Gemini responds**: The response is displayed in the chat.

## Technical Implementation

### UI Component
`src/components/AIAssistant.tsx`
- Floating button when closed.
- Expandable chat window with message history.
- File attachment support.

### Context Service
`src/services/aiContextService.ts`
- `getUserContext(userId)`: Fetches user data from Supabase.
- `buildSystemPrompt(context)`: Creates a detailed prompt with user's tasks, classes, and stats.

### API Route
`src/app/api/gemini/chat/route.ts`
- Receives: `{ message, systemPrompt, conversationHistory }`
- Calls Google Gemini API with the combined prompt.
- Returns: `{ response }`

### Example System Prompt
```
You are TaskMaster AI for [User Name].
Current date: 2025-01-15

User's Classes:
- CS3345 (Data Structures)
- HIST1301 (US History)

Upcoming Tasks:
- "Homework 3" due 2025-01-20 (CS3345)
- "Essay Draft" due 2025-01-18 (HIST1301)

Be helpful, concise, and action-oriented.
```

## Future Enhancements
- **Tool/Function Calling**: Let the agent create tasks, schedule events, or search courses directly.
- **Memory**: Persistent agent memory across sessions.
- **Proactive Suggestions**: "You have an exam tomorrow. Want study tips?"
