import axios from 'axios';
import { getStudentToken, clearStudentToken } from './student-storage';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getStudentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStudentToken();
      // Redirect to login will be handled by auth context
    }
    return Promise.reject(error);
  }
);

export interface LoginResponse {
  success: boolean;
  token: string;
  intern: {
    id: string;
    name: string;
    email: string;
    studentId: string;
    company: string;
    companyAddress: string;
    mustChangePassword?: boolean;
    profilePicture?: string | null;
  };
}

export interface Intern {
  id: string;
  name: string;
  email: string;
  studentId: string;
  company: string;
  companyAddress: string;
  mustChangePassword?: boolean;
  profilePicture?: string | null;
  phone?: string | null;
}

export interface Log {
  _id: string;
  internId: string;
  date: string;
  amLog?: {
    imageUrl: string;
    cloudinaryId: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    timestamp: string;
    notes?: string;
    submittedLate?: boolean;
  };
  pmLog?: {
    imageUrl: string;
    cloudinaryId: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    timestamp: string;
    notes?: string;
    submittedLate?: boolean;
  };
}

export const studentApi = {
  login: async (studentId: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/students/login', { studentId, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; intern: Intern }> => {
    const response = await api.get('/students/me');
    return response.data;
  },

  getLogs: async (internId: string): Promise<Log[]> => {
    const response = await api.get(`/students/logs?internId=${internId}`);
    return response.data.logs || [];
  },

  getLog: async (logId: string): Promise<Log> => {
    const response = await api.get(`/logs/${logId}`);
    return response.data.log;
  },

  submitLog: async (data: FormData): Promise<{ success: boolean; log: Log }> => {
    const response = await api.post('/students/logs', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadProfilePicture: async (studentId: string, imageFile: File): Promise<{ success: boolean; profilePicture: string }> => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('profilePicture', imageFile);
    
    const response = await api.put('/students/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    const response = await api.put('/students/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default studentApi;
