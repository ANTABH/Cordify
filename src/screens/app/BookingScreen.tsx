import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar as CalendarIcon, Info, CheckCircle, ChevronRight, Package, Dumbbell, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

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
  const [clientStrings, setClientStrings] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [openingHours, setOpeningHours] = useState<any>(null);

  // Selection state
  const [selectedRacketId, setSelectedRacketId] = useState<string | null>(null);
  const [stringSource, setStringSource] = useState<'cordeur' | 'moi'>('cordeur');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [selectedClientStringId, setSelectedClientStringId] = useState<string | null>(null);
  const [tension, setTension] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 86400000)); // Default to tomorrow
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

        // Fetch User Strings
        const { data: cStrData, error: cStrError } = await supabase
          .from('client_strings')
          .select('*')
          .eq('client_id', userId);
        if (!cStrError) {
          setClientStrings(cStrData || []);
        } else {
          console.warn('client_strings err:', cStrError);
        }
      }

      // Fetch Stringer Stock
      const { data: stData } = await supabase
        .from('stock')
        .select('*, reference_strings(*)')
        .eq('stringer_id', stringerId);
      setStock(stData || []);

      // Fetch Availabilities (Blocked periods)
      const { data: availData } = await supabase
        .from('availabilities')
        .select('*')
        .eq('stringer_id', stringerId)
        .eq('is_blocked', true);
      setAvailabilities(availData || []);

      setOpeningHours(sInfo?.opening_hours || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDateSelect = (day: any) => {
    // Check if day is blocked or closed
    const dateStr = day.dateString;
    const marked = getMarkedDates();
    
    if (marked[dateStr]?.isAbsence) {
      Alert.alert("Indisponible", "Le cordeur est exceptionnellement absent ce jour-là.");
      return;
    }
    
    if (marked[dateStr]?.isClosed) {
      Alert.alert("Fermé", "Le cordeur est fermé ce jour-là selon ses horaires habituels.");
      return;
    }

    // If we reach here, it's a valid date
    const selectedDate = new Date(day.timestamp);
    
    // Preserve current time if possible, or set a default
    const newDate = new Date(date);
    newDate.setFullYear(selectedDate.getFullYear());
    newDate.setMonth(selectedDate.getMonth());
    newDate.setDate(selectedDate.getDate());
    
    setDate(newDate);
    setShowCalendar(false);
    
    // Auto show time picker after date selection on Android, or just let user click
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // 1. Mark blocked days from availabilities
    availabilities.forEach(avail => {
      const start = new Date(avail.start_time);
      const dateStr = start.toISOString().split('T')[0];
      marked[dateStr] = { 
        disabled: true, 
        disableTouchEvent: false, // Allow click to show alert
        textColor: theme.colors.alert, // Make it slightly more visible as an alert
        marked: true,
        dotColor: theme.colors.alert,
        isAbsence: true
      };
    });

    // 2. Mark closed days from opening hours (for the next 3 months)
    if (openingHours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayName = dayNames[d.getDay()];
        const dayHours = openingHours[dayName];
        const dateStr = d.toISOString().split('T')[0];
        
        if (!dayHours || dayHours.length === 0) {
          // Only overwrite if not already an absence
          if (!marked[dateStr]) {
            marked[dateStr] = { 
              disabled: true, 
              disableTouchEvent: false, // Allow click for "Closed" info
              textColor: theme.isDark ? '#444' : '#ccc', // Stronger gray
              isClosed: true
            };
          }
        }
      }
    }

    // 3. Mark selected date
    const selectedStr = date.toISOString().split('T')[0];
    marked[selectedStr] = { 
      ...marked[selectedStr],
      selected: true, 
      selectedColor: theme.colors.badmintonPrimary 
    };

    return marked;
  };

  const handleRacketSelect = (id: string) => {
    setSelectedRacketId(id);
    const racket = rackets.find(r => r.id === id);
    if (racket?.preferred_tension_kg) {
      setTension(racket.preferred_tension_kg.toString());
    }
  };

  const handleConfirm = async () => {
    if (!selectedRacketId || (stringSource === 'cordeur' ? !selectedStockId : !selectedClientStringId) || !tension) {
      Alert.alert('Champs requis', 'Veuillez sélectionner une raquette, un cordage et préciser la tension.');
      return;
    }

    // 1. Check if the day is blocked in availabilities
    const isBlocked = availabilities.some(avail => {
      const start = new Date(avail.start_time);
      const end = new Date(avail.end_time);
      return date >= start && date <= end;
    });

    if (isBlocked) {
      Alert.alert('Indisponible', 'Le cordeur est indisponible à cette date. Veuillez choisir un autre jour.');
      return;
    }

    // 2. Check opening hours
    if (openingHours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const dayHours = openingHours[dayName];

      if (!dayHours || dayHours.length === 0) {
        Alert.alert('Fermé', `Le cordeur est fermé le ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' })}.`);
        return;
      }

      // Optional: Check if time is within the range HH:MM-HH:MM
      // For MVP V1, we just check if the day is open. 
      // If we wanted to be precise:
      const timeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
      const isWithinRange = dayHours.some((range: string) => {
        const [start, end] = range.split('-');
        return timeStr >= start && timeStr <= end;
      });

      if (!isWithinRange) {
        Alert.alert('En dehors des horaires', `Le cordeur n'est pas ouvert à cette heure-là (${timeStr}). Horaires : ${dayHours.join(', ')}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const tensionNum = parseFloat(tension.replace(',', '.'));

      const payload: any = {
        client_id: userId,
        stringer_id: stringerId,
        racket_id: selectedRacketId,
        applied_tension_kg: tensionNum,
        scheduled_time: date.toISOString(),
        status: 'pending'
      };

      if (stringSource === 'cordeur') {
        payload.stock_id = selectedStockId;
      } else {
        payload.client_string_id = selectedClientStringId;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Success
      Alert.alert(
        '🎉 Réservation envoyée !',
        'Votre demande a été envoyée au cordeur. Vous recevrez une notification dès qu\'elle sera acceptée.',
        [{ text: 'Super !', onPress: () => navigation.navigate('MainTabs') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible denvoyer la réservation. Verifiez que la BD est à jour.');
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

  const laborPrice = stringer?.labor_price || 10.0;

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
                  <Text style={[s.itemSub, selectedRacketId === r.id && s.itemTextActive]}>{r.preferred_tension_kg} kg habituel</Text>
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

          <View style={s.toggleContainer}>
            <TouchableOpacity
              style={[s.toggleButton, stringSource === 'cordeur' && s.toggleActive]}
              onPress={() => setStringSource('cordeur')}
            >
              <Text style={[s.toggleText, stringSource === 'cordeur' && s.toggleTextActive]}>Fourni par cordeur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleButton, stringSource === 'moi' && s.toggleActive]}
              onPress={() => setStringSource('moi')}
            >
              <Text style={[s.toggleText, stringSource === 'moi' && s.toggleTextActive]}>Mon cordage</Text>
            </TouchableOpacity>
          </View>

          {stringSource === 'cordeur' ? (
            stock.length === 0 ? (
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
            )
          ) : (
            clientStrings.length === 0 ? (
              <TouchableOpacity style={s.emptyAction} onPress={() => navigation.navigate('Rackets')}>
                <Text style={s.emptyActionText}>+ Ajouter un cordage (mon équipement)</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.stockGrid}>
                {clientStrings.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.stockItem, selectedClientStringId === item.id && s.itemActive]}
                    onPress={() => setSelectedClientStringId(item.id)}
                  >
                    <View style={s.stockInfo}>
                      <Text style={[s.itemName, selectedClientStringId === item.id && s.itemTextActive]}>{item.name}</Text>
                      <Text style={[s.itemSub, selectedClientStringId === item.id && s.itemTextActive]}>{item.type === 'bobine' ? 'Bobine' : 'Garniture'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.itemPrice, selectedClientStringId === item.id && s.itemTextActive]}>{laborPrice}€</Text>
                      <Text style={[s.laborBadgeLabel, selectedClientStringId === item.id && { color: '#ddd' }]}>Pose uniquement • Qté: {item.quantity || 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
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
            <CalendarIcon size={20} color={theme.colors.success} />
            <Text style={s.sectionTitle}>Date et Heure de dépose</Text>
          </View>
          
          <View style={s.dateTimeContainer}>
            <TouchableOpacity style={s.datePart} onPress={() => setShowCalendar(true)}>
               <Text style={s.datePartLabel}>Date</Text>
               <Text style={s.datePartValue}>{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</Text>
            </TouchableOpacity>
            
            <View style={s.dateTimeDivider} />
            
            <TouchableOpacity style={s.timePart} onPress={() => setShowTimePicker(true)}>
               <Text style={s.datePartLabel}>Heure</Text>
               <Text style={s.datePartValue}>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              locale="fr-FR"
            />
          )}
        </View>

        {/* Calendar Modal */}
        {showCalendar && (
          <View style={s.calendarOverlay}>
            <View style={s.calendarContainer}>
              <View style={s.calendarHeader}>
                <Text style={s.calendarTitle}>Choisir une date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <X size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <Calendar
                current={date.toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={onDateSelect}
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: theme.colors.surface,
                  calendarBackground: theme.colors.surface,
                  textSectionTitleColor: theme.colors.textSecondary,
                  selectedDayBackgroundColor: theme.colors.badmintonPrimary,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: theme.colors.badmintonPrimary,
                  dayTextColor: theme.colors.textPrimary,
                  textDisabledColor: theme.isDark ? '#333' : '#ddd',
                  dotColor: theme.colors.badmintonPrimary,
                  selectedDotColor: '#ffffff',
                  arrowColor: theme.colors.textPrimary,
                  monthTextColor: theme.colors.textPrimary,
                  indicatorColor: theme.colors.badmintonPrimary,
                  textDayFontFamily: theme.typography.fonts.medium,
                  textMonthFontFamily: theme.typography.fonts.bold,
                  textDayHeaderFontFamily: theme.typography.fonts.semiBold,
                }}
              />
            </View>
          </View>
        )}

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
  laborBadgeLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? '#2C3E50' : '#EAECEF',
    borderRadius: 24,
    padding: 4,
    height: 48,
    marginBottom: theme.spacing.md,
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
  datePartLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  datePartValue: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    ...theme.shadows.soft,
  },
  datePart: {
    flex: 1,
  },
  timePart: {
    flex: 1,
    paddingLeft: 16,
  },
  dateTimeDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    height: '100%',
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    ...theme.shadows.elevated,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 18,
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
