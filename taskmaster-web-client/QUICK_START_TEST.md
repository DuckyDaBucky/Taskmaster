# Quick Start - Testing the Enhanced AI Assistant

## 1. Start the Development Server

```bash
cd taskmaster-web-client
npm run dev
```

## 2. Log In
- Open http://localhost:5173 (or your dev URL)
- Log in with your account
- Make sure you have some data (tasks, classes, events)

## 3. Open the AI Assistant
- Look for the TaskMaster logo in the bottom-right corner
- Click to open the chat widget
- Wait for "● Connected" status to appear (2-3 seconds)

## 4. Try These Test Questions

### Test 1: Check Platform Integration
**Ask:** "What can you help me with on Taskmaster?"

**Expected:** Should describe platform features (Tasks, Calendar, Flashcards, etc.)

### Test 2: Check Your Data
**Ask:** "What are my upcoming tasks?"

**Expected:** Should list YOUR actual tasks from the database

### Test 3: Check Classes
**Ask:** "What classes am I taking?"

**Expected:** Should list YOUR enrolled classes

### Test 4: Check Progress
**Ask:** "How am I doing this week?"

**Expected:** Should give stats on YOUR completion rate and upcoming deadlines

### Test 5: Platform Navigation
**Ask:** "Where can I get study help on this website?"

**Expected:** Should guide you to TaskMaster features (not external UTD resources)

## 5. Test the Refresh Button

1. Open another browser tab
2. Add a new task in TaskMaster
3. Go back to the AI chat
4. Click the refresh icon (🔄) in the header
5. Ask "What are my tasks?" - should include the new task

## 6. Check Console (Optional)

Open browser DevTools (F12) and check for:
- No errors in Console tab
- Network tab shows successful API calls to `/api/gemini/chat`
- Supabase queries returning data

## What to Look For

### ✅ Good Signs:
- AI mentions specific data from YOUR account
- Responses reference platform features
- "Connected" indicator appears
- Conversation flows naturally with follow-ups
- Refresh button updates context

### ❌ Red Flags:
- Generic responses not related to your data
- Errors in console
- "Context not loaded" or similar messages
- AI doesn't know about platform features
- Takes forever to load

## Example Successful Conversation

```
You: Hi

AI: Hey! I'm TaskMaster, your personal study assistant. I can help 
you manage tasks, check deadlines, create flashcards, and organize 
your classes. What would you like to work on?

You: What do I need to work on today?

AI: You have 3 tasks due soon:
- Calculus homework (due tomorrow)
- CS 3305 project (due in 2 days)
- Physics lab report (due Friday)

I'd tackle the Calculus homework first since it's due tomorrow! 
Check your Tasks page to get started.

You: What classes am I in?

AI: You're enrolled in 4 classes:
- CS 3305 (Prof. Johnson) - Topics: Algorithms, Data Structures
- MATH 2414 (Prof. Smith) - Topics: Calculus, Integration
- PHYS 2325 - Lab-based course
- HIST 1301

Need help with any of these?
```

## Troubleshooting

### Issue: "Connected" doesn't appear
**Solution:**
- Check if you're logged in
- Look for errors in console
- Verify Supabase connection in `.env`

### Issue: AI gives generic responses
**Solution:**
- Click refresh button in AI header
- Check if you have any data (tasks, classes) in your account
- Verify `aiContextService` is importing correctly

### Issue: API errors
**Solution:**
- Check `GEMINI_API_KEY` in `.env`
- Verify Gemini API quota: https://aistudio.google.com/app/apikey
- Check Vercel function logs if deployed

### Issue: Slow responses
**Solution:**
- Check internet connection
- Verify Supabase isn't rate-limiting
- Gemini might be throttling - wait 60 seconds

## Next Steps

Once everything works:
1. ✅ Push changes to GitHub
2. ✅ Deploy to Vercel (auto-deploys on push)
3. ✅ Test on production URL
4. ✅ Share with users and gather feedback

## Need Help?

Check these files:
- `AI_ASSISTANT_GUIDE.md` - User-facing guide
- `AI_INTEGRATION_SUMMARY.md` - Technical implementation details
- `src/services/aiContextService.ts` - Data fetching logic
- `src/components/AIAssistant.tsx` - UI component
- `api/gemini/chat.ts` - API endpoint

Happy testing! 🎉
