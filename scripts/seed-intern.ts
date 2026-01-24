import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedIntern() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);

    // Define Intern Schema
    const internSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      studentId: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      company: { type: String, required: true },
      companyAddress: { type: String, required: true },
      mustChangePassword: { type: Boolean, default: true },
    });

    const Intern = mongoose.models.Intern || mongoose.model('Intern', internSchema);

    // Create a default intern
    const studentId = 'INT001';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Delete existing if any
    await Intern.deleteMany({ studentId });

    const intern = await Intern.create({
      name: 'Default Intern',
      email: 'intern@example.com',
      studentId: studentId,
      password: hashedPassword,
      company: 'Tech Corp',
      companyAddress: '123 Innovation Way',
      mustChangePassword: false,
    });


    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedIntern();
