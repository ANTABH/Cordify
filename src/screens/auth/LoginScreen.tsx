import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';

export const LoginScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const role = (route.params as any)?.role || 'client';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const sportTheme = role === 'client' ? 'badminton' : 'tennis';
  const roleName = role === 'client' ? 'Joueur' : 'Cordeur';

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    let result;

    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { role } } 
      });
    }

    setLoading(false);

    if (result.error) {
      Alert.alert('Erreur technique', result.error.message);
    } else {
      // Pour la phase MVP, afficher un succès
      Alert.alert('Succès', 'Connecté avec succès !');
      // Plus tard: redirection vers HomeScreen
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Bon retour' : 'Créer un compte'}
          </Text>
          <Text style={styles.subtitle}>Espace {roleName}</Text>
        </View>

        <View style={styles.formCard}>
          <Input 
            label="Adresse Email"
            placeholder="jean.dupont@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input 
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button 
            title={isLogin ? "Se connecter" : "S'inscrire"} 
            sportTheme={sportTheme}
            onPress={handleAuth}
            loading={loading}
          />

          <Button 
            title={isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"} 
            variant="outline"
            sportTheme={sportTheme}
            onPress={() => setIsLogin(!isLogin)}
            style={{ marginTop: theme.spacing.sm, borderWidth: 0 }}
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
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.container,
    ...theme.shadows.soft,
  }
});
