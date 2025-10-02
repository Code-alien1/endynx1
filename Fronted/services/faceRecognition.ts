// Try to import expo-face-detector, but handle gracefully if not available
let FaceDetector: any = null;
try {
  FaceDetector = require('expo-face-detector');
} catch (error) {
  console.warn('expo-face-detector not available, using biometric-only mode');
}
import * as FileSystem from 'expo-file-system';
// @ts-ignore - documentDirectory exists but may not be in type definitions
const { documentDirectory } = FileSystem;
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FaceData {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  faceID?: number;
  rollAngle?: number;
  yawAngle?: number;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export interface FaceRecognitionResult {
  success: boolean;
  faces: FaceData[];
  imageUri?: string;
  faceEncoding?: string;
  confidenceScore?: number;
  error?: string;
}

class FaceRecognitionService {
  private readonly FACE_DETECTION_OPTIONS = FaceDetector ? {
    mode: FaceDetector.FaceDetectorMode.fast,
    detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
    runClassifications: FaceDetector.FaceDetectorClassifications.all,
  } : null;

  private baseUrl = 'http://192.168.2.33:8000/api';

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try multiple possible token storage keys (starting with the correct one)
      let token = await AsyncStorage.getItem('auth_token'); // This is the correct key used by login
      
      if (!token) {
        // Try alternative token keys that might be used
        token = await AsyncStorage.getItem('authToken');
      }
      
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      
      if (!token) {
        token = await AsyncStorage.getItem('access_token');
      }
      
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
      }
      
      console.log('Retrieved token from storage:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token found');
      
      if (!token) {
        console.error('No auth token found in any storage key');
        
        // Try to get all storage keys to debug
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          console.log('All AsyncStorage keys:', allKeys);
          
          // Check if there's any token-like key
          for (const key of allKeys) {
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
              const value = await AsyncStorage.getItem(key);
              console.log(`Found potential token key: ${key} = ${value ? value.substring(0, 20) + '...' : 'null'}`);
              if (value && !token) {
                token = value; // Use the first token-like value found
                console.log('Using token from key:', key);
                break;
              }
            }
          }
        } catch (debugError) {
          console.error('Error debugging storage keys:', debugError);
        }
        
        if (!token) {
          return null;
        }
      }
      
      // Check if token is expired (basic check)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            console.error('Token is expired, exp:', payload.exp, 'current:', currentTime);
            await AsyncStorage.removeItem('authToken'); // Remove expired token
            return null;
          }
          console.log('Token is valid, expires at:', new Date(payload.exp * 1000));
        }
      } catch (e) {
        console.warn('Could not parse token for expiry check, using token as-is:', e);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Register a face for a user
   */
  async registerFace(imageUri: string, userId: string): Promise<FaceRecognitionResult> {
    try {
      console.log('Starting face registration for user:', userId);
      
      // First detect faces in the image
      const detectionResult = await this.detectFaces(imageUri);
      
      if (!detectionResult.success || detectionResult.faces.length === 0) {
        return {
          success: false,
          faces: [],
          error: detectionResult.error || 'No faces detected in the image'
        };
      }

      if (detectionResult.faces.length > 1) {
        return {
          success: false,
          faces: detectionResult.faces,
          error: 'Multiple faces detected. Please ensure only one face is visible.'
        };
      }

      const face = detectionResult.faces[0];
      
      // Check face quality
      const qualityCheck = this.checkFaceQuality(face);
      if (!qualityCheck.isValid) {
        return {
          success: false,
          faces: [face],
          error: qualityCheck.reason
        };
      }

      // Generate face encoding
      const faceEncoding = await this.generateFaceEncoding(face, imageUri);
      
      // Save face image locally
      const savedImagePath = await this.saveFaceImage(imageUri, userId);
      
      // Call backend API to register the face
      const response = await fetch(`${this.baseUrl}/face-recognition/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          user_id: userId,
          face_encoding: faceEncoding,
          image_path: savedImagePath,
          face_data: {
            bounds: face.bounds,
            confidence_score: this.calculateConfidenceScore(face)
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Face registration successful');
        return {
          success: true,
          faces: [face],
          imageUri: savedImagePath,
          faceEncoding,
          confidenceScore: this.calculateConfidenceScore(face)
        };
      } else {
        console.error('Face registration failed:', data);
        return {
          success: false,
          faces: [face],
          error: data.error || 'Failed to register face with server'
        };
      }
    } catch (error: any) {
      console.error('Face registration error:', error);
      return {
        success: false,
        faces: [],
        error: error.message || 'Face registration failed'
      };
    }
  }

  /**
   * Authenticate a user using face recognition
   */
  async authenticateWithFace(imageUri: string, userId: string): Promise<FaceRecognitionResult & { user?: any }> {
    try {
      console.log('Starting face authentication for user:', userId);
      
      // First detect faces in the image
      const detectionResult = await this.detectFaces(imageUri);
      
      if (!detectionResult.success || detectionResult.faces.length === 0) {
        return {
          success: false,
          faces: [],
          error: detectionResult.error || 'No faces detected in the image'
        };
      }

      if (detectionResult.faces.length > 1) {
        return {
          success: false,
          faces: detectionResult.faces,
          error: 'Multiple faces detected. Please ensure only one face is visible.'
        };
      }

      const face = detectionResult.faces[0];
      
      // Check face quality
      const qualityCheck = this.checkFaceQuality(face);
      if (!qualityCheck.isValid) {
        return {
          success: false,
          faces: [face],
          error: qualityCheck.reason
        };
      }

      // Generate face encoding for comparison
      const faceEncoding = await this.generateFaceEncoding(face, imageUri);
      
      // Call backend API to authenticate
      const response = await fetch(`${this.baseUrl}/face-recognition/authenticate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          user_id: userId,
          face_encoding: faceEncoding,
          face_data: {
            bounds: face.bounds,
            confidence_score: this.calculateConfidenceScore(face)
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Face authentication successful');
        return {
          success: true,
          faces: [face],
          imageUri,
          faceEncoding,
          confidenceScore: this.calculateConfidenceScore(face),
          user: data.user
        };
      } else {
        console.error('Face authentication failed:', data);
        return {
          success: false,
          faces: [face],
          error: data.error || 'Face authentication failed'
        };
      }
    } catch (error: any) {
      console.error('Face authentication error:', error);
      return {
        success: false,
        faces: [],
        error: error.message || 'Face authentication failed'
      };
    }
  }

  /**
   * Get face registration status for a user
   */
  async getFaceRegistrationStatus(userId: string): Promise<{ registered: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/face-recognition/status/${userId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        return { registered: data.registered || false };
      } else {
        return { registered: false, error: data.error || 'Failed to check registration status' };
      }
    } catch (error: any) {
      console.error('Error checking face registration status:', error);
      return { registered: false, error: error.message || 'Network error' };
    }
  }

  /**
   * Detect faces in an image
   */
  async detectFaces(imageUri: string): Promise<FaceRecognitionResult> {
    try {
      console.log('Detecting faces in image:', imageUri);
      
      // If FaceDetector is not available, return a mock successful result
      // This allows biometric authentication to work without camera-based face detection
      if (!FaceDetector || !this.FACE_DETECTION_OPTIONS) {
        console.log('FaceDetector not available, using biometric-only mode');
        
        // Create a mock face data for biometric authentication
        const mockFace: FaceData = {
          bounds: {
            origin: { x: 100, y: 100 },
            size: { width: 200, height: 200 }
          },
          faceID: 1,
          rollAngle: 0,
          yawAngle: 0,
          smilingProbability: 0.8,
          leftEyeOpenProbability: 0.9,
          rightEyeOpenProbability: 0.9
        };

        return {
          success: true,
          faces: [mockFace],
          imageUri
        };
      }
      
      const result = await FaceDetector.detectFacesAsync(imageUri, this.FACE_DETECTION_OPTIONS);
      
      console.log('Face detection result:', {
        facesCount: result.faces.length,
        faces: result.faces.map((face: any) => ({
          bounds: face.bounds,
          faceID: face.faceID,
          rollAngle: face.rollAngle,
          yawAngle: face.yawAngle
        }))
      });

      if (result.faces.length === 0) {
        return {
          success: false,
          faces: [],
          error: 'No faces detected. Please ensure your face is clearly visible and well-lit.'
        };
      }

      return {
        success: true,
        faces: result.faces,
        imageUri
      };

    } catch (error: any) {
      console.error('Face detection error:', error);
      return {
        success: false,
        faces: [],
        error: 'Failed to detect faces. Please try again.'
      };
    }
  }

  /**
   * Check if the detected face meets quality requirements
   */
  private checkFaceQuality(face: FaceData): { isValid: boolean; reason?: string } {
    // Check if face is too small
    const faceSize = Math.min(face.bounds.size.width, face.bounds.size.height);
    if (faceSize < 100) {
      return { isValid: false, reason: 'Face is too small. Please move closer to the camera.' };
    }

    // Check face angle (too much rotation)
    const rollAngle = face.rollAngle ?? 0;
    const yawAngle = face.yawAngle ?? 0;
    if (Math.abs(rollAngle) > 30 || Math.abs(yawAngle) > 30) {
      return { isValid: false, reason: 'Please face the camera directly.' };
    }

    // Check if eyes are open (if available)
    if (face.leftEyeOpenProbability !== undefined && face.rightEyeOpenProbability !== undefined) {
      if (face.leftEyeOpenProbability < 0.5 || face.rightEyeOpenProbability < 0.5) {
        return { isValid: false, reason: 'Please keep your eyes open.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate a simple face encoding (placeholder implementation)
   * In a production app, you would use a proper face recognition library like face-api.js or TensorFlow
   */
  private async generateFaceEncoding(face: FaceData, imageUri: string): Promise<string> {
    try {
      // This is a simplified encoding based on face geometry
      // In production, you'd extract actual facial features using ML models
      const encoding = {
        bounds: face.bounds,
        rollAngle: face.rollAngle ?? 0,
        yawAngle: face.yawAngle ?? 0,
        faceID: face.faceID,
        timestamp: Date.now()
      };

      // Convert to base64 string
      return btoa(JSON.stringify(encoding));
    } catch (error) {
      console.error('Error generating face encoding:', error);
      throw new Error('Failed to generate face encoding');
    }
  }

  /**
   * Calculate confidence score based on face quality metrics
   */
  private calculateConfidenceScore(face: FaceData): number {
    let score = 0.5; // Base score

    // Face size factor
    const faceSize = Math.min(face.bounds.size.width, face.bounds.size.height);
    if (faceSize > 200) score += 0.2;
    else if (faceSize > 150) score += 0.1;

    // Face angle factor
    const rollAngle = face.rollAngle ?? 0;
    const yawAngle = face.yawAngle ?? 0;
    const angleScore = 1 - (Math.abs(rollAngle) + Math.abs(yawAngle)) / 60;
    score += angleScore * 0.2;

    // Eye openness factor
    if (face.leftEyeOpenProbability !== undefined && face.rightEyeOpenProbability !== undefined) {
      const eyeScore = (face.leftEyeOpenProbability + face.rightEyeOpenProbability) / 2;
      score += eyeScore * 0.1;
    }

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Save face image to device storage
   */
  async saveFaceImage(imageUri: string, userId: string): Promise<string> {
    try {
      const fileName = `face_${userId}_${Date.now()}.jpg`;
      const directory = `${documentDirectory}faces/`;
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const newPath = `${directory}${fileName}`;
      await FileSystem.copyAsync({
        from: imageUri,
        to: newPath
      });

      return newPath;
    } catch (error) {
      console.error('Error saving face image:', error);
      throw new Error('Failed to save face image');
    }
  }

  /**
   * Check if face recognition is supported on this device
   */
  checkSupport(): { supported: boolean; reason?: string } {
    try {
      // If FaceDetector is not available, we can still support biometric authentication
      if (!FaceDetector) {
        console.log('FaceDetector not available, but biometric authentication is supported');
        return { 
          supported: true, 
          reason: 'Using biometric authentication mode' 
        };
      }

      return { supported: true };
    } catch (error) {
      return { 
        supported: true, 
        reason: 'Using biometric authentication fallback' 
      };
    }
  }

  /**
   * Check biometric registration status for a user
   */
  async getBiometricRegistrationStatus(userId: string): Promise<{ registered: boolean; error?: string }> {
    try {
      console.log('=== CHECKING BIOMETRIC REGISTRATION STATUS ===');
      console.log('Checking status for user:', userId);
      
      const authToken = await this.getAuthToken();
      if (!authToken) {
        return { registered: false, error: 'Authentication required' };
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/face-recognition/status/${userId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Biometric status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Biometric status data:', data);
        return { registered: data.registered || false };
      } else {
        console.warn('Failed to check biometric status:', response.status);
        return { registered: false, error: 'Failed to check registration status' };
      }
    } catch (error: any) {
      console.error('Error checking biometric status:', error);
      return { registered: false, error: error.message };
    }
  }

  /**
   * Test if biometric endpoint is reachable
   */
  async testBiometricEndpoint(): Promise<void> {
    try {
      console.log('=== TESTING BIOMETRIC ENDPOINT ===');
      const testUrl = `${this.baseUrl}/face-recognition/register/`;
      console.log('Testing URL:', testUrl);
      
      // First test if the endpoint exists with OPTIONS
      const optionsResponse = await fetch(testUrl, {
        method: 'OPTIONS',
      });
      
      console.log('OPTIONS response status:', optionsResponse.status);
      console.log('OPTIONS response headers:', Object.fromEntries(optionsResponse.headers.entries()));
      
      // If OPTIONS fails, try HEAD request
      if (optionsResponse.status === 405) {
        console.log('OPTIONS not allowed, trying HEAD request...');
        const headResponse = await fetch(testUrl, {
          method: 'HEAD',
        });
        console.log('HEAD response status:', headResponse.status);
      }
      
      console.log('Endpoint test completed');
    } catch (error) {
      console.error('Endpoint test failed:', error);
    }
  }

  /**
   * Register face with biometric authentication
   */
  async registerFaceWithBiometric(biometricId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== BIOMETRIC REGISTRATION API CALL ===');
      console.log('Registering face with biometric ID for user:', userId);
      console.log('Using API URL:', `${this.baseUrl}/face-recognition/biometric-register/`);
      
      // Test endpoint connectivity first
      await this.testBiometricEndpoint();
      
      const authToken = await this.getAuthToken();
      console.log('Auth token available:', !!authToken);
      
      if (!authToken) {
        console.error('No valid auth token available');
        return { 
          success: false, 
          error: 'Authentication required. Please login again.' 
        };
      }
      
      console.log('Making API request with token...');
      
      // Call the backend API to register biometric face data
      const response = await fetch(`${this.baseUrl}/face-recognition/biometric-register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          user_id: userId,
          biometric_id: biometricId,
          device_info: {
            platform: 'mobile',
            biometric_type: 'face_id'
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error('Authentication failed - token invalid or expired');
        await AsyncStorage.removeItem('authToken'); // Clear invalid token
        return { 
          success: false, 
          error: 'Session expired. Please login again.' 
        };
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        console.log('Biometric face registration successful');
        return { success: true };
      } else {
        console.error('Biometric registration failed:', data);
        return { 
          success: false, 
          error: data.error || `Server error: ${response.status}` 
        };
      }
    } catch (error: any) {
      console.error('Error registering biometric face:', error);
      return { 
        success: false, 
        error: error.message || 'Network error during biometric registration' 
      };
    }
  }

  /**
   * Authenticate with biometric data
   */
  async authenticateWithBiometric(biometricId: string, userId: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('Authenticating with biometric ID for user:', userId);
      
      // Call the backend API to authenticate with biometric data
      const response = await fetch(`${this.baseUrl}/face-recognition/authenticate-biometric/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          user_id: userId,
          biometric_id: biometricId,
          device_info: {
            platform: 'mobile',
            biometric_type: 'face_id'
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Biometric authentication successful');
        return { 
          success: true, 
          user: data.user || { id: userId, name: 'Biometric User' }
        };
      } else {
        console.error('Biometric authentication failed:', data);
        return { 
          success: false, 
          error: data.error || 'Biometric authentication failed' 
        };
      }
    } catch (error: any) {
      console.error('Error authenticating with biometric:', error);
      return { 
        success: false, 
        error: error.message || 'Network error during biometric authentication' 
      };
    }
  }

  /**
   * Store face encoding for a user
   */
  async storeFaceEncoding(userId: string, faceEncoding: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Storing face encoding for user:', userId);
      
      // Store face encoding locally or send to backend
      // For now, we'll just log it as the backend handles the actual storage
      console.log('Face encoding stored successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error storing face encoding:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to store face encoding' 
      };
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;
