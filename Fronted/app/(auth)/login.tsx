import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Ionicons';
import EdynxLogo from '../../components/edynxLogo';
import ExpoCameraFaceAuth from '../../components/ExpoCameraFaceAuth';
import DottedGridBackground from '../../components/DottedGridBackground';
import RoleSelector from '../../components/RoleSelector';
import { styles } from '../../styles/auth.styles';
import { useRouter } from "expo-router";
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  
  const router = useRouter();
  const { login, register, user, getRoleRoute } = useAuth();

  const handleFaceIdLogin = async () => {
    setShowFaceAuth(true);
  };

  const handleFaceAuthSuccess = (userData?: any) => {
    router.push("/(tabs)");
  };

  const handleFaceAuthFallback = () => {
    setShowFaceAuth(false);
    // User will continue with email login
  };

  const handleShowFaceRegistration = () => {
    setShowFaceRegistration(true);
  };

  const handleFaceRegistrationSuccess = (userData?: any) => {
    Alert.alert(
      'Face Registration Complete!',
      'You can now use face recognition for quick login and attendance.',
      [{ text: 'Great!' }]
    );
  };

  const handleEmailLogin = async () => {
    if (!loginData.email || !loginData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(loginData);
      router.push("/(tabs)");
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!loginData.email || !loginData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For registration, we need more fields
    // This is a simplified version - you might want to create a separate registration screen
    const registerData = {
      email: loginData.email,
      username: loginData.email.split('@')[0], // Simple username generation
      password: loginData.password,
      password_confirm: loginData.password,
      first_name: 'Test',
      last_name: 'User',
      role: selectedRole, // Use selected role
      phone_number: '', // Optional field
      student_id: `STU${Date.now().toString().slice(-6)}`, // Generate unique student ID
      level: 1, // Default level for students
      class_name: 'General', // Default class
    };

    try {
      setIsLoading(true);
      await register(registerData);
      router.push("/(tabs)");
    } catch (error) {
      console.error('Registration failed:', error);
      // Error is already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleRegister();
    } else {
      handleEmailLogin();
    }
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <DottedGridBackground>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <EdynxLogo size="lg" style={styles.logoContainer} />

          <View style={styles.loginContainer}>
            <Text style={styles.loginTitle}>
              {isSignUp ? 'Create Account' : 'Secure Login'}
            </Text>
            <Text style={styles.loginSubtitle}>
              {isSignUp ? 'Join Edynx School Management' : 'Use Face ID for instant access'}
            </Text>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.faceIdButton}
                onPress={handleFaceIdLogin}
                disabled={isLoading}
              >
                <Icon name="finger-print" size={24} color="#fff" />
                <Text style={styles.faceIdText}>
                  {isLoading ? 'Processing...' : 'Login with Face ID'}
                </Text>
              </TouchableOpacity>
            )}

            {!isSignUp && (
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>
            )}

            {/* Role Selection for Sign Up */}
            {isSignUp && (
              <RoleSelector
                selectedRole={selectedRole}
                onRoleSelect={setSelectedRole}
              />
            )}

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#B0B0C0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="hsl(200, 10%, 70%)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={loginData.email}
                onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                editable={!isLoading}
              />
            </View>

            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#B0B0C0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="hsl(200, 10%, 70%)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={loginData.password}
                onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#B0B0C0"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signInText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSwitchMode} 
              style={{ marginTop: 16, alignSelf: 'center' }}
              disabled={isLoading}
            >
              <Text style={styles.signingText}>
                {isSignUp 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>

            {/* Face Registration Option for logged in users */}
            {user && (
              <TouchableOpacity 
                onPress={handleShowFaceRegistration} 
                style={{ marginTop: 16, alignSelf: 'center' }}
              >
                <Text style={styles.signingText}>
                  Register Face Recognition
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.footerText}>Secure • Modern • Efficient</Text>
          </ScrollView>
        </DottedGridBackground>
      </KeyboardAvoidingView>

      {/* Expo Camera Face Authentication Modal */}
      <ExpoCameraFaceAuth
        visible={showFaceAuth}
        onClose={() => setShowFaceAuth(false)}
        onSuccess={handleFaceAuthSuccess}
        mode="login"
        title="Face Authentication"
        subtitle="Use your camera to authenticate with face recognition"
      />

      {/* Expo Camera Face Registration Modal */}
      <ExpoCameraFaceAuth
        visible={showFaceRegistration}
        onClose={() => setShowFaceRegistration(false)}
        onSuccess={handleFaceRegistrationSuccess}
        mode="register"
        title="Face Registration"
        subtitle="Register your face for secure authentication"
      />
    </>
  );
}