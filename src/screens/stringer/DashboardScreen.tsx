import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, CalendarDays, Settings, LogOut } from 'lucide-react-native';

export const DashboardScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stockCount, setStockCount] = useState(0);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile?.profiles?.first_name ? `Bonjour, ${profile.profiles.first_name} 👋` : 'Bonjour 👋';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>{name}</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Commandes en cours</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>RDV aujourd'hui</Text>
          </View>
        </View>

        {/* Actions Bento */}
        <Text style={styles.sectionTitle}>Gestion de l'activité</Text>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Stock')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.tennisPrimary + '20' }]}>
            <Package color={theme.colors.tennisPrimary} size={28} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionCardTitle}>Mon Stock de Cordages</Text>
            <Text style={styles.actionCardSubtitle}>{stockCount} cordages enregistrés</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => { /* TODO: Disponibilités */ }}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
            <CalendarDays color={theme.colors.badmintonPrimary} size={28} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionCardTitle}>Mes Disponibilités</Text>
            <Text style={styles.actionCardSubtitle}>Gérer vos horaires et absences</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
