# Environment Variables Cleanup Guide

## Current Status

### ✅ Flask Server (Taskmaster-server/flask-server)
- **Status**: Fully migrated to Supabase
- **Can Remove**:
  - ❌ `DB_URL` - Not used (mongo.py exists but isn't imported)
  - ❌ `JWT_SECRET` - Not used (uses Supabase JWT tokens)
- **Still Needs**:
  - ✅ `SUPABASE_URL`
  - ✅ `SUPABASE_SERVICE_KEY`

### ⚠️ Express Server (Taskmaster-server/express-server)
- **Status**: Still uses MongoDB and JWT tokens
- **Still Needs**:
  - ✅ `DB_URL` - Used for MongoDB connection (line 54 in server.js)
  - ✅ `JWT_SECRET` - Used for generating/verifying JWT tokens (auth.js, userModel.js)
- **Note**: Frontend doesn't use Express server anymore - it's legacy code

## Recommendation

### If Express Server is NOT Running/Used:
You can safely remove from `.env`:
- `DB_URL` (MongoDB connection string)
- `JWT_SECRET` (JWT token secret)

### If Express Server IS Still Running:
Keep both variables, as Express server still needs them for:
- MongoDB connection (all models: User, Task, Class, Resource, FlashCard, Event, Activity, Chat)
- JWT token generation/verification

## How to Check

1. Check if Express server is running:
   ```bash
   # Check if port 3000 is in use
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                  # Mac/Linux
   ```

2. Check if frontend connects to Express:
   - Search frontend code for `localhost:3000` or Express API calls
   - ✅ Frontend uses Supabase directly - no Express calls found

3. Check README:
   - README only mentions Flask server + Frontend
   - Express server not mentioned in setup instructions

## Safe to Remove

Based on code analysis:
- **Flask server**: Uses Supabase only ✅
- **Frontend**: Uses Supabase only ✅
- **Express server**: Legacy, not used by frontend ⚠️

**You can remove `DB_URL` and `JWT_SECRET` if Express server is not running.**

## Cleanup Steps

1. Stop Express server if it's running
2. Remove from `.env`:
   ```env
   # Remove these if Express server not used:
   # DB_URL=mongodb://...
   # JWT_SECRET=...
   ```
3. Keep these for Flask server:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

