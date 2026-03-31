import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { Search, SlidersHorizontal, Settings, LogOut, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Map, StringerMapPin } from '../../components/Map';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const HomeScreen = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stringers, setStringers] = useState<StringerMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    (async () => {
      // 1. Demande de permission de geolocalisation
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('La permission de localisation a été refusée.');
      } else {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }

      // 2. Fetch des cordeurs
      await fetchStringers();
    })();
  }, []);

  const fetchStringers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stringer_profiles')
        .select(`
          id,
          type,
          lat,
          lng,
          sports,
          profiles:profiles!stringer_profiles_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `);

      if (error) throw error;

      if (data) {
        // Mapping vers le format du composant Map
        const formattedStringers: StringerMapPin[] = data.map((item: any) => ({
          id: item.id,
          name: `${item.profiles.first_name} ${item.profiles.last_name}`,
          type: item.type,
          lat: item.lat,
          lng: item.lng,
          sports: item.sports,
          startingPrice: 18 // TODO: Fetch from stock table later
        }));
        setStringers(formattedStringers);
      }
    } catch (err) {
      console.error('Erreur fetch stringers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  // Calcul basique de distance en km (Formule de Haversine)
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Settings size={24} color={theme.colors.textPrimary} />
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

      {/* Content Area */}
      {viewMode === 'list' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Cordeurs proches de vous</Text>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} style={{ marginTop: 40 }} />
          ) : stringers.length === 0 ? (
            <Text style={styles.emptyText}>Aucun cordeur trouvé.</Text>
          ) : (
            stringers.map((stringer) => {
              const distance = location
                ? getDistanceFromLatLonInKm(location.coords.latitude, location.coords.longitude, stringer.lat, stringer.lng)
                : '1.2';

              const initials = stringer.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
              const isBadminton = stringer.sports.includes('badminton');
              const isTennis = stringer.sports.includes('tennis');

              return (
                <View key={stringer.id} style={styles.bentoCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isBadminton ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.stringerName}>{stringer.name}</Text>
                      <Text style={styles.stringerMeta}>{stringer.type === 'boutique' ? 'Boutique' : 'Indépendant'} • {distance} km</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ 4.8</Text>
                    </View>
                  </View>

                  <View style={styles.sportsRow}>
                    {isBadminton && (
                      <View style={[styles.sportBadge, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
                        <Text style={[styles.sportText, { color: theme.colors.badmintonPrimary }]}>🏸 Badminton</Text>
                      </View>
                    )}
                    {isTennis && (
                      <View style={[styles.sportBadge, { backgroundColor: theme.colors.tennisPrimary + '20' }]}>
                        <Text style={[styles.sportText, { color: theme.colors.tennisPrimary }]}>🎾 Tennis</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>Cordages à partir de <Text style={styles.priceHighlight}>{stringer.startingPrice} €</Text></Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapWrapper}>
          <Map
            stringers={stringers}
            userLocation={location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1
            } : undefined}
          />
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
    paddingTop: Platform.OS === 'android' ? theme.spacing.xl + 10 : theme.spacing.sm,
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
  emptyText: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
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
  mapWrapper: {
    flex: 1,
    padding: theme.spacing.md,
    paddingBottom: 20,
  }
});
