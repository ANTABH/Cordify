import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, Info, CheckCircle, ChevronRight, Package, Dumbbell } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const BookingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { session } = useAuth();
  const { stringerId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [stringer, setStringer] = useState<any>(null);
  const [rackets, setRackets] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);

  // Selection state
  const [selectedRacketId, setSelectedRacketId] = useState<string | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [tension, setTension] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date(Date.now() + 86400000)); // Default to tomorrow
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stringerId) {
      fetchData();
    }
  }, [stringerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;

      // Fetch Stringer Info
      const { data: sInfo } = await supabase
        .from('stringer_profiles')
        .select('*, profiles(first_name, last_name)')
        .eq('id', stringerId)
        .single();
      setStringer(sInfo);

      // Fetch User Rackets
      if (userId) {
        const { data: rData } = await supabase
          .from('rackets')
          .select('*')
          .eq('client_id', userId);
        setRackets(rData || []);
        if (rData && rData.length > 0) {
          setSelectedRacketId(rData[0].id);
          setTension(rData[0].preferred_tension_kg?.toString() || '');
        }
      }

      // Fetch Stringer Stock
      const { data: stData } = await supabase
        .from('stock')
        .select('*, reference_strings(*)')
        .eq('stringer_id', stringerId);
      setStock(stData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleRacketSelect = (id: string) => {
    setSelectedRacketId(id);
    const racket = rackets.find(r => r.id === id);
    if (racket?.preferred_tension_kg) {
      setTension(racket.preferred_tension_kg.toString());
    }
  };

  const handleConfirm = async () => {
    if (!selectedRacketId || !selectedStockId || !tension) {
      Alert.alert('Champs requis', 'Veuillez sélectionner une raquette, un cordage et préciser la tension.');
      return;
    }

    try {
      setSubmitting(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const tensionNum = parseFloat(tension.replace(',', '.'));

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: userId,
          stringer_id: stringerId,
          racket_id: selectedRacketId,
          stock_id: selectedStockId,
          applied_tension_kg: tensionNum,
          scheduled_time: date.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Success
      Alert.alert(
        '🎉 Réservation envoyée !',
        'Votre demande a été envoyée au cordeur. Vous recevrez une notification dès qu\'elle sera acceptée.',
        [{ text: 'Super !', onPress: () => navigation.navigate('Home') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d\'envoyer la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const s = styles(theme);

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Prendre RDV</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.stringerBrief}>
          <Text style={s.briefLabel}>Avec le cordeur</Text>
          <Text style={s.briefValue}>{stringer?.profiles?.first_name} {stringer?.profiles?.last_name}</Text>
        </View>

        {/* SECTION 1: RACKET */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Dumbbell size={20} color={theme.colors.badmintonPrimary} />
            <Text style={s.sectionTitle}>Ma Raquette</Text>
          </View>
          {rackets.length === 0 ? (
            <TouchableOpacity style={s.emptyAction} onPress={() => navigation.navigate('Rackets')}>
              <Text style={s.emptyActionText}>+ Ajouter une raquette</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalList}>
              {rackets.map(r => (
                <TouchableOpacity 
                   key={r.id} 
                   style={[s.racketItem, selectedRacketId === r.id && s.itemActive]}
                   onPress={() => handleRacketSelect(r.id)}
                >
                  <Text style={[s.itemName, selectedRacketId === r.id && s.itemTextActive]}>{r.name}</Text>
                  <Text style={[s.itemSub, selectedRacketId === r.id && s.itemTextActive]}>{r.preferred_tension_kg} kg habitual</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* SECTION 2: CORDAGE */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Package size={20} color={theme.colors.tennisPrimary} />
            <Text style={s.sectionTitle}>Choix du Cordage</Text>
          </View>
          {stock.length === 0 ? (
            <Text style={s.emptyText}>Aucun cordage disponible chez ce cordeur.</Text>
          ) : (
            <View style={s.stockGrid}>
              {stock.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[s.stockItem, selectedStockId === item.id && s.itemActive]}
                  onPress={() => setSelectedStockId(item.id)}
                >
                  <View style={s.stockInfo}>
                    <Text style={[s.itemName, selectedStockId === item.id && s.itemTextActive]}>{item.reference_strings?.name || item.custom_name}</Text>
                    <Text style={[s.itemSub, selectedStockId === item.id && s.itemTextActive]}>{item.reference_strings?.brand}</Text>
                  </View>
                  <Text style={[s.itemPrice, selectedStockId === item.id && s.itemTextActive]}>{item.price}€</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 3: TENSION */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Info size={20} color={theme.colors.warning} />
            <Text style={s.sectionTitle}>Tension souhaitée</Text>
          </View>
          <View style={s.tensionInputContainer}>
            <TextInput
              style={s.tensionInput}
              keyboardType="decimal-pad"
              placeholder="Ex: 11.5"
              placeholderTextColor={theme.colors.textSecondary}
              value={tension}
              onChangeText={setTension}
            />
            <Text style={s.kgLabel}>kg</Text>
          </View>
        </View>

        {/* SECTION 4: DATE */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Calendar size={20} color={theme.colors.success} />
            <Text style={s.sectionTitle}>Date et Heure de dépose</Text>
          </View>
          <TouchableOpacity style={s.datePickerBtn} onPress={() => setShowDatePicker(true)}>
             <Text style={s.dateText}>{date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
             <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={s.footer}>
          <TouchableOpacity 
            style={[s.confirmButton, submitting && { opacity: 0.7 }]} 
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle color="#FFFFFF" size={20} />
                <Text style={s.confirmButtonText}>Confirmer la réservation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  headerTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  stringerBrief: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  briefLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  briefValue: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 10,
  },
  racketItem: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    minWidth: 150,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: {
    backgroundColor: theme.colors.badmintonPrimary,
    borderColor: theme.colors.badmintonPrimary,
  },
  itemName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  itemSub: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  itemTextActive: {
    color: '#FFFFFF',
  },
  emptyAction: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyActionText: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.badmintonPrimary,
  },
  stockGrid: {
    gap: 10,
  },
  stockItem: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stockInfo: {
    flex: 1,
  },
  itemPrice: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  tensionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    ...theme.shadows.soft,
  },
  tensionInput: {
    flex: 1,
    height: 56,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  kgLabel: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 18,
    borderRadius: 20,
    ...theme.shadows.soft,
  },
  dateText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  footer: {
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: theme.colors.badmintonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    borderRadius: 30,
    ...theme.shadows.elevated,
  },
  confirmButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  }
});
