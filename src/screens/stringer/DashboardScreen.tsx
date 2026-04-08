import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, CalendarDays, Settings } from 'lucide-react-native';

export const DashboardScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stockCount, setStockCount] = useState(0);
  const { theme } = useTheme();


  useEffect(() => {
    fetchCordeurData();
  }, []);

  const fetchCordeurData = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      
      if (!userId) return;

      const { data: stringerData, error: stringerError } = await supabase
        .from('stringer_profiles')
        .select(`
          *,
          profiles(first_name, last_name, avatar_url)
        `)
        .eq('id', userId)
        .single();

      if (stringerError) throw stringerError;
      setProfile(stringerData);

      const { count, error: countError } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
        .eq('stringer_id', userId);

      if (countError) throw countError;
      setStockCount(count || 0);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const themedStyles = styles(theme);

  if (loading) {
    return (
      <SafeAreaView style={themedStyles.safeArea}>
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile?.profiles?.first_name ? `Bonjour, ${profile.profiles.first_name} 👋` : 'Bonjour 👋';

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <View style={themedStyles.header}>
        <View style={themedStyles.headerTop}>
          <Text style={themedStyles.greeting}>{name}</Text>
          <TouchableOpacity
            style={themedStyles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={themedStyles.scrollContent}>
        {/* KPI Cards */}
        <View style={themedStyles.kpiContainer}>
          <View style={themedStyles.kpiCard}>
            <Text style={themedStyles.kpiValue}>0</Text>
            <Text style={themedStyles.kpiLabel}>Commandes en cours</Text>
          </View>
          <View style={themedStyles.kpiCard}>
            <Text style={themedStyles.kpiValue}>0</Text>
            <Text style={themedStyles.kpiLabel}>RDV aujourd'hui</Text>
          </View>
        </View>

        {/* Actions Bento */}
        <Text style={themedStyles.sectionTitle}>Gestion de l'activité</Text>

        <TouchableOpacity 
          style={themedStyles.actionCard} 
          onPress={() => navigation.navigate('Stock')}
        >
          <View style={[themedStyles.actionIconContainer, { backgroundColor: theme.colors.tennisPrimary + '20' }]}>
            <Package color={theme.colors.tennisPrimary} size={28} />
          </View>
          <View style={themedStyles.actionInfo}>
            <Text style={themedStyles.actionCardTitle}>Mon Stock de Cordages</Text>
            <Text style={themedStyles.actionCardSubtitle}>{stockCount} cordages enregistrés</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={themedStyles.actionCard} 
          onPress={() => { /* TODO: Disponibilités */ }}
        >
          <View style={[themedStyles.actionIconContainer, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
            <CalendarDays color={theme.colors.badmintonPrimary} size={28} />
          </View>
          <View style={themedStyles.actionInfo}>
            <Text style={themedStyles.actionCardTitle}>Mes Disponibilités</Text>
            <Text style={themedStyles.actionCardSubtitle}>Gérer vos horaires et absences</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 24,
    ...theme.shadows.soft,
  },
  kpiValue: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  }
});
