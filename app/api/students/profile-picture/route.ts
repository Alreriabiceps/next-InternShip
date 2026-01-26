import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { addCorsHeaders } from '@/lib/cors';
import { getAuthenticatedStudent, unauthorizedResponse, forbiddenResponse } from '@/middleware/studentAuth';

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authenticated = getAuthenticatedStudent(request);
    if (!authenticated) {
      return unauthorizedResponse(request, 'Authentication required');
    }

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

    // Verify the authenticated user is updating their own profile
    if (authenticated.studentId !== studentId) {
      return forbiddenResponse(request, 'You can only update your own profile picture');
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
        // Supports multiple URL formats:
        // 1. https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/publicId.jpg
        // 2. https://res.cloudinary.com/cloud_name/image/upload/folder/publicId.jpg (no version)
        // 3. https://res.cloudinary.com/cloud_name/image/upload/v1234567890/publicId.jpg (no folder)
        // 4. With transformations: https://res.cloudinary.com/cloud_name/image/upload/c_fill,h_100,w_100/v1234567890/folder/publicId.jpg
        
        const url = intern.profilePicture;
        
        // Method 1: Try to extract everything after /upload/ (with optional version and transformations)
        // Pattern matches: /upload/[optional_transformations/][optional_version/]path/to/publicId.extension
        const uploadMatch = url.match(/\/upload\/(?:[a-z_,0-9]+\/)?(?:v\d+\/)?(.+)$/);
        
        if (uploadMatch && uploadMatch[1]) {
          // Remove file extension
          let publicId = uploadMatch[1].replace(/\.[^.]+$/, '');
          
          // Validate that we have something
          if (publicId && publicId.length > 0) {
            console.log('[Profile Picture] Attempting to delete old image with publicId:', publicId);
            await deleteImage(publicId);
            console.log('[Profile Picture] Successfully deleted old image');
          }
        } else {
          console.warn('[Profile Picture] Could not extract publicId from URL:', url);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue even if deletion fails - the upload should still proceed
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
