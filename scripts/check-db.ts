import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkInterns() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const Intern = mongoose.model('Intern', new mongoose.Schema({
      name: String,
      email: String,
      studentId: String,
    }));

    const interns = await Intern.find({});
    interns.forEach(i => {
      // Output intern info
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInterns();
