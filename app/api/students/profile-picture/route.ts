import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const studentId = formData.get('studentId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!studentId || !imageFile) {
      const response = NextResponse.json(
        { error: 'Student ID and image are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const intern = await Intern.findOne({ studentId });

    if (!intern) {
      const response = NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Delete old profile picture if exists
    if (intern.profilePicture) {
      try {
        // Extract publicId from Cloudinary URL
        // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/publicId.jpg
        const urlMatch = intern.profilePicture.match(/\/upload\/[^/]+\/(.+)$/);
        if (urlMatch && urlMatch[1]) {
          const publicId = urlMatch[1].replace(/\.[^.]+$/, ''); // Remove extension
          await deleteImage(publicId);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const { url: imageUrl } = await uploadImage(imageBuffer, 'intern-profiles');

    // Update intern profile picture directly on the document instance
    intern.profilePicture = imageUrl;
    intern.markModified('profilePicture'); // Explicitly mark as modified
    
    try {
      await intern.save();
    } catch (saveError: any) {
      console.error('[Profile Picture] Save error:', saveError);
      console.error('[Profile Picture] Save error message:', saveError.message);
      console.error('[Profile Picture] Save error stack:', saveError.stack);
      throw saveError;
    }

    const response = NextResponse.json({
      success: true,
      profilePicture: imageUrl,
      message: 'Profile picture uploaded successfully',
    });

    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    const response = NextResponse.json(
      { error: error.message || 'Failed to upload profile picture' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}
