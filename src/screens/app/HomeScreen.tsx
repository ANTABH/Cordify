import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Search, SlidersHorizontal, Settings, LogOut, MapPin, User } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Map, StringerMapPin } from '../../components/Map';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { RacketIcon } from '../../components/RacketIcon';

export const HomeScreen = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stringers, setStringers] = useState<StringerMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userRole, session } = useAuth();
  const themedStyles = styles(theme);

  // Calcul du décalage dynamique pour la TabBarJoueur
  // Hauteur TabBar (85) + Bottom Offset (8) + Sécurité Appareil (insets.bottom)
  const tabBarBottomOffset = 85 + 8 + insets.bottom;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('La permission de localisation a été refusée.');
      } else {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }

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
        const formattedStringers: StringerMapPin[] = data.map((item: any) => ({
          id: item.id,
          name: item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : 'Utilisateur',
          type: item.type,
          lat: item.lat,
          lng: item.lng,
          sports: item.sports || [],
          startingPrice: 18,
          avatarUrl: item.profiles?.avatar_url
        }));
        setStringers(formattedStringers);
      }
    } catch (err) {
      console.error('Erreur fetch stringers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
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
    <SafeAreaView style={themedStyles.safeArea} edges={['top', 'left', 'right']}>
      <View style={themedStyles.header}>
        <View style={themedStyles.headerTop}>
          <Text style={themedStyles.greeting}>Bonjour 👋</Text>
          <TouchableOpacity
            style={themedStyles.profileBubble}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={themedStyles.profileInitial}>
              {session?.user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={themedStyles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={themedStyles.searchIcon} />
          <Text style={themedStyles.searchPlaceholder}>Rechercher un cordeur...</Text>
          <TouchableOpacity style={themedStyles.filterButton}>
            <SlidersHorizontal size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={themedStyles.toggleContainer}>
          <TouchableOpacity
            style={[themedStyles.toggleButton, viewMode === 'list' && themedStyles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[themedStyles.toggleText, viewMode === 'list' && themedStyles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[themedStyles.toggleButton, viewMode === 'map' && themedStyles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[themedStyles.toggleText, viewMode === 'map' && themedStyles.toggleTextActive]}>🗺️ Carte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <ScrollView
          contentContainerStyle={[themedStyles.scrollContent, { paddingBottom: tabBarBottomOffset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={themedStyles.sectionTitle}>Cordeurs proches de vous</Text>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} style={{ marginTop: 40 }} />
          ) : stringers.length === 0 ? (
            <Text style={themedStyles.emptyText}>Aucun cordeur trouvé.</Text>
          ) : (
            stringers.map((stringer) => {
              const distance = location
                ? getDistanceFromLatLonInKm(location.coords.latitude, location.coords.longitude, stringer.lat, stringer.lng)
                : '1.2';

              const isBadminton = stringer.sports.includes('badminton');
              const isTennis = stringer.sports.includes('tennis');

              return (
                <TouchableOpacity
                  key={stringer.id}
                  style={themedStyles.bentoCard}
                  onPress={() => navigation.navigate('StringerProfile', { stringerId: stringer.id })}
                >
                  <View style={themedStyles.cardHeader}>
                    <View style={[themedStyles.avatarPlaceholder, { backgroundColor: isBadminton ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary }]}>
                      {stringer.avatarUrl ? (
                        <Text style={themedStyles.avatarText}>IMG</Text>
                      ) : (
                        <Text style={themedStyles.avatarText}>{stringer.type === 'boutique' ? '🏬' : '👤'}</Text>
                      )}
                    </View>
                    <View style={themedStyles.cardInfo}>
                      <Text style={themedStyles.stringerName}>{stringer.name}</Text>
                      <Text style={themedStyles.stringerMeta}>{stringer.type === 'boutique' ? 'Boutique' : 'Indépendant'} • {distance} km</Text>
                    </View>
                    <View style={[themedStyles.ratingBadge, { backgroundColor: isDark ? '#332B00' : '#FFF8E1' }]}>
                      <Text style={themedStyles.ratingText}>⭐ 4.8</Text>
                    </View>
                  </View>

                  <View style={themedStyles.sportsRow}>
                    {isBadminton && (
                      <View style={[themedStyles.sportBadge, { backgroundColor: theme.colors.badmintonPrimary + '20' }]}>
                        <Text style={[themedStyles.sportText, { color: theme.colors.badmintonPrimary }]}>🏸 Badminton</Text>
                      </View>
                    )}
                    {isTennis && (
                      <View style={[themedStyles.sportBadge, { backgroundColor: theme.colors.tennisPrimary + '20' }]}>
                        <Text style={[themedStyles.sportText, { color: theme.colors.tennisPrimary }]}>🎾 Tennis</Text>
                      </View>
                    )}
                  </View>

                  <View style={themedStyles.priceRow}>
                    <Text style={themedStyles.priceText}>Cordages à partir de <Text style={themedStyles.priceHighlight}>{stringer.startingPrice} €</Text></Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      ) : (
        <View style={[themedStyles.mapWrapper, { marginBottom: tabBarBottomOffset }]}>
          <Map
            stringers={stringers}
            userLocation={location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1
            } : undefined}
            onMarkerPress={(stringer) => navigation.navigate('StringerProfile', { stringerId: stringer.id })}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme: any) => StyleSheet.create({
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
  profileBubble: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  profileInitial: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: theme.colors.badmintonPrimary,
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
    backgroundColor: theme.isDark ? '#2C3E50' : '#EAECEF',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
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
  }
});

