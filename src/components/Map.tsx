import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

// Typage des données d'un cordeur sur la carte
export interface StringerMapPin {
  id: string;
  name: string;
  type: 'independant' | 'boutique';
  lat: number;
  lng: number;
  sports: string[];
  startingPrice?: number;
  avatarUrl?: string | null;
}

interface MapProps {
  stringers: StringerMapPin[];
  userLocation?: Region;
  onMarkerPress?: (stringer: StringerMapPin) => void;
}

export const Map = ({ stringers, userLocation, onMarkerPress }: MapProps) => {
  // Position par défaut (ex: Centre de la France ou Lyon)
  const defaultRegion: Region = {
    latitude: 45.7640, // Lyon
    longitude: 4.8357,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation || defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {stringers.map((stringer) => {
          // Choix de la couleur du marqueur en fonction du sport principal ou type
          const isBadminton = stringer.sports.includes('badminton');
          const markerColor = isBadminton ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary;

          return (
            <Marker
              key={stringer.id}
              coordinate={{ latitude: stringer.lat, longitude: stringer.lng }}
              onPress={() => onMarkerPress?.(stringer)}
            >
              <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                <Text style={styles.customMarkerText}>
                  {stringer.type === 'boutique' ? '🏬' : '👤'}
                </Text>
              </View>
              <Callout tooltip>
                <BlurView intensity={70} tint="light" style={styles.calloutContainer}>
                  <Text style={styles.calloutName}>{stringer.name}</Text>
                  <Text style={styles.calloutType}>
                    {stringer.type === 'boutique' ? 'Boutique' : 'Indépendant'}
                  </Text>
                  {stringer.startingPrice && (
                    <Text style={styles.calloutPrice}>Dès {stringer.startingPrice} €</Text>
                  )}
                </BlurView>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.input,
    minWidth: 120,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
  },
  calloutName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  calloutType: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  calloutPrice: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.badge,
    color: theme.colors.badmintonPrimary,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: theme.colors.surface,
    borderWidth: 2,
    ...theme.shadows.soft,
  },
  customMarkerText: {
    fontSize: 14,
  }
});
