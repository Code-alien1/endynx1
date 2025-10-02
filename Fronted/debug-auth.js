// Debug script to check authentication status
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkAuthDebug = async () => {
  console.log('=== AUTH DEBUG ===');
  
  // Check stored tokens
  const authToken = await AsyncStorage.getItem('auth_token');
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  
  console.log('Auth Token exists:', !!authToken);
  console.log('Refresh Token exists:', !!refreshToken);
  
  if (authToken) {
    console.log('Auth Token (first 20 chars):', authToken.substring(0, 20) + '...');
    
    // Try to decode JWT payload (if it's a JWT)
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
      console.log('Token expired?', Date.now() > payload.exp * 1000);
    } catch (e) {
      console.log('Token is not a valid JWT or cannot decode');
    }
  }
  
  // Test API call with current token
  try {
    const response = await fetch('http://192.168.2.33:8000/api/users/profile/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Profile API Status:', response.status);
    console.log('Profile API Response:', await response.text());
  } catch (error) {
    console.log('Profile API Error:', error.message);
  }
};

// Export for use in components
export { checkAuthDebug };
