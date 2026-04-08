import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../theme';
import { MapPin } from 'lucide-react-native';

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
  userLocation?: any;
  onMarkerPress?: (stringer: StringerMapPin) => void;
}

/**
 * Version Web du composant Map.
 * react-native-maps n'étant pas compatible avec le Web sans configuration complexe,
 * nous affichons une vue alternative pour éviter de faire planter le bundle.
 */
export const Map = ({ stringers }: MapProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.webFallback}>
        <BlurView intensity={20} style={styles.blur}>
          <MapPin size={48} color={theme.colors.badmintonPrimary} strokeWidth={1.5} />
          <Text style={styles.title}>Carte indisponible sur le Web</Text>
          <Text style={styles.subtitle}>
            La visualisation interactive des cordeurs est optimisée pour l'application mobile Android et iOS.
          </Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              <Text style={styles.bold}>{stringers.length}</Text> cordeurs disponibles autour de vous
            </Text>
          </View>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  blur: {
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  title: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...theme.shadows.soft,
  },
  statsText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  bold: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.badmintonPrimary,
  }
});
