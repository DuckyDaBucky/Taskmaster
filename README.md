**This project is a part of AIS Innovation Labs**

Taskmaster is an AI driven academic productivity system that transforms unstructured course materials into organized tasks, schedules, and action plans. Using Gemini powered RAG extraction, Taskmaster reads syllabi, assignments, emails, and calendar data, then automatically generates deadlines, reminders, and workflow structures tailored to the user. The platform reduces manual planning, streamlines academic organization, and acts as an intelligent assistant that helps students stay ahead of their workload with minimal effort.

# Taskmaster: Run Guide

## 1. Required Terminals
You must run:
- Node backend
- Python AI server
- Frontend

## 2. Demo Login
User: demo@taskmaster.com  
Pass: password123

## 3. Terminal 1 — Node Backend
    cd taskmaster-server
    npm install
    npm start

## 4. Terminal 2 — Python AI Server
    cd taskmaster-server/flask-server
    pip install --user -r requirements.txt
    python server.py

## 5. Terminal 3 — Frontend
    cd taskmaster-web-client
    npm install
    npm run dev

## 6. Summary
Start Node  
Start Python  
Start Frontend  
Login with demo account
