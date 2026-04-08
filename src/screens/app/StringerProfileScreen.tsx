import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MapPin, CreditCard, Star, Calendar } from 'lucide-react-native';

export const StringerProfileScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { stringerId } = route.params || {};
  const { theme, isDark } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stringerId) {
      fetchStringerDetails();
    }
  }, [stringerId]);

  const fetchStringerDetails = async () => {
    try {
      setLoading(true);
      const { data: stringerData, error: stringerError } = await supabase
        .from('stringer_profiles')
        .select(`
          *,
          profiles:profiles!stringer_profiles_id_fkey (
            first_name,
            last_name,
            avatar_url,
            email,
            phone
          )
        `)
        .eq('id', stringerId)
        .single();

      if (stringerError) throw stringerError;
      setProfile(stringerData);

      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select(`
          price,
          includes_labor,
          custom_name,
          reference_strings(id, name, brand, material, sport, play_profile)
        `)
        .eq('stringer_id', stringerId);

      if (stockError) throw stockError;
      setStock(stockData || []);
    } catch (error) {
      console.error('Error fetching stringer details:', error);
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

  if (!profile) {
    return (
      <SafeAreaView style={themedStyles.safeArea}>
        <View style={themedStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={themedStyles.backButton}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={themedStyles.loadingContainer}>
          <Text style={themedStyles.errorText}>Profil introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = `${profile.profiles.first_name} ${profile.profiles.last_name}`;
  const isBadminton = profile.sports?.includes('badminton');
  const isTennis = profile.sports?.includes('tennis');

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <View style={themedStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themedStyles.backButton}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={themedStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={themedStyles.profileHeader}>
          <View style={[themedStyles.avatarPlaceholder, { backgroundColor: isBadminton ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary }]}>
             {profile.profiles.avatar_url ? (
               <Text style={themedStyles.avatarText}>IMG</Text>
             ) : (
               <Text style={themedStyles.avatarText}>{profile.type === 'boutique' ? '🏬' : '👤'}</Text>
             )}
          </View>
          <View style={themedStyles.nameContainer}>
            <Text style={themedStyles.nameTitle}>{name}</Text>
            <Text style={themedStyles.typeText}>{profile.type === 'boutique' ? 'Boutique Spécialisée' : 'Cordeur Indépendant'}</Text>
          </View>
          <View style={[themedStyles.ratingBadge, { backgroundColor: isDark ? '#332B00' : '#FFF8E1' }]}>
             <Star color="#F39C12" size={16} fill="#F39C12" />
             <Text style={themedStyles.ratingText}> 4.8</Text>
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

        <View style={themedStyles.bentoSection}>
          <Text style={themedStyles.sectionTitle}>À propos</Text>
          <Text style={themedStyles.descriptionText}>
            {profile.description || "Aucune description fournie par ce cordeur."}
          </Text>
        </View>

        <View style={themedStyles.bentoSection}>
          <Text style={themedStyles.sectionTitle}>Informations Pratiques</Text>
          <View style={themedStyles.infoRow}>
            <MapPin size={20} color={theme.colors.textSecondary} style={themedStyles.infoIcon} />
            <Text style={themedStyles.infoText}>{profile.address || "Adresse non renseignée"}</Text>
          </View>
          <View style={themedStyles.infoRow}>
            <CreditCard size={20} color={theme.colors.textSecondary} style={themedStyles.infoIcon} />
            <Text style={themedStyles.infoText}>Moyens de paiement : {profile.payment_methods?.join(', ') || 'Espèces'}</Text>
          </View>
        </View>

        <View style={themedStyles.bentoSection}>
          <Text style={themedStyles.sectionTitle}>Cordages Proposés ({stock.length})</Text>
          {stock.length === 0 ? (
            <Text style={themedStyles.emptyText}>Ce cordeur n'a pas encore renseigné son stock.</Text>
          ) : (
            stock.map((item, index) => (
              <View key={index} style={themedStyles.stockItem}>
                <View style={themedStyles.stockInfoContainer}>
                   <Text style={themedStyles.stockName}>{item.reference_strings?.name || item.custom_name}</Text>
                   <Text style={themedStyles.stockBrand}>{item.reference_strings?.brand}</Text>
                   <Text style={themedStyles.stockDetails}>{item.reference_strings?.play_profile}</Text>
                </View>
                <View style={themedStyles.stockPriceContainer}>
                   <Text style={themedStyles.stockPrice}>{item.price} €</Text>
                   <Text style={themedStyles.stockLabor}>{item.includes_labor ? 'Pose incluse' : 'Sans pose'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={themedStyles.floatingActionContainer}>
        <TouchableOpacity 
          style={themedStyles.bookButtonWrapper} 
          onPress={() => navigation.navigate('Booking', { stringerId })}
        >
          <BlurView intensity={80} tint={isDark ? 'light' : 'dark'} style={themedStyles.bookButtonGlass}>
            <Calendar color={isDark ? theme.colors.textPrimary : theme.colors.surface} size={20} style={{ marginRight: 8 }} />
            <Text style={[themedStyles.bookButtonText, { color: isDark ? theme.colors.textPrimary : theme.colors.surface }]}>Prendre un RDV</Text>
          </BlurView>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
  },
  errorText: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
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
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
  },
  nameContainer: {
    flex: 1,
  },
  nameTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  typeText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: '#F39C12',
  },
  sportsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  sportBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sportText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
  },
  bentoSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  descriptionText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
  },
  infoText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stockInfoContainer: {
    flex: 1,
  },
  stockName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  stockBrand: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  stockDetails: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  stockLabor: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.badmintonPrimary,
    marginTop: 4,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 30,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  bookButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.elevated,
  },
  bookButtonGlass: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bookButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
  }
});

