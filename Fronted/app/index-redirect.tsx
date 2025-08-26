import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, Text } from 'react-native';

export default function TabsIndex() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // All roles redirect to settings since other tabs were removed
      router.replace('/(tabs)/setting' as any);
    }
  }, [user, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}
