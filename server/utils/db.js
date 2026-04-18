import mongoose from "mongoose";

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
