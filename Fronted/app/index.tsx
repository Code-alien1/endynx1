import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import EdynxLogo from '../components/edynxLogo';
import DottedGridBackground from '../components/DottedGridBackground';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getRoleRoute } = useAuth();

  useEffect(() => {
    console.log('Landing page - Auth state:', { isLoading, isAuthenticated });
    if (!isLoading && isAuthenticated) {
      const target = getRoleRoute();
      console.log('Redirecting authenticated user to:', target);
      router.replace(target);
    } else if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, staying on landing page');
    }
  }, [isAuthenticated, isLoading, router, getRoleRoute]);

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d1e1e" />
      <DottedGridBackground>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <EdynxLogo size="lg" style={styles.logo} />
            <Text style={styles.tagline}>Smart School Management</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to Edynx</Text>
            <Text style={styles.subtitle}>
              The future of education management is here. Experience seamless 
              attendance tracking, parent integration, and comprehensive school 
              administration.
            </Text>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>👨‍👩‍👧‍👦</Text>
                </View>
                <Text style={styles.featureText}>Parent Integration</Text>
              </View>
              
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>📊</Text>
                </View>
                <Text style={styles.featureText}>Smart Attendance</Text>
              </View>
              
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>🎓</Text>
                </View>
                <Text style={styles.featureText}>Mentorship System</Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            
            <Text style={styles.footerText}>
              Secure • Modern • Efficient
            </Text>
          </View>
        </View>
      </DottedGridBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '500',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  ctaSection: {
    alignItems: 'center',
  },
  getStartedButton: {
    width: width - 48,
    height: 56,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
