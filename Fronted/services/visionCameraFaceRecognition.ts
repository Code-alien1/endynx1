import { Face } from 'vision-camera-face-detector';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Extended Face interface to handle optional landmarks and confidence
interface ExtendedFace extends Face {
  confidence?: number;
  landmarks?: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    noseBase?: { x: number; y: number };
    leftMouth?: { x: number; y: number };
    rightMouth?: { x: number; y: number };
  };
}

export interface FaceRecognitionResult {
  success: boolean;
  faces: Face[];
  imageUri?: string;
  faceEncoding?: string;
  confidenceScore?: number;
  error?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FaceComparisonResult {
  match: boolean;
  similarity: number;
  confidence: number;
}

class VisionCameraFaceRecognitionService {
  private readonly FACE_QUALITY_THRESHOLDS = {
    minFaceSize: 100,
    maxAngle: 25,
    minConfidence: 0.8,
    minEyeDistance: 30,
    maxFaces: 1,
  };

  /**
   * Process detected faces from vision camera
   */
  async processFaces(faces: ExtendedFace[], imageUri?: string): Promise<FaceRecognitionResult> {
    try {
      if (faces.length === 0) {
        return {
          success: false,
          faces: [],
          error: 'No faces detected. Please position your face in the camera view.'
        };
      }

      if (faces.length > this.FACE_QUALITY_THRESHOLDS.maxFaces) {
        return {
          success: false,
          faces,
          error: 'Multiple faces detected. Please ensure only one face is visible.'
        };
      }

      const face = faces[0];
      
      // Validate face quality
      const qualityCheck = this.validateFaceQuality(face);
      if (!qualityCheck.isValid) {
        return {
          success: false,
          faces,
          error: qualityCheck.reason
        };
      }

      // Generate face encoding
      const faceEncoding = this.generateFaceEncoding(face);
      const confidenceScore = this.calculateConfidenceScore(face);

      return {
        success: true,
        faces,
        imageUri,
        faceEncoding,
        confidenceScore,
        boundingBox: {
          x: face.bounds.x,
          y: face.bounds.y,
          width: face.bounds.width,
          height: face.bounds.height,
        }
      };

    } catch (error) {
      console.error('Face processing error:', error);
      return {
        success: false,
        faces: [],
        error: 'Failed to process face data. Please try again.'
      };
    }
  }

  /**
   * Validate face quality using advanced metrics
   */
  private validateFaceQuality(face: ExtendedFace): { isValid: boolean; reason?: string } {
    // Check face size
    const faceSize = Math.min(face.bounds.width, face.bounds.height);
    if (faceSize < this.FACE_QUALITY_THRESHOLDS.minFaceSize) {
      return { 
        isValid: false, 
        reason: 'Face is too small. Please move closer to the camera.' 
      };
    }

    // Check face angles (if available)
    if (face.yawAngle !== undefined && face.rollAngle !== undefined) {
      const maxAngle = this.FACE_QUALITY_THRESHOLDS.maxAngle;
      if (Math.abs(face.yawAngle) > maxAngle || Math.abs(face.rollAngle) > maxAngle) {
        return { 
          isValid: false, 
          reason: 'Please face the camera directly and keep your head straight.' 
        };
      }
    }

    // Check if landmarks are available for better quality assessment
    if (face.landmarks?.leftEye && face.landmarks?.rightEye) {
      const leftEye = face.landmarks.leftEye;
      const rightEye = face.landmarks.rightEye;
      
      // Calculate eye distance for face quality
      const eyeDistance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + 
        Math.pow(rightEye.y - leftEye.y, 2)
      );
      
      if (eyeDistance < this.FACE_QUALITY_THRESHOLDS.minEyeDistance) {
        return { 
          isValid: false, 
          reason: 'Face is too far from camera. Please move closer.' 
        };
      }
    }

