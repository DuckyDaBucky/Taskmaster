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

### 3.1 Database Setup
1. Go to your Supabase project dashboard: https://app.supabase.com
2. Run the database schema in SQL Editor (create tables: users, classes, tasks, resources, flashcards, events, activities, chats, messages)
3. Create Storage buckets:
   - `resources` (Public: ON)
   - `avatars` (Public: ON, for profile pictures)
   - `syllabi` (Public: ON, optional)

### 3.2 Environment Variables

**For Frontend (taskmaster-web-client):**

1. Copy `.env.example` to `.env` in the `taskmaster-web-client` directory:
   ```bash
   cd taskmaster-web-client
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
   - Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy the **anon/public** key from "Project API keys"

3. Update `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_ML_SERVICE_URL=http://localhost:6005
   ```

**For Flask Server (Taskmaster-server/flask-server):**

1. Create a `.env` file in `Taskmaster-server/flask-server/` directory
2. Get your Supabase **service_role** key (NOT the anon key):
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
   - Copy the **service_role** key (keep this secret!)
3. Update `.env` file:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

**Important:** 
- The **anon key** is safe to expose in client-side code
- The **service_role key** should NEVER be exposed in client-side code
- Never commit `.env` files to git (they're already in `.gitignore`)

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
