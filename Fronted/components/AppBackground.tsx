import React from 'react';
import { View, StyleSheet } from 'react-native';
import DottedGridBackground from './DottedGridBackground';

interface AppBackgroundProps {
  children: React.ReactNode;
  showGeometricShapes?: boolean;
}

const AppBackground: React.FC<AppBackgroundProps> = ({ 
  children, 
  showGeometricShapes = false 
}) => {
  return (
    <DottedGridBackground style={styles.container}>
      {showGeometricShapes && (
        <>
          <View style={styles.geometricShape1} />
          <View style={styles.geometricShape2} />
          <View style={styles.geometricShape3} />
          <View style={styles.geometricShape4} />
        </>
      )}
      {children}
    </DottedGridBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  geometricShape1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 8,
    transform: [{ rotate: '15deg' }],
  },
  geometricShape2: {
    position: 'absolute',
    top: '25%',
    right: '15%',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderRadius: 40,
  },
  geometricShape3: {
    position: 'absolute',
    bottom: '20%',
    left: '5%',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(46, 204, 113, 0.06)',
    transform: [{ rotate: '-20deg' }],
  },
  geometricShape4: {
    position: 'absolute',
    bottom: '30%',
    right: '10%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 30,
  },
});

export default AppBackground;