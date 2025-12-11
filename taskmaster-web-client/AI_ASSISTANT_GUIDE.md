# TaskMaster AI Assistant - User Guide

## Overview
The TaskMaster AI assistant is now **deeply integrated** with your platform data. It's not just a chatbot - it's your personal study companion that knows your tasks, classes, deadlines, and more!

## What Changed?

### Before ❌
- Generic responses about UTD resources
- No awareness of your actual TaskMaster data
- Couldn't help with platform-specific questions
- Disconnected from the website features

### After ✅
- **Full access to your TaskMaster data**:
  - Your tasks and deadlines
  - Your enrolled classes and professors
  - Your upcoming events
  - Your flashcard decks
  - Your completion stats
- **Context-aware responses** based on YOUR data
- **Platform navigation help** - guides you to the right features
- **Personalized study advice** based on your schedule

---

## Example Conversations

### 1. Checking Your Tasks
**User:** "What do I need to work on today?"

**AI:** "You have 3 tasks due soon:
- Calculus homework (due tomorrow)
- CS 3305 project (due in 2 days) 
- Physics lab report (due Friday)

I'd tackle the Calculus homework first since it's due tomorrow! Check your **Tasks page** to get started."

---

### 2. Getting Study Help on Platform
**User:** "Where can I get study help on this website?"

**AI:** "TaskMaster has several built-in study tools:
- 📝 **Flashcards Page** - Create decks for memorization (you already have 2 decks!)
- 📚 **Resources Page** - Organize study materials and notes
- 🎯 **Tasks Page** - Break assignments into manageable steps
- 📅 **Calendar Page** - Schedule study sessions and track events

What subject do you need help with?"

---

### 3. Progress Check
**User:** "How am I doing this week?"

**AI:** "Looking good! You've completed 8 out of 12 tasks this week (67% completion rate). You have 2 deadlines in the next 3 days:
- Data Structures assignment (tomorrow)
- Biology quiz prep (Wednesday)

Keep up the momentum! 🚀"

---

### 4. Class Information
**User:** "What classes am I taking?"

**AI:** "You're enrolled in 4 classes:
- CS 3305 (Prof. Johnson) - Topics: Algorithms, Data Structures
- MATH 2414 (Prof. Smith) - Topics: Calculus, Integration
- PHYS 2325 - Lab-based course
- HIST 1301

Need help with any of these?"

---

### 5. Upcoming Schedule
**User:** "What's on my calendar today?"

**AI:** "Today you have:
- CS 3305 Lecture @ 10:00 AM (SCI 1.102)
- Study Group @ 2:00 PM (Library 3rd Floor)
- Office Hours @ 4:30 PM (ECSS 3.704)

Don't forget your study group at 2 PM!"

---

### 6. Creating Study Materials
**User:** "I need to study for my biology exam"

**AI:** "Great! Here's how TaskMaster can help:

1. **Create flashcards**: Visit the Flashcards page and create a new deck for Biology
2. **Set up study tasks**: Break down topics in the Tasks page (cell structure, genetics, etc.)
3. **Schedule study time**: Add study blocks to your Calendar
4. **Upload resources**: Save notes and materials in the Resources page

Want me to guide you through any of these?"

---

## Features

### 🔄 Refresh Context Button
Click the refresh icon in the AI header to update your data if you've just added new tasks, events, or flashcards.

### 💬 Conversation Memory
The AI remembers your recent conversation (last 10 messages) so you can have natural back-and-forth discussions.

### 🎯 Smart Suggestions
Based on your upcoming deadlines and incomplete tasks, the AI proactively suggests what to work on next.

---

## Sample Questions to Try

**About Your Data:**
- "What are my upcoming deadlines?"
- "Show me my incomplete tasks"
- "What classes do I have today?"
- "How many flashcard decks do I have?"

**Platform Help:**
- "How do I create a new task?"
- "Where can I add flashcards?"
- "How do I track my progress?"
- "Can you explain the Calendar feature?"

**Study Planning:**
- "Help me plan my study schedule for this week"
- "What should I prioritize today?"
- "I'm behind on my CS project, what should I do?"

**General:**
- "What can you help me with?"
- "What features does TaskMaster have?"
- "How do I stay organized?"

---

## Technical Details

### Data Access
The AI fetches:
- Last 20 tasks (sorted by deadline)
- All active classes
- Next 10 upcoming events
- All flashcard decks (grouped by topic)
- Last 5 activities
- Completion statistics

### Privacy
- Your data never leaves the TaskMaster/Vercel/Gemini ecosystem
- The AI only accesses YOUR data (filtered by your user ID)
- No data is stored long-term by the AI

### Performance
- Context loads automatically when you open the assistant
- Takes ~1-2 seconds to fetch your data
- Refresh anytime with the refresh button

---

## Tips for Best Results

1. **Be specific**: "What's my CS homework?" works better than "What's my homework?"
2. **Ask follow-ups**: The AI remembers context, so you can continue conversations
3. **Refresh after changes**: If you add new tasks, hit the refresh button
4. **Explore features**: Ask about different TaskMaster features you haven't tried yet

---

## Coming Soon 🚀
- Direct task creation via AI chat
- Calendar event scheduling through conversation
- Automated flashcard generation from notes
- Study session recommendations based on your schedule

---

Happy studying! 📚✨
