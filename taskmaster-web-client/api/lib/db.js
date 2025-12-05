import mongoose from "mongoose";

/**
 * Connect to MongoDB
 * Reuses existing connection if already connected
 */
export const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  if (!process.env.DB_URL) {
    throw new Error("DB_URL environment variable is not set");
  }
  
  await mongoose.connect(process.env.DB_URL);
};

