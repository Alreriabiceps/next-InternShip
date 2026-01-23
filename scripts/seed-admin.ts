import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST, before any other imports
// Try multiple possible locations
const possiblePaths = [
  resolve(process.cwd(), '.env.local'),           // If run from admin-web directory
  resolve(process.cwd(), 'admin-web/.env.local'), // If run from project root
];

let loaded = false;
for (const envPath of possiblePaths) {
  const result = config({ path: envPath });
  if (!result.error) {
    loaded = true;
    console.log(`✓ Loaded environment variables from: ${envPath}`);
    break;
  }
}

if (!loaded) {
  console.error('✗ Error: Could not find .env.local file');
  console.error('Tried paths:', possiblePaths);
  console.error('Current working directory:', process.cwd());
  process.exit(1);
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('✗ Error: MONGODB_URI not found in environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Use dynamic imports AFTER loading environment variables
// This ensures env vars are loaded before mongodb.ts tries to read them
(async () => {
  const { default: connectDB } = await import('../lib/mongodb');
  const { default: Admin } = await import('../models/Admin');
  const { hashPassword } = await import('../lib/auth');

  async function seedAdmin() {
    try {
      await connectDB();

      const username = process.argv[2] || 'admin';
      const password = process.argv[3] || 'admin123';
      const name = process.argv[4] || 'Admin User';

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        console.log('Admin already exists with this username');
        process.exit(0);
      }

      const hashedPassword = await hashPassword(password);

      const admin = new Admin({
        username,
        password: hashedPassword,
        name,
      });

      await admin.save();

      console.log('Admin created successfully!');
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log('\n⚠️  Please change the default password after first login!');
      process.exit(0);
    } catch (error) {
      console.error('Error seeding admin:', error);
      process.exit(1);
    }
  }

  await seedAdmin();
})();


