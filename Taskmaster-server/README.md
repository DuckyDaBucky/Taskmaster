# Taskmaster Setup Guide

## 3-Terminal Setup

To run the full application, you need 3 separate terminals:

### Terminal 1: Node.js Backend
```bash
cd taskmaster-server
npm install
npm start
```
*Runs on port 5000*

### Terminal 2: Python AI Service
```bash
cd taskmaster-server/flask-server
pip install -r requirements.txt
python server.py
```
*Runs on port 6005*

### Terminal 3: React Frontend
```bash
cd taskmaster-web-client
npm install
npm run dev
```
*Runs on port 5173*

## Demo Login
- **Email:** `demo@taskmaster.com`
- **Password:** `password123`

## Environment Variables
Ensure `.env` is present in `taskmaster-server/` with:
- `DB_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `PYTHON_SERVICE_URL=http://localhost:6005`