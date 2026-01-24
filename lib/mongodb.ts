import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined!');
  throw new Error('Please define the MONGODB_URI environment variable');
}

// TypeScript assertion: we've checked above that MONGODB_URI exists
const MONGODB_URI_STRING: string = MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI_STRING, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      cached.promise = null;
      console.error('❌ MongoDB connection error:', error);
      console.error('Connection string:', MONGODB_URI_STRING.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;








