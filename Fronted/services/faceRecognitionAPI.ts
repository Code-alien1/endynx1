import apiService from './api';

export interface FaceRecognitionResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  confidence?: number;
  message?: string;
  error?: string;
}

export interface FaceRegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class FaceRecognitionAPIService {
  /**
   * Send captured photo to face recognition API for authentication
   */
  async authenticateWithFace(imageUri: string): Promise<FaceRecognitionResponse> {
    try {
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Send to face recognition API
      const response = await apiService.post('/face-recognition/', {
        image: base64Image,
        action: 'authenticate'
      });

      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
          confidence: response.data.confidence,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Face authentication failed'
        };
      }
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
   * Register user's face by sending captured photo to API
   */
  async registerFace(imageUri: string, userId: number): Promise<FaceRegistrationResponse> {
    try {
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Send to face registration API
      const response = await apiService.post('/face-recognition/', {
        image: base64Image,
        action: 'register',
        user_id: userId
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Face registered successfully'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Face registration failed'
        };
      }
    } catch (error: any) {
      console.error('Face registration error:', error);
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.error || 'Invalid image or face not detected.'
        };
      } else if (error.response?.status === 409) {
        return {
          success: false,
          error: 'Face already registered for this user.'
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
   * Update user's face registration
   */
  async updateFaceRegistration(imageUri: string, userId: number): Promise<FaceRegistrationResponse> {
    try {
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Send to face update API
      const response = await apiService.put('/face-recognition/', {
        image: base64Image,
        user_id: userId
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Face registration updated successfully'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Face registration update failed'
        };
      }
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
          error: 'User not found or no existing face registration.'
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
   * Delete user's face registration
   */
  async deleteFaceRegistration(userId: number): Promise<FaceRegistrationResponse> {
    try {
      const response = await apiService.delete(`/face-recognition/${userId}/`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Face registration deleted successfully'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Face registration deletion failed'
        };
      }
    } catch (error: any) {
      console.error('Face registration deletion error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'No face registration found for this user.'
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
   * Convert image URI to base64 string
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
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

  /**
   * Get face recognition status for user
   */
  async getFaceRegistrationStatus(userId: number): Promise<{
    registered: boolean;
    registration_date?: string;
    error?: string;
  }> {
    try {
      const response = await apiService.get(`/face-recognition/status/${userId}/`);
      
      return {
        registered: response.data.registered,
        registration_date: response.data.registration_date
      };
    } catch (error: any) {
      console.error('Error checking face registration status:', error);
      
      return {
        registered: false,
        error: error.response?.data?.error || 'Failed to check registration status'
      };
    }
  }
}

export const faceRecognitionAPIService = new FaceRecognitionAPIService();
export default faceRecognitionAPIService;