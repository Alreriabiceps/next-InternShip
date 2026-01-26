import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Admin token generation (existing)
export function generateToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username, type: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Admin token verification (existing)
export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; type?: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Student/Intern token generation
export function generateStudentToken(internId: string, studentId: string): string {
  return jwt.sign(
    { internId, studentId, type: 'student' },
    JWT_SECRET,
    { expiresIn: '30d' } // Longer expiry for mobile app
  );
}

// Student/Intern token verification
export function verifyStudentToken(token: string): { internId: string; studentId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { internId: string; studentId: string; type?: string };
    if (decoded.type !== 'student') {
      return null;
    }
    return { internId: decoded.internId, studentId: decoded.studentId };
  } catch (error) {
    return null;
  }
}