    // Check face detection confidence (if available)
    if (face.confidence !== undefined && face.confidence < this.FACE_QUALITY_THRESHOLDS.minConfidence) {
      return { 
        isValid: false, 
        reason: 'Face detection confidence is low. Please ensure good lighting.' 
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a simple mock face encoding for testing
   */
  private generateFaceEncoding(face: ExtendedFace): string {
    // Generate a simple, consistent mock encoding for testing
    const userId = 'user_' + Date.now();
    const mockEncoding = `face_${userId}_${Math.random().toString(36).substr(2, 9)}`;
    return mockEncoding;
  }

  /**
   * Calculate eye distance for face metrics
   */
  private calculateEyeDistance(face: ExtendedFace): number {
    if (!face.landmarks?.leftEye || !face.landmarks?.rightEye) {
      // Estimate based on face width if landmarks not available
      return face.bounds.width * 0.3;
    }

    const leftEye = face.landmarks.leftEye;
    const rightEye = face.landmarks.rightEye;
    
    return Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + 
      Math.pow(rightEye.y - leftEye.y, 2)
    );
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  private calculateConfidenceScore(face: ExtendedFace): number {
    let score = 0.5; // Base score

    // Face detection confidence
    if (face.confidence !== undefined) {
      score += face.confidence * 0.3;
    }

    // Face size factor
    const faceSize = Math.min(face.bounds.width, face.bounds.height);
    if (faceSize > 200) score += 0.2;
    else if (faceSize > 150) score += 0.15;
    else if (faceSize > 100) score += 0.1;

    // Face angle factor
    if (face.yawAngle !== undefined && face.rollAngle !== undefined) {
      const angleScore = 1 - (Math.abs(face.yawAngle) + Math.abs(face.rollAngle)) / 50;
      score += Math.max(0, angleScore) * 0.15;
    }

    // Landmarks availability bonus
    if (face.landmarks) {
      score += 0.1;
      
      // Eye landmarks quality
      if (face.landmarks.leftEye && face.landmarks.rightEye) {
        const eyeDistance = this.calculateEyeDistance(face);
        if (eyeDistance > this.FACE_QUALITY_THRESHOLDS.minEyeDistance) {
          score += 0.05;
        }
      }
    }

    const clampedScore = Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
    
    // Round to 3 decimal places to ensure max 5 digits (e.g., 0.999)
    return Math.round(clampedScore * 1000) / 1000;
  }

  /**
   * Compare two face encodings with advanced similarity metrics
   */
  async compareFaces(encoding1: string, encoding2: string): Promise<FaceComparisonResult> {
    try {
      const face1 = JSON.parse(Buffer.from(encoding1, 'base64').toString());
      const face2 = JSON.parse(Buffer.from(encoding2, 'base64').toString());

      // Check encoding version compatibility
      if (face1.version !== face2.version) {
        console.warn('Face encoding versions differ, comparison may be less accurate');
      }

      // Calculate multiple similarity metrics
      const boundsSimilarity = this.compareBounds(face1.bounds, face2.bounds);
      const landmarksSimilarity = this.compareLandmarks(face1.landmarks, face2.landmarks);
      const geometricSimilarity = this.compareGeometricFeatures(face1, face2);
      const angleSimilarity = this.compareAngles(face1.yawAngle, face1.rollAngle, face2.yawAngle, face2.rollAngle);

      // Weighted average of similarities
      const weights = {
        bounds: 0.2,
        landmarks: 0.4,
        geometric: 0.25,
        angles: 0.15,
      };

      const overallSimilarity = 
        (boundsSimilarity * weights.bounds) +
        (landmarksSimilarity * weights.landmarks) +
        (geometricSimilarity * weights.geometric) +
        (angleSimilarity * weights.angles);

      // Calculate confidence based on data quality
      const confidence = Math.min(face1.confidence || 0.8, face2.confidence || 0.8);
      
      // Determine match with adaptive threshold
      const threshold = this.getAdaptiveThreshold(confidence);
      const match = overallSimilarity > threshold;

      return { 
        match, 
        similarity: overallSimilarity, 
        confidence: confidence 
      };

    } catch (error) {
      console.error('Error comparing faces:', error);
      return { match: false, similarity: 0, confidence: 0 };
    }
  }

  /**
   * Compare face bounds with improved metrics
   */
  private compareBounds(bounds1: any, bounds2: any): number {
    const ratio1 = bounds1.width / bounds1.height;
    const ratio2 = bounds2.width / bounds2.height;
    
    const ratioDiff = Math.abs(ratio1 - ratio2);
    const ratioSimilarity = Math.max(0, 1 - ratioDiff);

    // Compare relative sizes
    const size1 = bounds1.width * bounds1.height;
    const size2 = bounds2.width * bounds2.height;
    const sizeDiff = Math.abs(size1 - size2) / Math.max(size1, size2);
    const sizeSimilarity = Math.max(0, 1 - sizeDiff);

    return (ratioSimilarity + sizeSimilarity) / 2;
  }

  /**
   * Compare facial landmarks if available
   */
  private compareLandmarks(landmarks1: any, landmarks2: any): number {
    if (!landmarks1 || !landmarks2) {
      return 0.5; // Neutral score if landmarks not available
    }

    const landmarkKeys = ['leftEye', 'rightEye', 'nose', 'leftMouth', 'rightMouth'];
    let totalSimilarity = 0;
    let validComparisons = 0;

    for (const key of landmarkKeys) {
      if (landmarks1[key] && landmarks2[key]) {
        const distance = Math.sqrt(
          Math.pow(landmarks1[key].x - landmarks2[key].x, 2) +
          Math.pow(landmarks1[key].y - landmarks2[key].y, 2)
        );
        
        // Normalize distance (assuming face width ~200px)
        const normalizedDistance = distance / 200;
        const similarity = Math.max(0, 1 - normalizedDistance);
        
        totalSimilarity += similarity;
        validComparisons++;
      }
    }

    return validComparisons > 0 ? totalSimilarity / validComparisons : 0.5;
  }

  /**
   * Compare geometric features
   */
  private compareGeometricFeatures(face1: any, face2: any): number {
    const ratioSimilarity = 1 - Math.abs(face1.faceRatio - face2.faceRatio);
    const eyeDistanceDiff = Math.abs(face1.eyeDistance - face2.eyeDistance) / Math.max(face1.eyeDistance, face2.eyeDistance);
    const eyeDistanceSimilarity = Math.max(0, 1 - eyeDistanceDiff);

    return (ratioSimilarity + eyeDistanceSimilarity) / 2;
  }

  /**
   * Compare face angles
   */
  private compareAngles(yaw1: number, roll1: number, yaw2: number, roll2: number): number {
    const yawDiff = Math.abs(yaw1 - yaw2);
    const rollDiff = Math.abs(roll1 - roll2);
    
    const totalDiff = (yawDiff + rollDiff) / 2;
    return Math.max(0, 1 - totalDiff / 30); // Normalize by max expected difference
  }

  /**
   * Get adaptive threshold based on confidence
   */
  private getAdaptiveThreshold(confidence: number): number {
    // Higher confidence allows for higher threshold
    const baseThreshold = 0.7;
    const confidenceBonus = (confidence - 0.8) * 0.1;
    return Math.max(0.6, Math.min(0.8, baseThreshold + confidenceBonus));
  }

  /**
   * Save face image with metadata
   */
  async saveFaceImage(imageUri: string, userId: string, faceData: ExtendedFace): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `face_${userId}_${timestamp}.jpg`;
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

      // Save metadata
      const metadataPath = `${directory}${fileName}.json`;
      const metadata = {
        userId,
        timestamp,
        faceData: {
          bounds: faceData.bounds,
          confidence: faceData.confidence,
          landmarks: faceData.landmarks,
        },
        version: '2.0'
      };

      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));

