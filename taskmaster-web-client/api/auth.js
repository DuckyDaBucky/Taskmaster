import mongoose from "mongoose";
import User from "./models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Activity from "./models/activityModel.js";
import { connectDB } from "./lib/db.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-auth-token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

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
    
    const previousStreak = user.streak || 0;
    let newStreak = previousStreak;
    let loginDates = user.loginDates || [];
    let shouldCreateLoginActivity = false;
    let streakChange = 0;
    
    const todayStr = todayUTC.toISOString().split('T')[0];
    const lastLoginStr = lastLoginUTC ? lastLoginUTC.toISOString().split('T')[0] : null;
    const alreadyLoggedInToday = lastLoginStr === todayStr;
    
    if (!lastLoginUTC) {
      newStreak = 1;
      streakChange = 1;
      shouldCreateLoginActivity = true;
    } else if (daysDiff === 1) {
      newStreak = previousStreak + 1;
      streakChange = 1;
      shouldCreateLoginActivity = true;
    } else if (daysDiff === 0) {
      shouldCreateLoginActivity = false;
    } else {
      const wasStreakBroken = previousStreak > 0;
      newStreak = 1;
      streakChange = wasStreakBroken ? -previousStreak : 1;
      shouldCreateLoginActivity = true;
    }
    
    if (!alreadyLoggedInToday) {
      loginDates.push(todayUTC);
      if (loginDates.length > 365) {
        loginDates = loginDates.slice(-365);
      }
    }
    
    user.streak = newStreak;
    user.lastLoginDate = todayUTC;
    user.loginDates = loginDates;
    await user.save();

    if (shouldCreateLoginActivity) {
      try {
        const todayStart = new Date(todayUTC);
        const todayEnd = new Date(todayUTC);
        todayEnd.setUTCHours(23, 59, 59, 999);
        
        const existingLoginToday = await Activity.findOne({
          user: user._id,
          type: 'login',
          createdAt: { $gte: todayStart, $lte: todayEnd }
        });
        
        if (!existingLoginToday) {
          await Activity.create({
            user: user._id,
            type: 'login',
            description: `Logged in`,
            metadata: { streak: newStreak, streakChange }
          });
        }
        
        if (streakChange < 0) {
          await Activity.create({
            user: user._id,
            type: 'streak_achieved',
            description: `Streak lost`,
            metadata: { 
              streak: newStreak, 
              previousStreak,
              streakChange 
            }
          });
        }
      } catch (error) {
        console.error("Error logging activity:", error);
      }
    }

    const jwtSecret = process.env.JWT_SECRET || "secretstring1234";
    const token = jwt.sign({ _id: user._id }, jwtSecret);
    
    return res.status(200).send(token);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message });
  }
}

