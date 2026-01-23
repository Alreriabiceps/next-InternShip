import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, admin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(admin._id.toString(), admin.username);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    // On Vercel, always use secure cookies (HTTPS)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      // Don't set domain - let it default to the current domain (works on Vercel)
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Internal server error';
    
    if (error.message?.includes('MONGODB_URI')) {
      errorMessage = 'Database configuration error';
    } else if (error.message?.includes('JWT_SECRET')) {
      errorMessage = 'Authentication configuration error';
    } else if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      errorMessage = 'Database connection error';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        // Only include details in development
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}




