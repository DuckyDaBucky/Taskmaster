import User from "../models/userModel.js";
import bcrypt from "bcrypt";

//Use for login portal - accepts username OR email
const authUser = async (req, res) => {
  try {
    const { email, userName, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Try to find user by email OR username
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (userName) {
      user = await User.findOne({ userName });
    } else {
      return res.status(400).json({ message: "Email or username is required" });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or username" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Update login streak and track login date
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    todayUTC.setUTCHours(0, 0, 0, 0);
    
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    let lastLoginUTC = null;
    if (lastLogin) {
      lastLoginUTC = new Date(Date.UTC(lastLogin.getUTCFullYear(), lastLogin.getUTCMonth(), lastLogin.getUTCDate()));
      lastLoginUTC.setUTCHours(0, 0, 0, 0);
    }
    
    const daysDiff = lastLoginUTC ? Math.floor((todayUTC.getTime() - lastLoginUTC.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    let newStreak = user.streak || 0;
    let loginDates = user.loginDates || [];
    
    // If never logged in before, start streak at 1
    if (!lastLoginUTC) {
      newStreak = 1;
    }
    // If last login was yesterday, increment streak
    else if (daysDiff === 1) {
      newStreak += 1;
    } 
    // If last login was today, keep streak the same (already logged in today)
    else if (daysDiff === 0) {
      // Already logged in today, don't change streak
    }
    // If last login was more than 1 day ago, reset to 1
    else {
      newStreak = 1;
    }
    
    // Add today's date if not already present
    const todayStr = todayUTC.toISOString().split('T')[0];
    const lastLoginStr = lastLoginUTC ? lastLoginUTC.toISOString().split('T')[0] : null;
    
    if (lastLoginStr !== todayStr) {
      loginDates.push(todayUTC);
      // Keep only last 365 days
      if (loginDates.length > 365) {
        loginDates = loginDates.slice(-365);
      }
    }
    
    // Update user
    user.streak = newStreak;
    user.lastLoginDate = todayUTC;
    user.loginDates = loginDates;
    await user.save();
    
    console.log(`Login streak updated: ${newStreak} days (daysDiff: ${daysDiff}, lastLogin: ${lastLoginStr}, today: ${todayStr})`);

    // Log login activity
    try {
      const Activity = (await import('../models/activityModel.js')).default;
      await Activity.create({
        user: user._id,
        type: 'login',
        description: `Logged in`,
        metadata: { streak: newStreak }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    const token = user.generateAuthToken();
    res.send(token);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

export default authUser;
