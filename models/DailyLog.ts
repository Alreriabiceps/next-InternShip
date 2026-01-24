import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  altitude?: number; // Elevation from GPS
  accuracy?: number; // GPS accuracy in meters
  heading?: number; // Device compass direction
  speed?: number; // Device speed when photo was taken
}

export interface IImageLog {
  imageUrl: string;
  cloudinaryId: string;
  location: ILocation;
  timestamp: Date; // AM timestamp = check-in time, PM timestamp = check-out time
  period: 'AM' | 'PM';
  notes?: string;
  hoursWorked?: number;
  activityType?: 'Work' | 'Break' | 'Meeting' | 'Training' | 'Other';
  deviceInfo?: {
    model: string;
    osVersion: string;
    appVersion: string;
  };
  networkType?: 'WIFI' | 'CELLULAR' | 'UNKNOWN';
  batteryLevel?: number; // Battery percentage (0-100)
  timezone?: string; // Timezone when log was created
  ipAddress?: string; // IP address for security/verification
  imageDimensions?: {
    width: number;
    height: number;
  };
  imageFileSize?: number; // File size in bytes
  imageExif?: Record<string, any>; // EXIF metadata
  weatherData?: {
    temperature?: number;
    conditions?: string;
  };
  // New metrics
  sessionDuration?: number; // Time in app before submission (seconds)
  timeSinceLastLog?: number; // Time since last log entry (seconds)
  deviceOrientation?: 'portrait' | 'landscape';
  wifiSSID?: string;
  signalStrength?: number;
  networkSpeed?: number; // in Mbps
  screenBrightness?: number; // 0-100
  availableStorage?: number; // in bytes
  captureTime?: number; // Time from opening camera to submission (seconds)
  retakeCount?: number;
}

export interface IDailyLog extends Document {
  internId: mongoose.Types.ObjectId;
  date: Date;
  amLog?: IImageLog;
  pmLog?: IImageLog;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
  },
  altitude: {
    type: Number,
  },
  accuracy: {
    type: Number,
    min: 0,
  },
  heading: {
    type: Number,
    min: 0,
    max: 360,
  },
  speed: {
    type: Number,
    min: 0,
  },
}, { _id: false });

const DeviceInfoSchema: Schema = new Schema({
  model: {
    type: String,
  },
  osVersion: {
    type: String,
  },
  appVersion: {
    type: String,
  },
}, { _id: false });

const ImageDimensionsSchema: Schema = new Schema({
  width: {
    type: Number,
    min: 0,
  },
  height: {
    type: Number,
    min: 0,
  },
}, { _id: false });

const WeatherDataSchema: Schema = new Schema({
  temperature: {
    type: Number,
  },
  conditions: {
    type: String,
  },
}, { _id: false });

const ImageLogSchema: Schema = new Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  location: {
    type: LocationSchema,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  period: {
    type: String,
    enum: ['AM', 'PM'],
    required: true,
  },
  notes: {
    type: String,
  },
  hoursWorked: {
    type: Number,
    min: 0,
    max: 24,
  },
  activityType: {
    type: String,
    enum: ['Work', 'Break', 'Meeting', 'Training', 'Other'],
  },
  deviceInfo: {
    type: DeviceInfoSchema,
  },
  networkType: {
    type: String,
    enum: ['WIFI', 'CELLULAR', 'UNKNOWN'],
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
  },
  timezone: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  imageDimensions: {
    type: ImageDimensionsSchema,
  },
  imageFileSize: {
    type: Number,
    min: 0,
  },
  imageExif: {
    type: Schema.Types.Mixed,
  },
  weatherData: {
    type: WeatherDataSchema,
  },
  // New metrics
  sessionDuration: {
    type: Number,
    min: 0,
  },
  timeSinceLastLog: {
    type: Number,
    min: 0,
  },
  deviceOrientation: {
    type: String,
    enum: ['portrait', 'landscape'],
  },
  wifiSSID: {
    type: String,
  },
  signalStrength: {
    type: Number,
  },
  networkSpeed: {
    type: Number,
    min: 0,
  },
  screenBrightness: {
    type: Number,
    min: 0,
    max: 100,
  },
  availableStorage: {
    type: Number,
    min: 0,
  },
  captureTime: {
    type: Number,
    min: 0,
  },
  retakeCount: {
    type: Number,
    min: 0,
  },
}, { _id: false });

const DailyLogSchema: Schema = new Schema(
  {
    internId: {
      type: Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    amLog: {
      type: ImageLogSchema,
    },
    pmLog: {
      type: ImageLogSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one log per intern per day
DailyLogSchema.index({ internId: 1, date: 1 }, { unique: true });

const DailyLog: Model<IDailyLog> = mongoose.models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

export default DailyLog;




