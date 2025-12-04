import mongoose from "mongoose";
import User from "../Taskmaster-server/express-server/models/userModel.js";
import Class from "../Taskmaster-server/express-server/models/classModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  await mongoose.connect(process.env.DB_URL);
};

export default async function handler(req, res) {
  // Set CORS headers - allow your frontend domain
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000"
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { userName, firstName, lastName, email, password } = req.body;

    if (!userName || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 9 || password.length > 20) {
      return res.status(400).json({ message: "Password must be between 9 and 20 characters" });
    }

    if (userName.length < 9 || userName.length > 20) {
      return res.status(400).json({ message: "Username must be between 9 and 20 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { userName }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      userName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      streak: 0,
      points: 0,
      level: 1,
    });

    await newUser.save();

    // Create default "Personal" class for the user
    const personalClass = new Class({
      name: "Personal",
      professor: "",
      timing: "",
      location: "",
      topics: [],
      textbooks: [],
      gradingPolicy: "",
      contactInfo: "",
      user: newUser._id,
      isPersonal: true,
    });
    await personalClass.save();

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || "secretstring1234";
    const token = jwt.sign({ _id: newUser._id }, jwtSecret);

    return res.status(201).send(token);
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: error.message });
  }
}

