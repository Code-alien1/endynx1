import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DottedGridBackgroundProps {
  children?: React.ReactNode;
  style?: any;
  dotSize?: number;
  dotSpacing?: number;
  dotColor?: string;
  dotOpacity?: number;
}

export default function DottedGridBackground({
  children,
  style,
  dotSize = 1,
  dotSpacing = 20,
  dotColor = '#2ecc71',
  dotOpacity = 0.15,
}: DottedGridBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Dark Green/Black Gradient Background */}
      <LinearGradient
        colors={[
          '#0d1e1e', // Dark green-black
          '#1a2e2e', // Slightly lighter dark green
          '#0f2419', // Deep forest green
          '#0a1a0a', // Very dark green-black
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      />
      
      {/* Subtle Dotted Grid Pattern Overlay */}
      <View style={styles.patternContainer}>
        <Svg
          width={screenWidth}
          height={screenHeight}
          style={styles.svgPattern}
        >
          <Defs>
            <Pattern
              id="dotGrid"
              patternUnits="userSpaceOnUse"
              width={dotSpacing}
              height={dotSpacing}
            >
              <Circle
                cx={dotSpacing / 2}
                cy={dotSpacing / 2}
                r={dotSize}
                fill={dotColor}
                opacity={dotOpacity}
              />
            </Pattern>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill="url(#dotGrid)"
          />
        </Svg>
      </View>

      {/* Content */}
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});