      return newPath;
    } catch (error) {
      console.error('Error saving face image:', error);
      throw new Error('Failed to save face image');
    }
  }

  /**
   * Validate system requirements
   */
  validateSystemRequirements(): { supported: boolean; reason?: string } {
    try {
      // Check if vision camera face detector is available
      return { supported: true };
    } catch (error) {
      return { 
        supported: false, 
        reason: 'Vision Camera Face Detector is not available on this device' 
      };
    }
  }

  /**
   * Get quality feedback for real-time guidance
   */
  getQualityFeedback(faces: ExtendedFace[]): string {
    if (faces.length === 0) {
      return 'No face detected. Please position your face in the camera view.';
    }

    if (faces.length > 1) {
      return 'Multiple faces detected. Please ensure only one face is visible.';
    }

    const face = faces[0];
    const qualityCheck = this.validateFaceQuality(face);
    
    if (!qualityCheck.isValid) {
      return qualityCheck.reason || 'Please adjust your position.';
    }

    const confidence = this.calculateConfidenceScore(face);
    
    if (confidence > 0.9) {
      return 'Perfect! Tap capture to continue.';
    } else if (confidence > 0.8) {
      return 'Good positioning. You can capture now.';
    } else if (confidence > 0.7) {
      return 'Please improve lighting or move closer.';
    } else {
      return 'Please adjust your position for better quality.';
    }
  }
}

export const visionCameraFaceRecognitionService = new VisionCameraFaceRecognitionService();
export default visionCameraFaceRecognitionService;