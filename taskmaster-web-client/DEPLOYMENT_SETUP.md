# Serverless Auth Deployment Setup

## ✅ What's Been Done

1. **Serverless functions created** in `taskmaster-web-client/api/`:
   - `auth.js` - Handles user login with streak tracking
   - `signup.js` - Handles user registration

2. **Vercel configuration** (`vercel.json`):
   - Configured to serve `/api/*` endpoints as serverless functions
   - Build command and output directory set

3. **Frontend API configuration updated**:
   - `apiConfig.ts` - Uses `/api` as base URL (relative path)
   - `authService.ts` - Updated to use `/api/auth` and `/api/signup`
   - `client.ts` - Updated interceptors for new endpoints

4. **Dependencies added** to `package.json`:
   - `mongoose: ^8.14.2`
   - `bcrypt: ^5.1.1`
   - `jsonwebtoken: ^9.0.2`

## 📋 Next Steps for Deployment

### Step 1: Install Dependencies
```bash
cd taskmaster-web-client
npm install
```

### Step 2: Set Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **Production** (and Preview/Development if needed):

| Variable | Value |
|----------|-------|
| `DB_URL` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret (same as backend) |

⚠️ **Important**: After adding env vars, click **"Redeploy Project"** so they take effect.

### Step 3: Commit and Push

```bash
git add .
git commit -m "Add serverless auth endpoints to frontend"
git push
```

Vercel will automatically redeploy.

### Step 4: Test the Endpoints

After deployment, test:

**Signup:**
```bash
POST https://YOUR_FRONTEND_URL.vercel.app/api/signup
Content-Type: application/json

{
  "userName": "testuser123",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Login:**
```bash
POST https://YOUR_FRONTEND_URL.vercel.app/api/auth
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

## 📁 File Structure

```
taskmaster-web-client/
├── api/
│   ├── auth.js          # Login endpoint
│   └── signup.js        # Signup endpoint
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies (mongoose, bcrypt, jwt)
└── src/
    └── services/
        ├── apiConfig.ts  # API base URL: "/api"
        └── api/
            ├── authService.ts  # Updated to use /api/auth and /api/signup
            └── client.ts       # Updated interceptors
```

## 🔧 How It Works

1. **Vercel automatically detects** the `/api` folder and treats `.js` files as serverless functions
2. **Routes are created automatically**:
   - `/api/auth` → `api/auth.js`
   - `/api/signup` → `api/signup.js`
3. **Functions connect to MongoDB** using `DB_URL` env variable
4. **JWT tokens** are generated using `JWT_SECRET` env variable
5. **Frontend calls** use relative paths (`/api/auth`, `/api/signup`) so they work on the same domain

## ⚠️ Important Notes

- The serverless functions import models from `../../Taskmaster-server/express-server/models/`
- Make sure your **MongoDB network access** allows connections from Vercel IPs (or use `0.0.0.0/0` for testing)
- The functions use the same MongoDB models as your Express server, ensuring consistency
- All authentication logic (streak tracking, activity logging) is preserved

## 🐛 Troubleshooting

**If endpoints return 404:**
- Check that `api/` folder is in the root of `taskmaster-web-client/`
- Verify `vercel.json` is in `taskmaster-web-client/`
- Check Vercel build logs for errors

**If MongoDB connection fails:**
- Verify `DB_URL` is set correctly in Vercel
- Check MongoDB network access settings
- Check Vercel function logs for connection errors

**If authentication fails:**
- Verify `JWT_SECRET` matches your backend
- Check that user models are accessible (path: `../../Taskmaster-server/express-server/models/`)

