**This project is a part of AIS Innovation Labs**

Taskmaster is an AI driven academic productivity system that transforms unstructured course materials into organized tasks, schedules, and action plans. Using Gemini powered RAG extraction, Taskmaster reads syllabi, assignments, emails, and calendar data, then automatically generates deadlines, reminders, and workflow structures tailored to the user. The platform reduces manual planning, streamlines academic organization, and acts as an intelligent assistant that helps students stay ahead of their workload with minimal effort.

# Taskmaster: Run Guide

## 1. Required Setup
You must configure:
- Supabase (Database & Storage)
- Python AI server
- Frontend

## 2. Demo Login
User: demo@taskmaster.com  
Pass: password123

## 3. Supabase Setup
1. Go to your Supabase project dashboard
2. Run the database schema in SQL Editor (create tables: users, classes, tasks, resources, flashcards, events, activities, chats, messages)
3. Create Storage buckets:
   - `resources` (Public: ON)
   - `syllabi` (Public: ON, optional)
4. Set environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key (for Flask server)

## 4. Terminal 1 — Python AI Server
    cd Taskmaster-server/flask-server
    pip install --user -r requirements.txt
    python server.py

## 5. Terminal 2 — Frontend
    cd taskmaster-web-client
    npm install
    npm run dev

## 6. Summary
Setup Supabase  
Start Python AI Server  
Start Frontend  
Login with demo account
