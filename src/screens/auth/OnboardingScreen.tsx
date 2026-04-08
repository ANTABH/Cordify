import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Trophy, Mail, Lock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Erreur de connexion', error.message);
    }
    // Si succès, l'AuthContext détecte la session et le RootNavigator redirige automatiquement
  };

  return (
    <View style={styles.container}>
      {/* Dynamic decorative background blobs */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blobTennis]} />
        <View style={[styles.blob, styles.blobBadminton]} />
      </View>

      <BlurView intensity={60} tint="light" style={styles.blurContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
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
                <Text style={styles.cardTitle}>Connexion</Text>

                <Input
                  label="Adresse Email"
                  placeholder="jean.dupont@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  icon={Mail}
                />
                <Input
                  label="Mot de passe"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  icon={Lock}
                />

                <Button
                  title="Se connecter"
                  sportTheme="badminton"
                  onPress={handleLogin}
                  loading={loading}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerText}>
                    Pas encore de compte ?{' '}
                    <Text style={styles.registerTextBold}>S'inscrire</Text>
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    opacity: 0.2,
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: height * 0.08,
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
    paddingBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.container,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...theme.shadows.elevated,
  },
  cardTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  registerText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  registerTextBold: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.badmintonPrimary,
  },
});
