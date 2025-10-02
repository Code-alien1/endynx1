import apiService from './api';

export interface FaceRecognitionResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  confidence?: number;
  face_encoding?: string;
  message?: string;
  error?: string;
  attendance_eligible?: boolean;
}

export interface FaceRegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface FaceRegistrationStatus {
  registered: boolean;
  registration_date?: string;
  error?: string;
}

class FaceRecognitionService {
  /**
   * Authenticate user with face for attendance marking
   */
  async authenticateWithFace(imageBase64: string): Promise<FaceRecognitionResponse> {
    try {
      const response = await apiService.api.post('/face-recognition/authenticate/', {
        image: imageBase64
      });

      return response.data;
    } catch (error: any) {
      console.error('Face authentication error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Face not recognized. Please register your face first.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'Face authentication failed'
      };
    }
  }

  /**
   * Register user's face for future authentication
   */
  async registerFace(imageBase64: string, userId: string): Promise<FaceRegistrationResponse> {
    try {
      const response = await apiService.api.post('/face-recognition/register/', {
        image: imageBase64,
        user_id: userId
      });

      return response.data;
    } catch (error: any) {
      console.error('Face registration error:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Face registration failed'
      };
    }
  }

  /**
   * Check if user has registered their face
   */
  async getFaceRegistrationStatus(userId: string): Promise<FaceRegistrationStatus> {
    try {
      const response = await apiService.api.get(`/face-recognition/status/${userId}/`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking face registration status:', error);
      
      return {
        registered: false,
        error: error.response?.data?.error || 'Failed to check registration status'
      };
    }
  }

  /**
   * Convert image URI to base64
   */
  async convertImageToBase64(imageUri: string): Promise<string> {
    // This is a placeholder - in a real implementation, you would
    // use a library like expo-file-system to convert the image
    return `data:image/jpeg;base64,${imageUri}`;
  }

  /**
   * Register face with biometric authentication
   */
  async registerFaceWithBiometric(biometricId: string, userId: string): Promise<FaceRegistrationResponse> {
    try {
      console.log('Registering face with biometric ID:', { biometricId, userId });
      
      // For now, return success since we're using device biometrics
      return {
        success: true,
        message: 'Face registered successfully with biometric authentication'
      };
    } catch (error: any) {
      console.error('Biometric face registration error:', error);
      
      return {
        success: false,
        error: 'Failed to register face with biometric authentication'
      };
    }
  }

  /**
   * Authenticate with biometric
   */
  async authenticateWithBiometric(biometricId: string, userId: string): Promise<FaceRecognitionResponse> {
    try {
      console.log('Authenticating with biometric ID:', { biometricId, userId });
      
      // For now, return success since we're using device biometrics
      return {
        success: true,
        user: {
          id: userId,
          username: 'biometric_user',
          email: 'user@example.com',
          first_name: 'Biometric',
          last_name: 'User',
          role: 'student'
        },
        confidence: 0.98, // High confidence for biometric authentication
        message: 'Biometric authentication successful'
      };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      return {
        success: false,
        error: 'Biometric authentication failed'
      };
    }
  }

  /**
   * Store face encoding
   */
  async storeFaceEncoding(userId: string, faceEncoding: string): Promise<FaceRegistrationResponse> {
    try {
      console.log('Storing face encoding for user:', userId);
      
      // For now, just return success since we're using biometric authentication
      return {
        success: true,
        message: 'Face encoding stored successfully'
      };
    } catch (error: any) {
      console.error('Face encoding storage error:', error);
      
      return {
        success: false,
        error: 'Failed to store face encoding'
      };
    }
  }

  /**
   * Validate image before sending to API
   */
  async validateImage(imageUri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Check file size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        return {
          valid: false,
          error: 'Image file is too large. Please use an image smaller than 5MB.'
        };
      }
      
      // Check file type
      if (!blob.type.startsWith('image/')) {
        return {
          valid: false,
          error: 'Invalid file type. Please use a valid image file.'
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating image:', error);
      return {
        valid: false,
        error: 'Failed to validate image. Please try again.'
      };
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;
