import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react-native';
import { RacketIcon } from '../../components/RacketIcon';

export const RacketsScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [rackets, setRackets] = useState<any[]>([]);
  const { theme, isDark } = useTheme();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [tension, setTension] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRackets();
  }, []);

  const fetchRackets = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('rackets')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRackets(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de charger vos raquettes');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setTension('');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setTension(item.preferred_tension_kg?.toString() || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre raquette.');
      return;
    }

    const tensionNum = parseFloat(tension.replace(',', '.'));
    if (tension && isNaN(tensionNum)) {
      Alert.alert('Erreur', 'Tension invalide.');
      return;
    }

    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const payload = {
        name: name.trim(),
        preferred_tension_kg: tension ? tensionNum : null,
        client_id: userId,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('rackets')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rackets')
          .insert(payload);
        if (error) throw error;
      }

      setModalVisible(false);
      fetchRackets();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la raquette');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cette raquette ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('rackets').delete().eq('id', id);
              if (error) throw error;
              setRackets(rackets.filter(r => r.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert("Erreur", "Impossible de supprimer");
            }
          }
        }
      ]
    );
  };

  const s = styles(theme);

  if (loading && rackets.length === 0) {
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
        <View>
          <Text style={s.headerTitle}>Mes Raquettes</Text>
          <Text style={s.headerSubtitle}>{rackets.length} raquette{rackets.length > 1 ? 's' : ''} enregistrée{rackets.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent}>
        {rackets.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              <RacketIcon size={22} color="#FFFFFF" />
            </View>
            <Text style={s.emptyText}>Aucune raquette enregistrée.</Text>
            <Text style={s.emptySubText}>Ajoutez vos raquettes pour accélérer vos prochaines prises de rendez-vous.</Text>
          </View>
        ) : (
          rackets.map((item) => (
            <TouchableOpacity key={item.id} style={s.racketCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
              <View style={s.racketInfo}>
                <Text style={s.racketName}>{item.name}</Text>
                {item.preferred_tension_kg && (
                  <View style={s.tensionBadge}>
                    <Text style={s.tensionText}>Tension habituelle : {item.preferred_tension_kg} kg</Text>
                  </View>
                )}
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={s.editBtn}>
                  <Pencil color={theme.colors.badmintonPrimary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                  <Trash2 color={theme.colors.alert} size={18} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={s.floatingActionContainer}>
        <TouchableOpacity style={s.addButton} onPress={openAddModal}>
          <Plus color="#FFFFFF" size={24} />
          <Text style={s.addButtonText}>Ajouter une raquette</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={s.modalDismissArea} />
          </TouchableWithoutFeedback>

          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editingItem ? 'Modifier la raquette' : 'Nouvelle raquette'}</Text>

            <Text style={s.inputLabel}>Modèle de la raquette</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: Yonex Astrox 88D Pro"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={s.inputLabel}>Tension habituelle (kg) — Optionnel</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: 11.5"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              value={tension}
              onChangeText={setTension}
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSave, { backgroundColor: theme.colors.badmintonPrimary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.modalSaveText}>{editingItem ? 'Enregistrer' : 'Ajouter'}</Text>
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
  loadingContainer: {
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
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  racketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  racketInfo: {
    flex: 1,
  },
  racketName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  tensionBadge: {
    marginTop: 6,
  },
  tensionText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    backgroundColor: theme.colors.badmintonPrimary + '15',
    borderRadius: 14,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: theme.colors.alert + '15',
    borderRadius: 14,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 30,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.badmintonPrimary,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.elevated,
  },
  addButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: '#FFFFFF',
    marginLeft: 8,
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
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
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
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  }
});
