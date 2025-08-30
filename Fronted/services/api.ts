import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Configuration
const resolveApiBaseUrl = (): string => {
  const envUrl = (process as any)?.env?.EXPO_PUBLIC_API_URL as string | undefined;
  if (envUrl && typeof envUrl === 'string') {
    // Normalize: remove trailing slash
    return "http://192.168.83.107:8000/api";
  }
  
  // For development, use your computer's IP address
  // This allows the mobile app to connect to your Django server
  const developmentIPs = [
    'http://192.168.191.107:8000/api',  // Your current network IP
    'http://192.168.2.33:8000/api',    // Alternative network IP
    'http://127.0.0.1:8000/api',       // Localhost fallback
  ];
  
  // Try to infer host from Expo
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    return `http://${host}:8000/api`;
  }
  
  // Platform-specific defaults
  if (Platform.OS === 'android') {
    // Android emulator maps host loopback to 10.0.2.2
    return 'http://10.0.2.2:8000/api';
  } else if (Platform.OS === 'web') {
    // Web can use localhost
    return 'http://localhost:8000/api';
  }
  
  // For physical devices, use the first development IP
  return developmentIPs[0];
};
const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'parent' | 'teacher' | 'mentor' | 'administration' | 'superadmin';
  phone_number?: string;
  student_id?: string;
  teacher_id?: string;
  mentor_id?: string;
  admin_id?: string;
  level?: number;
  class_name?: string;
  rating?: number;
  total_ratings?: number;
  profile_picture?: string;
  subject_taught?: string;
  department?: string;
  position?: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
  student_id?: string;
  level?: number;
  class_name?: string;
  teacher_id?: string;
  subject_taught?: string;
  department?: string;
  mentor_id?: string;
  admin_id?: string;
  position?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface AttendanceSession {
  id: string;
  class_obj: string;
  class_name: string;
  session_type: 'morning' | 'afternoon' | 'evening' | 'custom';
  date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  attendance_count: number;
  total_students: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student: string;
  student_name: string;
  session: string;
  session_info: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'pending';
  method: 'face_recognition' | 'qr_code' | 'peer_scan' | 'manual' | 'justification';
  timestamp: string;
  location?: string;
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  notes?: string;
}

export interface QRCode {
  id: string;
  session: string;
  session_info: string;
  code: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
  expires_at?: string;
}

export interface AbsenceJustification {
  id: string;
  student: string;
  student_name: string;
  attendance: string;
  attendance_info: string;
  reason: string;
  photo?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  submitted_at: string;
}

