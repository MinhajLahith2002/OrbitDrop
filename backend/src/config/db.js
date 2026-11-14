import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/orbitdrop";
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}:${conn.connection.port}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.warn(`[MongoDB] Running in offline fallback mode without persistent storage.`);
    return null;
  }
}
