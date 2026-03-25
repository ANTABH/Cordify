import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { MapPin, Search, SlidersHorizontal, Settings, LogOut } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export const HomeScreen = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <LogOut size={24} color={theme.colors.alert} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Rechercher un cordeur...</Text>
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={20} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Toggle Liste / Carte */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>🗺️ Carte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area - Bento Grid Approach for List */}
      {viewMode === 'list' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Cordeurs proches de vous</Text>
          
          {/* Bento Card 1 */}
          <View style={styles.bentoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.stringerName}>Jean Dupont</Text>
                <Text style={styles.stringerMeta}>Indépendant • 1.2 km</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ 4.8</Text>
              </View>
            </View>
            
            <View style={styles.sportsRow}>
              <View style={[styles.sportBadge, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
                <Text style={[styles.sportText, { color: theme.colors.badmintonPrimary }]}>🏸 Badminton</Text>
              </View>
              <View style={[styles.sportBadge, { backgroundColor: theme.colors.tennisPrimary + '20' }]}>
                <Text style={[styles.sportText, { color: theme.colors.tennisPrimary }]}>🎾 Tennis</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceText}>Cordages à partir de <Text style={styles.priceHighlight}>18 €</Text></Text>
            </View>
          </View>

          {/* Bento Card 2 */}
          <View style={styles.bentoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.tennisPrimary }]}>
                <Text style={styles.avatarText}>PC</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.stringerName}>Pro Cordage</Text>
                <Text style={styles.stringerMeta}>Boutique • 3.8 km</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ 4.5</Text>
              </View>
            </View>
            
            <View style={styles.sportsRow}>
              <View style={[styles.sportBadge, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
                <Text style={[styles.sportText, { color: theme.colors.badmintonPrimary }]}>🏸 Badminton</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceText}>Cordages à partir de <Text style={styles.priceHighlight}>22 €</Text></Text>
            </View>
          </View>

        </ScrollView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <MapPin size={48} color={theme.colors.textSecondary} opacity={0.5} />
          <Text style={styles.mapText}>La carte interactive apparaîtra ici.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'android' ? theme.spacing.xl : theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  filterButton: {
    backgroundColor: theme.colors.textPrimary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAECEF',
    borderRadius: 24,
    padding: 4,
    height: 48,
  },
  toggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.soft,
  },
  toggleText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fonts.semiBold,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  bentoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.elevated,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.badmintonPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.surface,
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
  },
  cardInfo: {
    flex: 1,
  },
  stringerName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  stringerMeta: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  ratingBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.badge,
    color: '#F39C12',
  },
  sportsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sportText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.badge,
  },
  priceRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  priceText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  priceHighlight: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.textPrimary,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAECEF',
    margin: theme.spacing.md,
    borderRadius: 32,
    ...theme.shadows.soft,
  },
  mapText: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
  }
});
