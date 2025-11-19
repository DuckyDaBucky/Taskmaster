# Setup Required for Signup/Login to Work

## Critical: Environment Variables

You need to create a `.env` file in the `Taskmaster-server` directory with the following:

```env
DB_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
```

**Example:**
```env
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/taskmaster?retryWrites=true&w=majority
JWT_SECRET=secretstring1234
```

## What Was Fixed

### 1. ✅ Login Now Accepts Username OR Email
- Frontend login form accepts either email or username
- Backend checks both email and username fields
- You can login with:
  - `demo@taskmaster.com` OR `demo_user`
  - `dummy@taskmaster.com` OR `dummy_user`

### 2. ✅ JWT Secret Consistency
- Fixed mismatch between `userModel.js` (uses `process.env.JWT_SECRET`) and `auth.js` middleware
- Both now use the same JWT_SECRET from environment
- Added fallback to `"secretstring1234"` if JWT_SECRET not set

### 3. ✅ Signup Flow
- Signup should work correctly now
- Console logging added for debugging
- Proper error handling

### 4. ✅ No Email Verification
- Confirmed: No email verification stubs exist
- Users can signup and login immediately

## To Test Signup

1. **Ensure MongoDB is running and connected**
2. **Create `.env` file** in `Taskmaster-server/` directory:
   ```
   DB_URL=your_mongodb_url
   JWT_SECRET=secretstring1234
   ```
3. **Start the backend server:**
   ```bash
   cd Taskmaster-server
   npm start
   ```
4. **Try signing up** with a new account
5. **Check backend console** for signup logs

## To Test Login

You can now login with:
- **Email:** `demo@taskmaster.com` OR **Username:** `demo_user`
- **Password:** `password123`

OR

- **Email:** `dummy@taskmaster.com` OR **Username:** `dummy_user`  
- **Password:** `passwordpassword`

## Troubleshooting

### If signup still doesn't work:

1. **Check MongoDB connection:**
   - Look for "Connected to MongoDB" in backend console
   - If you see "MongoDB Connection failed", fix your DB_URL

2. **Check backend console logs:**
   - You should see: "Signup request received: ..."
   - Then: "Saving user to MongoDB..."
   - Then: "User saved successfully: ..."

3. **Check for duplicate username/email:**
   - Backend will return 400 if username or email already exists

4. **Check JWT_SECRET:**
   - If not set, it will use fallback `"secretstring1234"`
   - But it's better to set it in `.env`

