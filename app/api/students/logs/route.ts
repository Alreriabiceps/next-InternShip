import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyLog from '@/models/DailyLog';
import Intern from '@/models/Intern';
import { uploadImage } from '@/lib/cloudinary';
import { addCorsHeaders } from '@/lib/cors';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const internId = formData.get('internId') as string;
    const date = formData.get('date') as string;
    const period = formData.get('period') as 'AM' | 'PM';
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const address = formData.get('address') as string | null;
    const imageFile = formData.get('image') as File | null;
    
    // Existing optional fields
    const notes = formData.get('notes') as string | null;
    const hoursWorkedStr = formData.get('hoursWorked') as string | null;
    const activityType = formData.get('activityType') as 'Work' | 'Break' | 'Meeting' | 'Training' | 'Other' | null;
    
    // Location enhancements
    const altitudeStr = formData.get('altitude') as string | null;
    const locationAccuracyStr = formData.get('locationAccuracy') as string | null;
    const headingStr = formData.get('heading') as string | null;
    const speedStr = formData.get('speed') as string | null;
    
    // Device and environment
    const deviceModel = formData.get('deviceModel') as string | null;
    const osVersion = formData.get('osVersion') as string | null;
    const appVersion = formData.get('appVersion') as string | null;
    const networkType = formData.get('networkType') as 'WIFI' | 'CELLULAR' | 'UNKNOWN' | null;
    const batteryLevelStr = formData.get('batteryLevel') as string | null;
    const timezone = formData.get('timezone') as string | null;
    
    // Image metadata
    const imageWidthStr = formData.get('imageWidth') as string | null;
    const imageHeightStr = formData.get('imageHeight') as string | null;
    const imageFileSizeStr = formData.get('imageFileSize') as string | null;
    const imageExifStr = formData.get('imageExif') as string | null;
    
    // Weather data
    const weatherTemperatureStr = formData.get('weatherTemperature') as string | null;
    const weatherConditions = formData.get('weatherConditions') as string | null;
    
    // New metrics
    const sessionDurationStr = formData.get('sessionDuration') as string | null;
    const timeSinceLastLogStr = formData.get('timeSinceLastLog') as string | null;
    const deviceOrientation = formData.get('deviceOrientation') as 'portrait' | 'landscape' | null;
    const wifiSSID = formData.get('wifiSSID') as string | null;
    const signalStrengthStr = formData.get('signalStrength') as string | null;
    const networkSpeedStr = formData.get('networkSpeed') as string | null;
    const screenBrightnessStr = formData.get('screenBrightness') as string | null;
    const availableStorageStr = formData.get('availableStorage') as string | null;
    const captureTimeStr = formData.get('captureTime') as string | null;
    const retakeCountStr = formData.get('retakeCount') as string | null;
    
    // Get IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    if (!internId || !date || !period || !imageFile || isNaN(latitude) || isNaN(longitude)) {
      const response = NextResponse.json(
        { error: 'Missing required fields: internId, date, period, image, latitude, longitude' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Verify intern exists
    const intern = await Intern.findById(internId);
    if (!intern) {
      const response = NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    // Find or create daily log for this date (before upload)
    let dailyLog = await DailyLog.findOne({ internId, date: logDate });
    if (!dailyLog) {
      dailyLog = new DailyLog({ internId, date: logDate });
    }

    // Enforce 1 Time In and 1 Time Out per day — reject duplicates
    if (period === 'AM' && dailyLog.amLog) {
      const response = NextResponse.json(
        { error: "You've already logged Time In for this day." },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }
    if (period === 'PM' && dailyLog.pmLog) {
      const response = NextResponse.json(
        { error: "You've already logged Time Out for this day." },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Upload image to Cloudinary
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const { url: imageUrl, publicId: cloudinaryId } = await uploadImage(imageBuffer);

    // Build location object with enhancements
    const locationData: any = {
      latitude,
      longitude,
    };
    if (address) {
      locationData.address = address;
    }
    if (altitudeStr) {
      const altitude = parseFloat(altitudeStr);
      if (!isNaN(altitude)) {
        locationData.altitude = altitude;
      }
    }
    if (locationAccuracyStr) {
      const accuracy = parseFloat(locationAccuracyStr);
      if (!isNaN(accuracy) && accuracy >= 0) {
        locationData.accuracy = accuracy;
      }
    }
    if (headingStr) {
      const heading = parseFloat(headingStr);
      if (!isNaN(heading) && heading >= 0 && heading <= 360) {
        locationData.heading = heading;
      }
    }
    if (speedStr) {
      const speed = parseFloat(speedStr);
      if (!isNaN(speed) && speed >= 0) {
        locationData.speed = speed;
      }
    }

    const imageLog: any = {
      imageUrl,
      cloudinaryId,
      location: locationData,
      timestamp: new Date(), // AM timestamp = check-in, PM timestamp = check-out
      period,
    };

    // Add existing optional fields if provided
    if (notes && notes.trim()) {
      imageLog.notes = notes.trim();
    }
    if (hoursWorkedStr) {
      const hours = parseFloat(hoursWorkedStr);
      if (!isNaN(hours) && hours >= 0 && hours <= 24) {
        imageLog.hoursWorked = hours;
      }
    }
    if (activityType) {
      imageLog.activityType = activityType;
    }

    // Add device and environment data
    if (deviceModel || osVersion || appVersion) {
      imageLog.deviceInfo = {};
      if (deviceModel) {
        imageLog.deviceInfo.model = deviceModel;
      }
      if (osVersion) {
        imageLog.deviceInfo.osVersion = osVersion;
      }
      if (appVersion) {
        imageLog.deviceInfo.appVersion = appVersion;
      }
    }
    if (networkType && ['WIFI', 'CELLULAR', 'UNKNOWN'].includes(networkType)) {
      imageLog.networkType = networkType;
    }
    if (batteryLevelStr) {
      const batteryLevel = parseFloat(batteryLevelStr);
      if (!isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) {
        imageLog.batteryLevel = batteryLevel;
      }
    }
    if (timezone) {
      imageLog.timezone = timezone;
    }
    if (ipAddress) {
      imageLog.ipAddress = ipAddress;
    }

    // Add image metadata
    if (imageWidthStr || imageHeightStr) {
      imageLog.imageDimensions = {};
      if (imageWidthStr) {
        const width = parseFloat(imageWidthStr);
        if (!isNaN(width) && width >= 0) {
          imageLog.imageDimensions.width = width;
        }
      }
      if (imageHeightStr) {
        const height = parseFloat(imageHeightStr);
        if (!isNaN(height) && height >= 0) {
          imageLog.imageDimensions.height = height;
        }
      }
    }
    if (imageFileSizeStr) {
      const fileSize = parseFloat(imageFileSizeStr);
      if (!isNaN(fileSize) && fileSize >= 0) {
        imageLog.imageFileSize = fileSize;
      }
    }
    if (imageExifStr) {
      try {
        imageLog.imageExif = JSON.parse(imageExifStr);
      } catch (error) {
        console.warn('Failed to parse image EXIF data:', error);
      }
    }

    // Add weather data
    if (weatherTemperatureStr || weatherConditions) {
      imageLog.weatherData = {};
      if (weatherTemperatureStr) {
        const temperature = parseFloat(weatherTemperatureStr);
        if (!isNaN(temperature)) {
          imageLog.weatherData.temperature = temperature;
        }
      }
      if (weatherConditions) {
        imageLog.weatherData.conditions = weatherConditions;
      }
    }

    // Add new metrics
    if (sessionDurationStr) {
      const sessionDuration = parseFloat(sessionDurationStr);
      if (!isNaN(sessionDuration) && sessionDuration >= 0) {
        imageLog.sessionDuration = sessionDuration;
      }
    }
    if (timeSinceLastLogStr) {
      const timeSinceLastLog = parseFloat(timeSinceLastLogStr);
      if (!isNaN(timeSinceLastLog) && timeSinceLastLog >= 0) {
        imageLog.timeSinceLastLog = timeSinceLastLog;
      }
    }
    if (deviceOrientation && ['portrait', 'landscape'].includes(deviceOrientation)) {
      imageLog.deviceOrientation = deviceOrientation;
    }
    if (wifiSSID) {
      imageLog.wifiSSID = wifiSSID;
    }
    if (signalStrengthStr) {
      const signalStrength = parseFloat(signalStrengthStr);
      if (!isNaN(signalStrength)) {
        imageLog.signalStrength = signalStrength;
      }
    }
    if (networkSpeedStr) {
      const networkSpeed = parseFloat(networkSpeedStr);
      if (!isNaN(networkSpeed) && networkSpeed >= 0) {
        imageLog.networkSpeed = networkSpeed;
      }
    }
    if (screenBrightnessStr) {
      const screenBrightness = parseFloat(screenBrightnessStr);
      if (!isNaN(screenBrightness) && screenBrightness >= 0 && screenBrightness <= 100) {
        imageLog.screenBrightness = screenBrightness;
      }
    }
    if (availableStorageStr) {
      const availableStorage = parseFloat(availableStorageStr);
      if (!isNaN(availableStorage) && availableStorage >= 0) {
        imageLog.availableStorage = availableStorage;
      }
    }
    if (captureTimeStr) {
      const captureTime = parseFloat(captureTimeStr);
      if (!isNaN(captureTime) && captureTime >= 0) {
        imageLog.captureTime = captureTime;
      }
    }
    if (retakeCountStr) {
      const retakeCount = parseFloat(retakeCountStr);
      if (!isNaN(retakeCount) && retakeCount >= 0) {
        imageLog.retakeCount = retakeCount;
      }
    }

    // Update AM or PM log (duplicate already rejected above)
    if (period === 'AM') {
      dailyLog.amLog = imageLog;
    } else {
      dailyLog.pmLog = imageLog;
    }

    await dailyLog.save();

    const response = NextResponse.json({
      success: true,
      log: {
        id: dailyLog._id,
        date: dailyLog.date,
        amLog: dailyLog.amLog,
        pmLog: dailyLog.pmLog,
      },
    });
    
    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error: any) {
    console.error('Create log error:', error);
    
    if (error.code === 11000) {
      const response = NextResponse.json(
        { error: 'Log already exists for this date' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}

// Get student's own logs
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const internId = searchParams.get('internId');

    if (!internId) {
      const response = NextResponse.json(
        { error: 'internId is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const logs = await DailyLog.find({ internId })
      .sort({ date: -1 })
      .limit(100);

    const response = NextResponse.json({ logs });
    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error) {
    console.error('Get logs error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}

