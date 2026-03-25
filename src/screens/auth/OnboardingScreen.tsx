import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Trophy } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Dynamic decorative background blobs */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blobTennis]} />
        <View style={[styles.blob, styles.blobBadminton]} />
      </View>

      <BlurView intensity={60} tint="light" style={styles.blurContainer}>

        <Animated.View style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.logoContainer}>
            <Trophy color={theme.colors.badmintonPrimary} size={48} strokeWidth={2.5} />
            <Text style={styles.logo}>CORDIFY</Text>
          </View>
          <Text style={styles.subtitle}>Trouve ton cordeur,{'\n'}corde ta victoire.</Text>
        </Animated.View>

        <Animated.View style={[
          styles.bottomSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Comment souhaitez-vous{'\n'}utiliser l'application ?</Text>

            <View style={styles.buttonGroup}>
              <Button
                title="Je suis un Joueur"
                sportTheme="badminton"
                onPress={() => navigation.navigate('Login', { role: 'client' })}
              />
              <Button
                title="Je suis un Cordeur"
                variant="outline"
                sportTheme="tennis"
                onPress={() => navigation.navigate('Login', { role: 'stringer' })}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundBlobs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  blob: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    opacity: 0.2, // More subtle
  },
  blobBadminton: {
    backgroundColor: theme.colors.badmintonPrimary,
    top: -width * 0.4,
    right: -width * 0.6,
  },
  blobTennis: {
    backgroundColor: theme.colors.tennisPrimary,
    bottom: -width * 0.4,
    left: -width * 0.6,
  },
  blurContainer: {
    flex: 1,
    paddingTop: height * 0.1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logo: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 42,
    color: theme.colors.textPrimary,
    letterSpacing: -1.5,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.borderRadius.container,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...theme.shadows.elevated,
  },
  cardTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 26,
  },
  buttonGroup: {
    gap: 4,
  }
});
