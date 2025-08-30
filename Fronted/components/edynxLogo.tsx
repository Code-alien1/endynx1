import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface EdynxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  style?: object;
  shouldSpin?: boolean; // New prop to control spinning
}

const EdynxLogo: React.FC<EdynxLogoProps> = ({ size = 'md', style, shouldSpin = false }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  // Explicitly type the animation ref to avoid TS inferring 'never'
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    // Clean up any existing animation first
    if (animation.current) {
      animation.current.stop();
      animation.current = null;
      isAnimating.current = false;
    }

    if (shouldSpin && !isAnimating.current) {
      // Reset the spin value to 0 before starting
      spinValue.setValue(0);
      
      animation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000, // 2 seconds for a full rotation
          useNativeDriver: true,
        }),
        { iterations: -1 } // Explicitly set infinite iterations
      );
      
      isAnimating.current = true;
      animation.current.start();
    } else if (!shouldSpin) {
      // Stop the animation and reset position
      if (animation.current) {
        animation.current.stop();
        animation.current = null;
      }
      isAnimating.current = false;
      
      // Smoothly animate back to 0 position
      Animated.timing(spinValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup on unmount or when shouldSpin changes
    return () => {
      if (animation.current) {
        animation.current.stop();
        animation.current = null;
      }
      isAnimating.current = false;
    };
  }, [shouldSpin, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sm;
      case 'lg':
        return styles.lg;
      case 'md':
        return styles.md;
      default:
        return styles.md;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.Text style={[styles.logoText, getSizeStyle(), { transform: [{ rotate: spin }] }]}>
        EDYNX
      </Animated.Text>
      <Text style={styles.subtitle}>
        Next Generation School Management
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'hsl(154, 86%, 47%)', // --primary
    textAlign: 'center',
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: 'Orbitron',
  },
  subtitle: {
    fontSize: 14,
    color: 'hsl(200, 10%, 70%)', // --muted-foreground
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  sm: { fontSize: 24 },
  md: { fontSize: 40 },
  lg: { fontSize: 60 },
});

export default EdynxLogo;