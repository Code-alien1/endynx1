import base64
import requests
import json
from typing import Dict, Optional, Tuple
from django.conf import settings
import boto3
from azure.cognitiveservices.vision.face import FaceClient
from azure.cognitiveservices.vision.face.models import TrainingStatusType, Person
from msrest.authentication import CognitiveServicesCredentials

class ExternalFaceRecognitionService:
    """Service for integrating with external face recognition APIs"""
    
    def __init__(self):
        self.aws_client = None
        self.azure_client = None
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize API clients"""
        # AWS Rekognition
        if hasattr(settings, 'AWS_ACCESS_KEY_ID'):
            self.aws_client = boto3.client(
                'rekognition',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
        
        # Azure Face API
        if hasattr(settings, 'AZURE_FACE_API_KEY'):
            self.azure_client = FaceClient(
                settings.AZURE_FACE_ENDPOINT,
                CognitiveServicesCredentials(settings.AZURE_FACE_API_KEY)
            )
    
    def aws_compare_faces(self, source_image: str, target_image: str) -> Tuple[bool, float]:
        """
        Compare faces using AWS Rekognition
        Args:
            source_image: Base64 encoded image
            target_image: Base64 encoded image
        Returns:
            (is_match, confidence_score)
        """
        if not self.aws_client:
            raise Exception("AWS Rekognition not configured")
        
        try:
            source_bytes = base64.b64decode(source_image)
            target_bytes = base64.b64decode(target_image)
            
            response = self.aws_client.compare_faces(
                SourceImage={'Bytes': source_bytes},
                TargetImage={'Bytes': target_bytes},
                SimilarityThreshold=70
            )
            
            if response['FaceMatches']:
                confidence = response['FaceMatches'][0]['Similarity']
                return True, confidence
            
            return False, 0.0
            
        except Exception as e:
            print(f"AWS face comparison error: {e}")
            return False, 0.0
    
    def azure_compare_faces(self, source_image: str, target_image: str) -> Tuple[bool, float]:
        """
        Compare faces using Azure Face API
        Args:
            source_image: Base64 encoded image
            target_image: Base64 encoded image
        Returns:
            (is_match, confidence_score)
        """
        if not self.azure_client:
            raise Exception("Azure Face API not configured")
        
        try:
            source_bytes = base64.b64decode(source_image)
            target_bytes = base64.b64decode(target_image)
            
            # Detect faces in both images
            source_faces = self.azure_client.face.detect_with_stream(
                source_bytes,
                recognition_model='recognition_04',
                detection_model='detection_03'
            )
            
            target_faces = self.azure_client.face.detect_with_stream(
                target_bytes,
                recognition_model='recognition_04',
                detection_model='detection_03'
            )
            
            if not source_faces or not target_faces:
                return False, 0.0
            
            # Compare the first face from each image
            verify_result = self.azure_client.face.verify_face_to_face(
                source_faces[0].face_id,
                target_faces[0].face_id
            )
            
            return verify_result.is_identical, verify_result.confidence * 100
            
        except Exception as e:
            print(f"Azure face comparison error: {e}")
            return False, 0.0
    
    def google_compare_faces(self, source_image: str, target_image: str) -> Tuple[bool, float]:
        """
        Compare faces using Google Cloud Vision API
        Args:
            source_image: Base64 encoded image
            target_image: Base64 encoded image
        Returns:
            (is_match, confidence_score)
        """
        try:
            from google.cloud import vision
            
            client = vision.ImageAnnotatorClient()
            
            # Detect faces in source image
            source_image_obj = vision.Image(content=base64.b64decode(source_image))
            source_response = client.face_detection(image=source_image_obj)
            source_faces = source_response.face_annotations
            
            # Detect faces in target image
            target_image_obj = vision.Image(content=base64.b64decode(target_image))
            target_response = client.face_detection(image=target_image_obj)
            target_faces = target_response.face_annotations
            
            if not source_faces or not target_faces:
                return False, 0.0
            
            # Simple comparison based on face landmarks
            # Note: Google Vision doesn't provide direct face comparison
            # You would need to implement your own comparison logic
            # or use additional services
            
            confidence = self._compare_face_landmarks(source_faces[0], target_faces[0])
            is_match = confidence > 75  # Threshold
            
            return is_match, confidence
            
        except Exception as e:
            print(f"Google face comparison error: {e}")
            return False, 0.0
    
    def _compare_face_landmarks(self, face1, face2) -> float:
        """
        Simple landmark-based face comparison
        This is a basic implementation - you might want to use more sophisticated methods
        """
        # This is a simplified comparison - implement your own logic
        # based on facial landmarks, features, etc.
        return 80.0  # Placeholder
    
    def multi_api_face_recognition(self, source_image: str, target_image: str) -> Dict:
        """
        Use multiple APIs for face recognition with fallback
        Returns the best result from available APIs
        """
        results = []
        
        # Try AWS Rekognition
        try:
            is_match, confidence = self.aws_compare_faces(source_image, target_image)
            results.append({
                'api': 'aws',
                'is_match': is_match,
                'confidence': confidence,
                'success': True
            })
        except Exception as e:
            results.append({
                'api': 'aws',
                'success': False,
                'error': str(e)
            })
        
        # Try Azure Face API
        try:
            is_match, confidence = self.azure_compare_faces(source_image, target_image)
            results.append({
                'api': 'azure',
                'is_match': is_match,
                'confidence': confidence,
                'success': True
            })
        except Exception as e:
            results.append({
                'api': 'azure',
                'success': False,
                'error': str(e)
            })
        
        # Try Google Cloud Vision
        try:
            is_match, confidence = self.google_compare_faces(source_image, target_image)
            results.append({
                'api': 'google',
                'is_match': is_match,
                'confidence': confidence,
                'success': True
            })
        except Exception as e:
            results.append({
                'api': 'google',
                'success': False,
                'error': str(e)
            })
        
        # Return the best result
        successful_results = [r for r in results if r.get('success')]
        if successful_results:
            # Use the result with highest confidence
            best_result = max(successful_results, key=lambda x: x.get('confidence', 0))
            return {
                'success': True,
                'is_match': best_result['is_match'],
                'confidence': best_result['confidence'],
                'api_used': best_result['api'],
                'all_results': results
            }
        
        return {
            'success': False,
            'error': 'All face recognition APIs failed',
            'all_results': results
        }
