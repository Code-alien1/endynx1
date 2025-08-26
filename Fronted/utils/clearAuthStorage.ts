import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const clearAuthStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    console.log('Authentication storage cleared');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

export const checkStoredTokens = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    console.log('Stored tokens:', { 
      hasToken: !!token, 
      hasRefreshToken: !!refreshToken 
    });
  } catch (error) {
    console.error('Error checking stored tokens:', error);
  }
};
