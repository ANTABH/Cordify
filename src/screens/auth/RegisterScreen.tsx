import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Wrench, ArrowLeft } from 'lucide-react-native';

type Role = 'client' | 'stringer' | null;

export const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: selectedRole } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Erreur', error.message);
      return;
    }

    // Création automatique du profil dans la base de données
    if (data?.user) {
      const userId = data.user.id;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        role: selectedRole,
        first_name: 'Nouveau',
        last_name: selectedRole === 'client' ? 'Joueur' : 'Cordeur',
        email: email,
      });

      if (selectedRole === 'stringer' && !profileError) {
        await supabase.from('stringer_profiles').insert({
          id: userId,
          type: 'independant',
          description: 'Nouveau cordeur.',
          address: 'Adresse non renseignée',
          sports: ['badminton'],
        });
      }
    }

    setLoading(false);
    // Si succès, l'AuthContext détecte la session et le RootNavigator redirige automatiquement
  };

  // Étape 1 : Choix du rôle
  if (!selectedRole) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Comment souhaitez-vous{'\n'}utiliser Cordify ?
            </Text>
          </View>

          <View style={styles.roleCards}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => setSelectedRole('client')}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: `${theme.colors.badmintonPrimary}18` }]}>
                <User color={theme.colors.badmintonPrimary} size={32} strokeWidth={2} />
              </View>
              <Text style={styles.roleTitle}>Joueur</Text>
              <Text style={styles.roleDescription}>
                Trouvez un cordeur près de chez vous et faites corder vos raquettes facilement.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => setSelectedRole('stringer')}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: `${theme.colors.tennisPrimary}18` }]}>
                <Wrench color={theme.colors.tennisPrimary} size={32} strokeWidth={2} />
              </View>
              <Text style={styles.roleTitle}>Cordeur</Text>
              <Text style={styles.roleDescription}>
                Gérez vos stocks, vos clients et développez votre activité de cordage.
              </Text>
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>
              Déjà un compte ?{' '}
              <Text style={styles.backLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity> */}
        </ScrollView>
      </View>
    );
  }

  // Étape 2 : Formulaire d'inscription
  const isClient = selectedRole === 'client';
  const roleName = isClient ? 'Joueur' : 'Cordeur';
  const sportTheme = isClient ? 'badminton' : 'tennis';
  const accentColor = isClient ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft color={theme.colors.textSecondary} size={20} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Inscription</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.roleBadgeText, { color: accentColor }]}>
              {roleName}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
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
            placeholder="6 caractères minimum"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            icon={Lock}
          />
          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon={Lock}
          />

          <Button
            title="Créer mon compte"
            sportTheme={sportTheme}
            onPress={handleRegister}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  title: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textSecondary,
    lineHeight: 26,
    marginTop: theme.spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.badge,
    marginTop: theme.spacing.xs,
  },
  roleBadgeText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
  },
  roleCards: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  roleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.container,
    padding: theme.spacing.xl,
    ...theme.shadows.soft,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  roleTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  roleDescription: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.container,
    ...theme.shadows.soft,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backLinkText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  backLinkBold: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.badmintonPrimary,
  },
});
