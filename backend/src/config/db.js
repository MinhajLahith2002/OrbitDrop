import mongoose from "mongoose";
import dns from "dns";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/orbitdrop";
  
  // Resolve SRV records reliably on Windows across ISPs
  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      // Ignore if environment restricts DNS server override
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`☁️ [MongoDB Atlas] Connected to database: "${conn.connection.name}" @ host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.warn(`[MongoDB] Running in offline fallback mode without persistent storage.`);
    return null;
  }
}
