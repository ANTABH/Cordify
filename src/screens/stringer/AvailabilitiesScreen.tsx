import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, Modal, TextInput, Platform, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2, CalendarDays, Clock, Save, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

export const AvailabilitiesScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for standard hours
  const [openingHours, setOpeningHours] = useState<Record<string, string[]>>({});

  // State for blocked days
  const [absences, setAbsences] = useState<any[]>([]);

  // State for adding absence modal
  const [modalVisible, setModalVisible] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const themedStyles = styles(theme);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Fetch opening hours
      const { data: profileData, error: profileError } = await supabase
        .from('stringer_profiles')
        .select('opening_hours')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const defaultHours = {
        monday: ['09:00-18:00'],
        tuesday: ['09:00-18:00'],
        wednesday: ['09:00-18:00'],
        thursday: ['09:00-18:00'],
        friday: ['09:00-18:00'],
        saturday: [],
        sunday: []
      };

      setOpeningHours(profileData?.opening_hours || defaultHours);

      // Fetch absences
      const { data: absData, error: absError } = await supabase
        .from('availabilities')
        .select('*')
        .eq('stringer_id', userId)
        .eq('is_blocked', true)
        .gte('end_time', new Date().toISOString()) // Only future absences
        .order('start_time', { ascending: true });

      if (absError) throw absError;
      setAbsences(absData || []);

    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de charger vos disponibilités.");
    } finally {
      setLoading(false);
    }
  };

  const saveOpeningHours = async () => {
    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from('stringer_profiles')
        .update({ opening_hours: openingHours })
        .eq('id', userId);

      if (error) throw error;
      Alert.alert("Succès", "Horaires standards mis à jour !");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de sauvegarder les horaires.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDayStatus = (dayKey: string, isOpen: boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [dayKey]: isOpen ? ['09:00-18:00'] : []
    }));
  };

  const updateHours = (dayKey: string, newHours: string) => {
    // Basic validation could be added here
    setOpeningHours(prev => ({
      ...prev,
      [dayKey]: [newHours]
    }));
  };

  const addAbsence = async () => {
    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Ensure we use the date part only (midnight to midnight)
      const year = absenceDate.getFullYear();
      const month = absenceDate.getMonth();
      const day = absenceDate.getDate();

      const startTime = new Date(Date.UTC(year, month, day, 0, 0, 0)).toISOString();
      const endTime = new Date(Date.UTC(year, month, day, 23, 59, 59)).toISOString();

      const { error } = await supabase
        .from('availabilities')
        .insert({
          stringer_id: userId,
          start_time: startTime,
          end_time: endTime,
          is_blocked: true
        });

      if (error) throw error;

      setModalVisible(false);
      setAbsenceDate(new Date());
      fetchData(); // Reload to get new ID and list

    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d'ajouter cette absence.");
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || absenceDate;
    setShowDatePicker(Platform.OS === 'ios');
    setAbsenceDate(currentDate);
  };
  const deleteAbsence = async (id: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous annuler ce congé / cette absence ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('availabilities').delete().eq('id', id);
              if (error) throw error;
              setAbsences(prev => prev.filter(a => a.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert("Erreur", "Impossible de supprimer l'absence.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={themedStyles.safeArea}>
        <View style={themedStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      {/* Header */}
      <View style={themedStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themedStyles.backButton}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={themedStyles.headerTextContainer}>
          <Text style={themedStyles.headerTitle}>Disponibilités</Text>
          <Text style={themedStyles.headerSubtitle}>Gérez vos horaires de travail</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={themedStyles.scrollContent}>

        {/* Section 1: Opening Hours */}
        <View style={themedStyles.sectionHeader}>
          <Clock color={theme.colors.tennisPrimary} size={24} />
          <Text style={themedStyles.sectionTitle}>Horaires Standards</Text>
        </View>
        <Text style={themedStyles.sectionDescription}>
          Définissez vos jours et horaires d'ouverture habituels. Format : HH:MM-HH:MM
        </Text>

        <View style={themedStyles.card}>
          {DAYS.map((day, index) => {
            const isOpen = openingHours[day.key] && openingHours[day.key].length > 0;
            const hoursStr = isOpen ? openingHours[day.key][0] : '';

            return (
              <View key={day.key} style={[themedStyles.dayRow, index === DAYS.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={themedStyles.dayInfo}>
                  <Text style={themedStyles.dayLabel}>{day.label}</Text>
                  <Switch
                    value={isOpen}
                    onValueChange={(val) => toggleDayStatus(day.key, val)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.badmintonPrimary }}
                    thumbColor={theme.colors.surface}
                  />
                </View>

                {isOpen ? (
                  <TextInput
                    style={themedStyles.timeInput}
                    value={hoursStr}
                    onChangeText={(txt) => updateHours(day.key, txt)}
                    placeholder="09:00-18:00"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                ) : (
                  <View style={themedStyles.closedBadge}>
                    <Text style={themedStyles.closedText}>Fermé</Text>
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={themedStyles.saveButton}
            onPress={saveOpeningHours}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Save color="#FFF" size={20} />}
            <Text style={themedStyles.saveButtonText}>Enregistrer les horaires</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Absences */}
        <View style={[themedStyles.sectionHeader, { marginTop: theme.spacing.xl }]}>
          <CalendarDays color={theme.colors.warning} size={24} />
          <Text style={themedStyles.sectionTitle}>Absences Exceptionnelles</Text>
        </View>
        <Text style={themedStyles.sectionDescription}>
          Bloquez des jours complets dans le cas où vous seriez indisponible.
        </Text>

        {absences.map((abs) => {
          const dateObj = new Date(abs.start_time);
          const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

          return (
            <View key={abs.id} style={themedStyles.absenceCard}>
              <View style={themedStyles.absenceInfo}>
                <Text style={themedStyles.absenceIcon}>🏖️</Text>
                <Text style={themedStyles.absenceDate}>{dateStr}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteAbsence(abs.id)} style={themedStyles.deleteBtn}>
                <Trash2 color={theme.colors.alert} size={20} />
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={themedStyles.addAbsenceBtn} onPress={() => setModalVisible(true)}>
          <Plus color={theme.colors.textPrimary} size={20} />
          <Text style={themedStyles.addAbsenceText}>Ajouter une absence</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal for adding Absence */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={themedStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={themedStyles.modalDismissArea} />
          </TouchableWithoutFeedback>

          <View style={themedStyles.modalContent}>
            <Text style={themedStyles.modalTitle}>Ajouter une absence</Text>

            <Text style={themedStyles.inputLabel}>Sélectionner la date</Text>

            <TouchableOpacity
              style={themedStyles.dateSelectorBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <CalendarIcon size={20} color={theme.colors.textPrimary} />
              <Text style={themedStyles.dateSelectorText}>
                {absenceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {(showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? themedStyles.iosPickerContainer : null}>
                <DateTimePicker
                  value={absenceDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  locale="fr-FR"
                />
              </View>
            )}

            <View style={themedStyles.modalActions}>
              <TouchableOpacity style={themedStyles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={themedStyles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themedStyles.modalSave} onPress={addAbsence} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={themedStyles.modalSaveText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
    marginRight: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  sectionDescription: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    justifyContent: 'space-between',
    marginRight: 16,
  },
  dayLabel: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  timeInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  closedBadge: {
    flex: 1,
    backgroundColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closedText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: theme.colors.badmintonPrimary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: '#FFFFFF',
  },
  absenceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  absenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  absenceIcon: {
    fontSize: 24,
  },
  absenceDate: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: theme.colors.alert + '15',
    borderRadius: 12,
  },
  addAbsenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addAbsenceText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.soft,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateSelectorText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  iosPickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.textSecondary,
  },
  modalSave: {
    flex: 2,
    padding: 16,
    borderRadius: 24,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  }
});
