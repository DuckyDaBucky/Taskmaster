import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";

//Route files
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import flashCardRoutes from "./routes/flashCardRoutes.js";
import eventRoutes from './routes/eventRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Connection failed", err));

// RTT Socket.io code
import messageModel from "./models/messages.js"
const http = createServer(app);
const io = new Server(http, {
  cors: { origin: "*" },
});

async function storeMessage(userId, friendId, text) {
  try {
    if (!userId || !friendId || !text) {
      throw new Error("Missing required parameters userId, friendId, or text");
    }

    let chat = await messageModel.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (chat) {
      chat = await messageModel.findOneAndUpdate(
        { _id: chat._id },
        { $push: { messages: { sender: userId, text } } },
        { new: true }
      );
    } else {
      chat = new messageModel({
        participants: [userId, friendId],
        messages: [{ sender: userId, text }]
      });
      await chat.save();
    }

    return chat;
  } catch (error) {
    console.error("Error in storeMessage:", error);
    throw error;
  }
}


async function getChatHistory(userId, friendId) {
  let chat = await messageModel.findOne({
    participants: { $all: [userId, friendId] }
  })

  if (!chat) {
    return [];
  }

  return (chat.messages || [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);
}

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on("history", async ({ userId, friendId }) => {
    try {
      if (!userId || !friendId) {
        console.error("Missing userId or friendId in history req");
        socket.emit("history", []);
        return;
      }

      const history = await getChatHistory(userId, friendId);
      socket.emit("history", history);
    } catch (err) {
      console.error("Error fetching history:", err);
      socket.emit("history", []);
    }
  });

  socket.on("message", async ({ userId, friendId, text }) => {
    try {
      if (!userId || !friendId || !text) {
        console.error("Missing required fields in message:", { userId, friendId, text });
        return;
      }

      const chat = await storeMessage(userId, friendId, text);
      const lastMsg = chat.messages[chat.messages.length - 1];

      io.emit("message", {
        message: lastMsg,
        senderId: userId,
        receiverId: friendId
      });
    } catch (err) {
      console.error("Error storing message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/class", classRoutes);
app.use("/task", taskRoutes);
app.use("/resources", resourceRoutes);
app.use("/flashcard", flashCardRoutes);
app.use('/event', eventRoutes);

http.listen(PORT, () => {
  console.log("RTT server running at http://localhost:3000");
});
