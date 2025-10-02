import math
from typing import Tuple, Optional
from django.conf import settings
import requests

class GeolocationService:
    """Service for handling geolocation operations"""
    
    @classmethod
    def get_school_coordinates(cls):
        """Get school coordinates from Django settings"""
        return getattr(settings, 'SCHOOL_LOCATION', {
            'latitude': 33.5731,
            'longitude': -7.5898,
            'radius_meters': 500,
            'name': 'Default School'
        })
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the distance between two points on Earth using Haversine formula
        Returns distance in meters
        """
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) * math.sin(delta_lat / 2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) * math.sin(delta_lon / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @classmethod
    def is_within_school_radius(cls, latitude: float, longitude: float) -> Tuple[bool, float]:
        """
        Check if given coordinates are within school radius
        Returns (is_within_radius, distance_from_school)
        """
        school_coords = cls.get_school_coordinates()
        school_lat = school_coords['latitude']
        school_lon = school_coords['longitude']
        radius = school_coords['radius_meters']
        
        distance = cls.calculate_distance(latitude, longitude, school_lat, school_lon)
        is_within = distance <= radius
        
        return is_within, distance
    
    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
        """
        Get address from coordinates using a geocoding service
        You can use Google Maps API, OpenStreetMap Nominatim, etc.
        """
        try:
            # Example using OpenStreetMap Nominatim (free)
            url = f"https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json',
                'addressdetails': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get('display_name', 'Unknown location')
            
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
        
        return None
    
    @classmethod
    def validate_attendance_location(cls, latitude: float, longitude: float) -> dict:
        """
        Validate if location is suitable for attendance marking
        """
        is_within, distance = cls.is_within_school_radius(latitude, longitude)
        address = cls.reverse_geocode(latitude, longitude)
        
        school_coords = cls.get_school_coordinates()
        return {
            'is_valid': is_within,
            'distance_from_school': round(distance, 2),
            'address': address,
            'school_radius': school_coords['radius_meters']
        }
