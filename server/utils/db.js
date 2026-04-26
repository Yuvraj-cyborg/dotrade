import mongoose from "mongoose";

import dns from 'dns';
dns.setServers(['8.8.8.8'])

async function connectDB() {
  const uri = process.env.DB_URL;
  if (!uri) throw new Error("DB_URL is not set");

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

export default connectDB;
