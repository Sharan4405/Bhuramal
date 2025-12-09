import mongoose from "mongoose";

const DB_NAME = "chatbot"; // Database name

export async function connectDB() {
  try {
    // Use MONGODB_URI from .env (matches the variable name in .env file)
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      dbName: DB_NAME, // Explicitly set database name
    });

    console.log(`✅ MongoDB connected to database: ${DB_NAME}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Make sure MONGODB_URI is properly configured in .env");
    process.exit(1);
  }
}
