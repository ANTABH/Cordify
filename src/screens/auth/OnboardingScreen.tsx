import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Placeholder premium background (replace with local asset later)
const BACKGROUND_URL = 'https://images.unsplash.com/photo-1622279457486-640ca4a4da40?q=80&w=1000&auto=format&fit=crop';

export const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      {/* Decorative gradient background */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blobTennis]} />
        <View style={[styles.blob, styles.blobBadminton]} />
      </View>
      
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        
        <View style={styles.header}>
          <Text style={styles.logo}>🏸 CORDIFY</Text>
          <Text style={styles.subtitle}>Trouve ton cordeur,{'\n'}corde ta victoire.</Text>
        </View>

        <View style={styles.bottomSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Comment souhaitez-vous{'\n'}utiliser l'application ?</Text>
            
            <Button 
              title="Je suis un Joueur" 
              sportTheme="badminton" 
              onPress={() => navigation.navigate('Login', { role: 'client' })} 
            />
            <Button 
              title="Je suis un Cordeur" 
              sportTheme="tennis" 
              onPress={() => navigation.navigate('Login', { role: 'stringer' })} 
            />
          </LinearGradient>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  backgroundBlobs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    opacity: 0.4,
  },
  blobBadminton: {
    backgroundColor: theme.colors.badmintonPrimary,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  blobTennis: {
    backgroundColor: theme.colors.tennisPrimary,
    bottom: -width * 0.5,
    left: -width * 0.5,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: height * 0.15,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logo: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 42,
    color: theme.colors.textPrimary,
    letterSpacing: -1.5,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.borderRadius.container,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    ...theme.shadows.elevated,
  },
  cardTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 26,
  }
});