// API Service Class
class ApiService {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased timeout to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Base URL:', API_BASE_URL); // Debug log

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - simplified without automatic refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If 401, just clear tokens and let user login again
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/users/login/', credentials);
    
    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, response.data.tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.tokens.refresh);
    
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/users/register/', userData);
    
    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, response.data.tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.tokens.refresh);
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await this.api.post('/users/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored tokens
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/profile/');
    return response.data;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put('/users/profile/', profileData);
    return response.data.user;
  }

  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    await this.api.post('/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  }

  // User Management Methods
  async getStudents(params?: { level?: number; class_name?: string }): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/students/', { params });
    return response.data;
  }

  async getTeachers(params?: { department?: string; subject?: string }): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/teachers/', { params });
    return response.data;
  }

  async getMentors(params?: { level?: number; min_rating?: number }): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/mentors/', { params });
    return response.data;
  }

  async searchUsers(query: string, role?: string): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/search/', {
      params: { q: query, role },
    });
    return response.data;
  }

  // Mentor Management Methods
  async assignMentor(studentId: string, mentorId: string): Promise<any> {
    const response = await this.api.post('/users/assign-mentor/', {
      student_id: studentId,
      mentor_id: mentorId,
    });
    return response.data;
  }

  async rateMentor(mentorId: string, rating: number): Promise<any> {
    const response = await this.api.post('/users/rate-mentor/', {
      mentor_id: mentorId,
      rating,
    });
    return response.data;
  }

  // Class Methods
  async getClasses(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/attendance/classes/');
    return response.data;
  }

  // Attendance Methods
  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    console.log('API: Making request to /attendance/sessions/');
    try {
      const response: AxiosResponse<AttendanceSession[]> = await this.api.get('/attendance/sessions/');
      console.log('API: Sessions response status:', response.status);
      console.log('API: Sessions response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('API: Error fetching sessions:', error);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Error status:', error.response?.status);
      throw error;
    }
  }

  async createAttendanceSession(sessionData: any): Promise<AttendanceSession> {
    const response: AxiosResponse<AttendanceSession> = await this.api.post('/attendance/sessions/', sessionData);
    return response.data;
  }

  async deleteAttendanceSession(sessionId: string): Promise<void> {
    await this.api.delete(`/attendance/sessions/${sessionId}/`);
  }

  // Admin API methods
  async getAllUsers(): Promise<any[]> {
    const response = await this.api.get('/admin/users/');
    return response.data;
  }

  async createUser(userData: any): Promise<any> {
    const response = await this.api.post('/admin/users/', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    const response = await this.api.put(`/admin/users/${userId}/`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/admin/users/${userId}/`);
  }

  async getAllJustifications(): Promise<any[]> {
    const response = await this.api.get('/admin/justifications/');
    return response.data;
  }

  async updateJustificationStatus(justificationId: string, status: string): Promise<any> {
    const response = await this.api.patch(`/admin/justifications/${justificationId}/`, { status });
    return response.data;
  }

  async getAllAnnouncements(): Promise<any[]> {
    const response = await this.api.get('/announcements/');
    return response.data;
  }

  async createAnnouncement(announcementData: any): Promise<any> {
    const response = await this.api.post('/announcements/', announcementData);
    return response.data;
  }

  async updateAnnouncement(announcementId: string, announcementData: any): Promise<any> {
    const response = await this.api.put(`/announcements/${announcementId}/`, announcementData);
    return response.data;
  }

  async getAttendanceRecordsByClass(className: string): Promise<any[]> {
    const endpoint = className === 'all' ? '/admin/attendance-records/' : `/admin/attendance-records/?class=${className}`;
    const response = await this.api.get(endpoint);
    return response.data;
  }

  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const response: AxiosResponse<AttendanceRecord[]> = await this.api.get('/attendance/records/');
    return response.data;
  }

  // Face Recognition Attendance
  async markAttendanceWithFaceRecognition(
    sessionId: string,
    faceEncoding: string,
    confidenceScore: number,
    location?: string,
    imageData?: string
  ): Promise<AttendanceRecord> {
    // Ensure confidence score complies with backend validation (max 5 total digits)
    const roundedConfidence = Math.round(Number(confidenceScore) * 1000) / 1000;
    const requestData = {
      session_id: sessionId,
      face_encoding: faceEncoding,
      confidence_score: roundedConfidence,
      location,
      image_data: imageData,
    };
    
    console.log('API: Marking attendance with face recognition', {
      sessionId,
      location,
      endpoint: '/attendance/face-recognition/',
      requestData
    });
    
    const response: AxiosResponse<{ message: string; attendance: AttendanceRecord }> = await this.api.post('/attendance/face-recognition/', requestData);
    
    console.log('API: Face recognition attendance response:', response.data);
    return response.data.attendance;
  }

  // QR Code Attendance
  async markAttendanceWithQRCode(sessionId: string, qrCode: string, location?: string): Promise<AttendanceRecord> {
    const response: AxiosResponse<{ message: string; attendance: AttendanceRecord }> = await this.api.post('/attendance/qr-attendance/', {
      session_id: sessionId,
      qr_code: qrCode,
      location,
    });
    return response.data.attendance;
  }

  async generateQRCode(sessionId: string, expiresInMinutes: number = 30): Promise<{ qr_code: QRCode; qr_image: string }> {
    const response = await this.api.post('/attendance/qr-generate/', {
      session_id: sessionId,
      expires_in_minutes: expiresInMinutes,
    });
    return response.data;
  }

  // Peer Attendance
  async markPeerAttendance(sessionId: string, scannedStudentId: string, notes?: string): Promise<AttendanceRecord> {
    const response: AxiosResponse<{ message: string; attendance: AttendanceRecord }> = await this.api.post('/attendance/peer-attendance/', {
      session_id: sessionId,
      scanned_student_id: scannedStudentId,
      notes,
    });
    return response.data.attendance;
  }

  // Absence Justification
  async submitAbsenceJustification(attendanceId: string, reason: string, photo?: string): Promise<AbsenceJustification> {
    const formData = new FormData();
    formData.append('attendance', attendanceId);
    formData.append('reason', reason);
    if (photo) {
      formData.append('photo', {
        uri: photo,
        type: 'image/jpeg',
        name: 'justification.jpg',
      } as any);
    }

    const response: AxiosResponse<AbsenceJustification> = await this.api.post('/attendance/justifications/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAbsenceJustifications(): Promise<AbsenceJustification[]> {
    const response: AxiosResponse<AbsenceJustification[]> = await this.api.get('/attendance/justifications/');
    return response.data;
  }

  // Attendance Verification (for teachers)
  async verifyAttendance(attendanceId: string, status: string, notes?: string): Promise<AttendanceRecord> {
    const response: AxiosResponse<{ message: string; attendance: AttendanceRecord }> = await this.api.post('/attendance/verify/', {
      attendance_id: attendanceId,
      status,
      notes,
    });
    return response.data.attendance;
  }

  // Reports and Statistics
  async getAttendanceReport(params: {
    class_id?: string;
    student_id?: string;
    start_date: string;
    end_date: string;
    include_justifications?: boolean;
  }): Promise<any> {
    const response = await this.api.post('/attendance/reports/', params);
    return response.data;
  }

  async getAttendanceStatistics(params: {
    student_id?: string;
    class_id?: string;
    period_start: string;
    period_end: string;
  }): Promise<any> {
    const response = await this.api.post('/attendance/statistics/', params);
    return response.data;
  }

  // Face Recognition Methods
  async faceLogin(faceEncoding: string, confidenceScore: number, imageData?: string): Promise<AuthResponse> {
    // Ensure confidence score complies with backend validation (max 5 total digits)
    const roundedConfidence = Math.round(Number(confidenceScore) * 1000) / 1000;
    const response: AxiosResponse<AuthResponse> = await this.api.post('/users/face-login/', {
      face_encoding: faceEncoding,
      confidence_score: roundedConfidence,
      image_data: imageData,
    });
    
    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, response.data.tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.tokens.refresh);
    
    return response.data;
  }

  async registerFace(faceEncoding: string, imageData?: string): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.post('/users/register-face/', {
      face_encoding: faceEncoding,
      image_data: imageData,
    });
    return response.data;
  }

  async updateFaceEncoding(faceEncoding: string, imageData?: string): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put('/users/face-encoding/', {
      face_encoding: faceEncoding,
      image_data: imageData,
    });
    return response.data;
  }

  // Face Recognition Attendance
  async markAttendanceWithFace(
    sessionId: string,
    faceEncoding: string,
    confidenceScore: number,
    location?: string,
    imageData?: string
  ): Promise<AttendanceRecord> {
    // Ensure confidence score complies with backend validation (max 5 total digits)
    const roundedConfidence = Math.round(Number(confidenceScore) * 1000) / 1000;
    const response: AxiosResponse<{ message: string; attendance: AttendanceRecord }> = await this.api.post('/attendance/face-attendance/', {
      session_id: sessionId,
      face_encoding: faceEncoding,
      confidence_score: roundedConfidence,
      location,
      image_data: imageData,
    });
    return response.data.attendance;
  }

  // Utility Methods
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      return false;
    }
    
    try {
      // Verify token is valid by making a request to get current user
      await this.api.get('/users/profile/');
      return true;
    } catch (error) {
      // Token is invalid, clear it
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  async storeTokens(tokens: { access: string; refresh: string }): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  // Get predefined classes for dropdowns
  async getPredefinedClasses(): Promise<{ classes: Array<{ value: string; label: string; level: number }> }> {
    const response = await this.api.get('/attendance/predefined-classes/');
    return response.data;
  }

  // HTTP method wrappers for direct access
  async get(url: string, config?: any): Promise<AxiosResponse> {
    return await this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any): Promise<AxiosResponse> {
    return await this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any): Promise<AxiosResponse> {
    return await this.api.put(url, data, config);
  }

  async delete(url: string, config?: any): Promise<AxiosResponse> {
    return await this.api.delete(url, config);
  }

  async patch(url: string, data?: any, config?: any): Promise<AxiosResponse> {
    return await this.api.patch(url, data, config);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
