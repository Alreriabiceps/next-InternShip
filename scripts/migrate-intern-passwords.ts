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
(async () => {
  const { default: connectDB } = await import('../lib/mongodb');
  const { default: Intern } = await import('../models/Intern');
  const { hashPassword } = await import('../lib/auth');

  async function migrateInternPasswords() {
    try {
      await connectDB();

      // Find all interns without passwords
      const internsWithoutPassword = await Intern.find({
        $or: [
          { password: { $exists: false } },
          { password: null },
          { password: '' },
        ],
      });

      if (internsWithoutPassword.length === 0) {
        console.log('✓ All interns already have passwords set');
        process.exit(0);
      }

      console.log(`Found ${internsWithoutPassword.length} intern(s) without passwords`);
      console.log('Setting default password "qwerty" for all interns without passwords...\n');

      const defaultPassword = 'qwerty';
      const hashedPassword = await hashPassword(defaultPassword);

      let updated = 0;
      for (const intern of internsWithoutPassword) {
        intern.password = hashedPassword;
        intern.mustChangePassword = true; // Force password change on first login
        await intern.save();
        updated++;
        console.log(`✓ Updated password for: ${intern.name} (${intern.studentId})`);
      }

      console.log(`\n✓ Successfully updated ${updated} intern(s)`);
      console.log(`\nDefault password: ${defaultPassword}`);
      console.log('⚠️  All interns must change their password on first login!');
      process.exit(0);
    } catch (error) {
      console.error('Error migrating intern passwords:', error);
      process.exit(1);
    }
  }

  await migrateInternPasswords();
})();



