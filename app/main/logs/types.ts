export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface ImageLog {
  imageUrl: string;
  location: Location;
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
  batteryLevel?: number;
  timezone?: string;
  ipAddress?: string;
  imageDimensions?: {
    width: number;
    height: number;
  };
  imageFileSize?: number;
  imageExif?: Record<string, any>;
  weatherData?: {
    temperature?: number;
    conditions?: string;
  };
}

export interface DailyLog {
  _id: string;
  internId: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
  };
  date: string;
  amLog?: ImageLog;
  pmLog?: ImageLog;
  createdAt: string;
}

export interface LogFilters {
  internId: string;
  startDate: string;
  endDate: string;
  status: 'all' | 'complete' | 'incomplete' | 'am-only' | 'pm-only';
  companyId: string;
  sortBy: 'newest' | 'oldest' | 'intern-name';
  datePreset: 'custom' | 'today' | 'this-week' | 'this-month' | 'last-7-days' | 'last-30-days';
}
