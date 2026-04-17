import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { LogOut, ChevronRight, User, Bell, Shield, CircleHelp, Palette, Moon, Sun, Monitor, Smartphone, Dumbbell } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  color?: string;
  rightElement?: React.ReactNode;
}

const SettingItem = ({ icon, label, onPress, color, rightElement }: SettingItemProps) => {
  const { theme } = useTheme();
  const textColor = color || theme.colors.textPrimary;

  const content = (
    <View style={styles(theme).settingItem}>
      <View style={styles(theme).settingItemLeft}>
        {icon}
        <Text style={[styles(theme).settingItemLabel, { color: textColor }]}>{label}</Text>
      </View>
      {rightElement || <ChevronRight size={20} color={theme.colors.textSecondary} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const SettingsScreen = () => {
  const { session, userRole } = useAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const themedStyles = styles(theme);

  return (
    <SafeAreaView style={themedStyles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={themedStyles.scrollContent}>

        <View style={themedStyles.profileSection}>
          <View style={[themedStyles.avatarPlaceholder, { backgroundColor: userRole === 'stringer' ? theme.colors.tennisPrimary : theme.colors.badmintonPrimary }]}>
            <Text style={themedStyles.avatarText}>{session?.user?.email?.substring(0, 2).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={themedStyles.profileName}>Utilisateur Cordify</Text>
          <Text style={[themedStyles.profileRole, { color: userRole === 'stringer' ? theme.colors.tennisPrimary : theme.colors.badmintonPrimary }]}>
            {userRole === 'client' ? 'Joueur' : 'Cordeur'}
          </Text>
          <Text style={themedStyles.profileEmail}>{session?.user?.email}</Text>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Compte</Text>
          <View style={themedStyles.settingsGroup}>
            <SettingItem
              icon={<User size={20} color={theme.colors.textPrimary} />}
              label="Informations personnelles"
              onPress={() => { }}
            />
            {userRole === 'client' && (
              <SettingItem
                icon={<Dumbbell size={20} color={theme.colors.textPrimary} />}
                label="Mes raquettes"
                onPress={() => navigation.navigate('Rackets')}
              />
            )}
            <SettingItem
              icon={<Bell size={20} color={theme.colors.textPrimary} />}
              label="Notifications"
              onPress={() => { }}
            />
            <SettingItem
              icon={<Shield size={20} color={theme.colors.textPrimary} />}
              label="Confidentialité et sécurité"
              onPress={() => { }}
            />
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Apparence</Text>
          <View style={themedStyles.settingsGroup}>
            <View style={themedStyles.pickerContainer}>
              <View style={themedStyles.settingItemLeft}>
                {themeMode === 'light' ? <Sun size={20} color={theme.colors.textPrimary} /> :
                  themeMode === 'dark' ? <Moon size={20} color={theme.colors.textPrimary} /> :
                    <Smartphone size={20} color={theme.colors.textPrimary} />}
                <Text style={themedStyles.settingItemLabel}>Mode d'affichage</Text>
              </View>
              <Picker
                selectedValue={themeMode}
                onValueChange={(itemValue) => setThemeMode(itemValue)}
                style={themedStyles.picker}
                itemStyle={themedStyles.pickerItem}
                dropdownIconColor={theme.colors.textPrimary}
                mode="dropdown"
              >
                <Picker.Item label="Clair" value="light" color={theme.colors.textPrimary} />
                <Picker.Item label="Sombre" value="dark" color={theme.colors.textPrimary} />
                <Picker.Item label="Système" value="system" color={theme.colors.textPrimary} />
              </Picker>
            </View>
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Support</Text>
          <View style={themedStyles.settingsGroup}>
            <SettingItem
              icon={<CircleHelp size={20} color={theme.colors.textPrimary} />}
              label="Aide et contact"
              onPress={() => { }}
            />
          </View>
        </View>

        <TouchableOpacity style={themedStyles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.alert} />
          <Text style={themedStyles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={themedStyles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 120,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  avatarText: {
    color: '#FFFFFF',
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
    color: theme.colors.textPrimary,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: theme.spacing.md,
    height: 64,
  },
  picker: {
    width: 150,
    color: theme.colors.textPrimary,
    backgroundColor: 'transparent',
  },
  pickerItem: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.medium,
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

