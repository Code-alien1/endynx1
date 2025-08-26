import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, theme } from './constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ThemePreview() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edynx Theme Preview</Text>
        <Text style={styles.subtitle}>Modern Dark Theme with HSL Colors</Text>

        {/* Color Palette Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Palette</Text>
          
          <View style={styles.colorGrid}>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.colorLabel}>Primary</Text>
              <Text style={styles.colorValue}>{COLORS.primary}</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.colorLabel}>Secondary</Text>
              <Text style={styles.colorValue}>{COLORS.secondary}</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.colorLabel}>Accent</Text>
              <Text style={styles.colorValue}>{COLORS.accent}</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.background }]} />
              <Text style={styles.colorLabel}>Background</Text>
              <Text style={styles.colorValue}>{COLORS.background}</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.card }]} />
              <Text style={styles.colorLabel}>Card</Text>
              <Text style={styles.colorValue}>{COLORS.card}</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: COLORS.destructive }]} />
              <Text style={styles.colorLabel}>Destructive</Text>
              <Text style={styles.colorValue}>{COLORS.destructive}</Text>
            </View>
          </View>
        </View>

        {/* Components Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UI Components</Text>
          
          {/* Buttons */}
          <View style={styles.componentGroup}>
            <Text style={styles.componentTitle}>Buttons</Text>
            
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS["primary-foreground"]} />
              <Text style={styles.primaryButtonText}>Primary Button</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="star" size={20} color={COLORS["secondary-foreground"]} />
              <Text style={styles.secondaryButtonText}>Secondary Button</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.destructiveButton}>
              <Ionicons name="trash" size={20} color={COLORS["destructive-foreground"]} />
              <Text style={styles.destructiveButtonText}>Destructive Button</Text>
            </TouchableOpacity>
          </View>

          {/* Cards */}
          <View style={styles.componentGroup}>
            <Text style={styles.componentTitle}>Cards</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={24} color={COLORS.primary} />
                <Text style={styles.cardTitle}>User Profile</Text>
              </View>
              <Text style={styles.cardContent}>
                This is a sample card using the theme colors. It demonstrates how the card background and text colors work together.
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardButtonSecondary}>
                  <Text style={styles.cardButtonSecondaryText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Border Radius Examples */}
          <View style={styles.componentGroup}>
            <Text style={styles.componentTitle}>Border Radius</Text>
            
            <View style={styles.radiusGrid}>
              <View style={[styles.radiusItem, { borderRadius: theme.borderRadius.sm }]}>
                <Text style={styles.radiusLabel}>Small ({theme.borderRadius.sm}px)</Text>
              </View>
              <View style={[styles.radiusItem, { borderRadius: theme.borderRadius.md }]}>
                <Text style={styles.radiusLabel}>Medium ({theme.borderRadius.md}px)</Text>
              </View>
              <View style={[styles.radiusItem, { borderRadius: theme.borderRadius.lg }]}>
                <Text style={styles.radiusLabel}>Large ({theme.borderRadius.lg}px)</Text>
              </View>
              <View style={[styles.radiusItem, { borderRadius: theme.borderRadius.xl }]}>
                <Text style={styles.radiusLabel}>XL ({theme.borderRadius.xl}px)</Text>
              </View>
            </View>
          </View>

          {/* Typography */}
          <View style={styles.componentGroup}>
            <Text style={styles.componentTitle}>Typography</Text>
            
            <Text style={[styles.typographyExample, styles.orbitronFont]}>
              Orbitron Font - {theme.fontFamily.orbitron}
            </Text>
            <Text style={[styles.typographyExample, styles.robotoFont]}>
              Roboto Font - {theme.fontFamily.roboto}
            </Text>
          </View>
        </View>

        {/* Theme Usage Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Usage</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to use this theme:</Text>
            <Text style={styles.infoText}>• Import COLORS for backward compatibility</Text>
            <Text style={styles.infoText}>• Import theme object for new components</Text>
            <Text style={styles.infoText}>• Use HSL color values for better control</Text>
            <Text style={styles.infoText}>• Consistent border radius and typography</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS["muted-foreground"],
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  colorValue: {
    fontSize: 12,
    color: COLORS["muted-foreground"],
    textAlign: 'center',
  },
  componentGroup: {
    marginBottom: 30,
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    marginBottom: 10,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS["primary-foreground"],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    marginBottom: 10,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS["secondary-foreground"],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  destructiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.destructive,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    marginBottom: 10,
    justifyContent: 'center',
  },
  destructiveButtonText: {
    color: COLORS["destructive-foreground"],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS["card-border"],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS["card-foreground"],
    marginLeft: 12,
  },
  cardContent: {
    fontSize: 14,
    color: COLORS["muted-foreground"],
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 8,
  },
  cardButtonText: {
    color: COLORS["primary-foreground"],
    fontSize: 14,
    fontWeight: '600',
  },
  cardButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 8,
  },
  cardButtonSecondaryText: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  radiusItem: {
    width: '48%',
    backgroundColor: COLORS.muted,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  radiusLabel: {
    color: COLORS.foreground,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  typographyExample: {
    fontSize: 18,
    color: COLORS.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  orbitronFont: {
    fontFamily: theme.fontFamily.orbitron,
  },
  robotoFont: {
    fontFamily: theme.fontFamily.roboto,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: theme.borderRadius.md,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS["card-border"],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS["muted-foreground"],
    marginBottom: 6,
    lineHeight: 20,
  },
});