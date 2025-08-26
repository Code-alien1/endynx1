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
   * Authenticate user with face recognition for login
   */
  async authenticateWithFace(imageBase64: string): Promise<FaceRecognitionResponse> {
    try {
      const response = await apiService.post('/face-recognition/', {
        image: imageBase64,
        action: 'authenticate'
      });

      return response.data;
    } catch (error: any) {
      console.error('Face authentication error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Face not recognized. Please register your face first or use email login.'
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.error || 'Invalid image or face not detected.'
        };
      } else if (error.response?.status === 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Register user's face for future authentication
   */
  async registerFace(imageBase64: string, userId: string): Promise<FaceRegistrationResponse> {
    try {
      const response = await apiService.post('/face-recognition/', {
        image: imageBase64,
        action: 'register',
        user_id: userId
      });

      return response.data;
    } catch (error: any) {
      console.error('Face registration error:', error);
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.error || 'Invalid image or face not detected.'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: 'User not found.'
        };
      } else if (error.response?.status === 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Recognize face for attendance marking
   */
  async recognizeForAttendance(imageBase64: string): Promise<FaceRecognitionResponse> {
    try {
      const response = await apiService.post('/face-recognition/attendance/', {
        image: imageBase64
      });

      return response.data;
    } catch (error: any) {
      console.error('Face attendance error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Face not recognized. Please register your face first.'
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.error || 'Invalid image or face not detected.'
        };
      } else if (error.response?.status === 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Update existing face registration
   */
  async updateFaceRegistration(imageBase64: string, userId?: string): Promise<FaceRegistrationResponse> {
    try {
      const payload: any = {
        image: imageBase64
      };
      
      if (userId) {
        payload.user_id = userId;
      }

      const response = await apiService.put('/face-recognition/', payload);

      return response.data;
    } catch (error: any) {
      console.error('Face registration update error:', error);
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.error || 'Invalid image or face not detected.'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: 'User not found.'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Permission denied.'
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Delete face registration
   */
  async deleteFaceRegistration(userId: string): Promise<FaceRegistrationResponse> {
    try {
      const response = await apiService.delete(`/face-recognition/${userId}/`);

      return response.data;
    } catch (error: any) {
      console.error('Face registration deletion error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'No face registration found for this user.'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Permission denied.'
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  /**
   * Get face registration status for user
   */
  async getFaceRegistrationStatus(userId: string): Promise<FaceRegistrationStatus> {
    try {
      const response = await apiService.get(`/face-recognition/status/${userId}/`);
      
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
   * Convert image URI to base64 string
   */
  async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
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