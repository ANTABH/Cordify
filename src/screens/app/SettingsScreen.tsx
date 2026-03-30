import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { LogOut, ChevronRight, User, Bell, Shield, CircleHelp } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
}

const SettingItem = ({ icon, label, onPress, color = theme.colors.textPrimary }: SettingItemProps) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      {icon}
      <Text style={[styles.settingItemLabel, { color }]}>{label}</Text>
    </View>
    <ChevronRight size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const userRole = session?.user?.user_metadata?.role || 'client';

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.profileName}>Jean Dupont</Text>
          <Text style={styles.profileRole}>{userRole === 'client' ? 'Joueur' : 'Cordeur'}</Text>
          <Text style={styles.profileEmail}>{session?.user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.settingsGroup}>
            <SettingItem 
              icon={<User size={20} color={theme.colors.textPrimary} />} 
              label="Informations personnelles" 
              onPress={() => {}} 
            />
            <SettingItem 
              icon={<Bell size={20} color={theme.colors.textPrimary} />} 
              label="Notifications" 
              onPress={() => {}} 
            />
            <SettingItem 
              icon={<Shield size={20} color={theme.colors.textPrimary} />} 
              label="Confidentialité et sécurité" 
              onPress={() => {}} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            <SettingItem 
              icon={<CircleHelp size={20} color={theme.colors.textPrimary} />} 
              label="Aide et contact" 
              onPress={() => {}} 
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.alert} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.badmintonPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.surface,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 32,
  },
  profileName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  profileRole: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.badmintonPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  settingsGroup: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.container,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  settingItemLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.container,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.soft,
  },
  logoutText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.alert,
  },
  versionText: {
    textAlign: 'center',
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  }
});
