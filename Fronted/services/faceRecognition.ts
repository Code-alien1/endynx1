import * as FaceDetector from 'expo-face-detector';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface FaceData {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  faceID: number;
  rollAngle: number;
  yawAngle: number;
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
  private readonly FACE_DETECTION_OPTIONS = {
    mode: FaceDetector.FaceDetectorMode.accurate,
    detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
    runClassifications: FaceDetector.FaceDetectorClassifications.all,
    minDetectionInterval: 100,
    tracking: true,
  };

  /**
   * Detect faces in an image
   */
  async detectFaces(imageUri: string): Promise<FaceRecognitionResult> {
    try {
      const result = await FaceDetector.detectFacesAsync(imageUri, this.FACE_DETECTION_OPTIONS);
      
      if (result.faces.length === 0) {
        return {
          success: false,
          faces: [],
          error: 'No faces detected in the image'
        };
      }

      if (result.faces.length > 1) {
        return {
          success: false,
          faces: result.faces,
          error: 'Multiple faces detected. Please ensure only one face is visible.'
        };
      }

      const face = result.faces[0];
      
      // Check face quality
      const qualityCheck = this.checkFaceQuality(face);
      if (!qualityCheck.isValid) {
        return {
          success: false,
          faces: result.faces,
          error: qualityCheck.reason
        };
      }

      // Generate a simple face encoding (in a real app, you'd use a proper face recognition library)
      const faceEncoding = await this.generateFaceEncoding(face, imageUri);
      
      return {
        success: true,
        faces: result.faces,
        imageUri,
        faceEncoding,
        confidenceScore: this.calculateConfidenceScore(face)
      };

    } catch (error) {
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
    if (Math.abs(face.rollAngle) > 30 || Math.abs(face.yawAngle) > 30) {
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
        rollAngle: face.rollAngle,
        yawAngle: face.yawAngle,
        faceID: face.faceID,
        timestamp: Date.now()
      };

      // Convert to base64 string
      return Buffer.from(JSON.stringify(encoding)).toString('base64');
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
    const angleScore = 1 - (Math.abs(face.rollAngle) + Math.abs(face.yawAngle)) / 60;
    score += angleScore * 0.2;

    // Eye openness factor
    if (face.leftEyeOpenProbability !== undefined && face.rightEyeOpenProbability !== undefined) {
      const eyeScore = (face.leftEyeOpenProbability + face.rightEyeOpenProbability) / 2;
      score += eyeScore * 0.1;
    }

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Compare two face encodings (simplified implementation)
   */
  async compareFaces(encoding1: string, encoding2: string): Promise<{ match: boolean; similarity: number }> {
    try {
      const face1 = JSON.parse(Buffer.from(encoding1, 'base64').toString());
      const face2 = JSON.parse(Buffer.from(encoding2, 'base64').toString());

      // Simple geometric comparison (in production, use proper face recognition algorithms)
      const boundsSimilarity = this.compareBounds(face1.bounds, face2.bounds);
      const angleSimilarity = this.compareAngles(face1.rollAngle, face1.yawAngle, face2.rollAngle, face2.yawAngle);
      
      const similarity = (boundsSimilarity + angleSimilarity) / 2;
      const match = similarity > 0.7; // Threshold for match

      return { match, similarity };
    } catch (error) {
      console.error('Error comparing faces:', error);
      return { match: false, similarity: 0 };
    }
  }

  private compareBounds(bounds1: any, bounds2: any): number {
    const ratio1 = bounds1.size.width / bounds1.size.height;
    const ratio2 = bounds2.size.width / bounds2.size.height;
    
    const ratioDiff = Math.abs(ratio1 - ratio2);
    return Math.max(0, 1 - ratioDiff);
  }

  private compareAngles(roll1: number, yaw1: number, roll2: number, yaw2: number): number {
    const rollDiff = Math.abs(roll1 - roll2);
    const yawDiff = Math.abs(yaw1 - yaw2);
    
    const totalDiff = (rollDiff + yawDiff) / 2;
    return Math.max(0, 1 - totalDiff / 30); // Normalize by max expected difference
  }

  /**
   * Save face image to device storage
   */
  async saveFaceImage(imageUri: string, userId: string): Promise<string> {
    try {
      const fileName = `face_${userId}_${Date.now()}.jpg`;
      const directory = `${FileSystem.documentDirectory}faces/`;
      
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
   * Validate face recognition requirements
   */
  validateFaceRecognitionSupport(): { supported: boolean; reason?: string } {
    try {
      // Basic check - if FaceDetector module is available
      if (!FaceDetector) {
        return { 
          supported: false, 
          reason: 'Face detection is not available on this device' 
        };
      }

      return { supported: true };
    } catch (error) {
      return { 
        supported: false, 
        reason: 'Face detection is not supported on this platform' 
      };
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;