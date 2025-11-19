# **Taskmaster – Developer Setup Guide**

This monorepo contains all Taskmaster components:

- **Frontend** → `taskmaster-web-client`
- **Node.js API** → `Taskmaster-server/express-server`
- **Python AI Server** → `Taskmaster-server/flask-server`
- **Shared `.env` file** in project root

---

## **📁 Folder Structure**

Taskmaster/
│── taskmaster-web-client/
│── Taskmaster-server/
│ ├── express-server/
│ ├── flask-server/
│ └── seed.js
│── .env


---

## **📝 Environment Variables**

Place a **single `.env` file at the root of Taskmaster/**

DB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_key_here
PORT=3000
FLASK_PORT=6005


Make sure both the Node API and Flask server read from this `.env`.

---

## **▶️ Install & Run Everything**

### **1. Frontend (Vite + React)**

cd taskmaster-web-client
npm install
npm run dev


Runs at → **http://localhost:5173**

---

### **2. Node.js API (Express Server)**

cd Taskmaster-server/express-server
npm install
npm start


Runs at → **http://localhost:3000**

---

### **3. Python AI Server (Flask)**

cd Taskmaster-server/flask-server
pip install --user -r requirements.txt
pip install --user flask-restful
python server.py


Runs at → **http://localhost:6005**

---

## **🧪 Seed the Database**

A simple seed script is included to generate test users & data.

cd Taskmaster-server
node seed.js


---

## **✔️ Local Development URLs**

| Service      | URL |
|--------------|--------------------------|
| Frontend     | http://localhost:5173    |
| Node API     | http://localhost:3000    |
| AI Server    | http://localhost:6005    |

---

## **🔥 Notes**

- The **folder `Taskmaster-server` was renamed** from `Taskmaster-server` → `taskmaster-server` recommended for consistency.  
- Both backend servers rely on the shared `.env` at project root.  
- Removed hardcoded secrets from code; uses `process.env`.  
- `seed.js` populates dummy login accounts so the app actually works on first boot.

---

Let me know if you want:
✅ A shorter README  
✅ A production/deployment README  
✅ A Docker Compose version  
