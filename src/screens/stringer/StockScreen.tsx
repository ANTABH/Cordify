import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert, Modal, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react-native';

export const StockScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<any[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [customName, setCustomName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [sport, setSport] = useState<'badminton' | 'tennis'>('badminton');
  const [includesLabor, setIncludesLabor] = useState(true);
  const [saving, setSaving] = useState(false);

  // Track initial form values to detect changes
  const [initialFormValues, setInitialFormValues] = useState({
    customName: '', price: '', quantity: '1', sport: 'badminton' as string, includesLabor: true
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    return (
      customName !== initialFormValues.customName ||
      price !== initialFormValues.price ||
      quantity !== initialFormValues.quantity ||
      sport !== initialFormValues.sport ||
      includesLabor !== initialFormValues.includesLabor
    );
  }, [customName, price, quantity, sport, includesLabor, initialFormValues]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('stock')
        .select(`
          id,
          price,
          includes_labor,
          custom_name,
          quantity,
          sport,
          reference_strings(name, brand)
        `)
        .eq('stringer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStock(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de charger le stock');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCustomName('');
    setPrice('');
    setQuantity('1');
    setSport('badminton');
    setIncludesLabor(true);
    setInitialFormValues({ customName: '', price: '', quantity: '1', sport: 'badminton', includesLabor: true });
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    const name = item.reference_strings?.name || item.custom_name || '';
    const p = String(item.price);
    const q = String(item.quantity || 1);
    const s = item.sport || 'badminton';
    const l = item.includes_labor;

    setEditingItem(item);
    setCustomName(name);
    setPrice(p);
    setQuantity(q);
    setSport(s);
    setIncludesLabor(l);
    setInitialFormValues({ customName: name, price: p, quantity: q, sport: s, includesLabor: l });
    setModalVisible(true);
  };

  const confirmClose = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Modifications non sauvegardées',
        'Voulez-vous sauvegarder vos modifications avant de quitter ?',
        [
          { text: 'Ne pas sauvegarder', style: 'destructive', onPress: forceClose },
          { text: 'Continuer à modifier', style: 'cancel' },
          { text: 'Sauvegarder', onPress: handleSave },
        ]
      );
    } else {
      forceClose();
    }
  };

  const forceClose = () => {
    setModalVisible(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!customName.trim() || !price.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et le prix.');
      return;
    }

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum)) {
      Alert.alert('Erreur', 'Prix invalide.');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 0) {
      Alert.alert('Erreur', 'Quantité invalide.');
      return;
    }

    try {
      setSaving(true);
      const userId = session?.user?.id;

      if (editingItem) {
        const { error } = await supabase.from('stock').update({
          custom_name: customName.trim(),
          price: priceNum,
          quantity: quantityNum,
          sport: sport,
          includes_labor: includesLabor
        }).eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('stock').insert({
          stringer_id: userId,
          custom_name: customName.trim(),
          price: priceNum,
          quantity: quantityNum,
          sport: sport,
          includes_labor: includesLabor
        });

        if (error) throw error;
      }

      setModalVisible(false);
      setEditingItem(null);
      fetchStock();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', editingItem ? 'Impossible de modifier' : 'Impossible d\'ajouter au stock');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment retirer ce cordage de votre stock ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('stock').delete().eq('id', id);
              if (error) throw error;
              setStock(stock.filter(item => item.id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert("Erreur", "Impossible de supprimer");
            }
          }
        }
      ]
    );
  };

  if (loading && stock.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mon Stock</Text>
          <Text style={styles.headerSubtitle}>{stock.length} cordage{stock.length > 1 ? 's' : ''} enregistré{stock.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {stock.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Votre stock est vide.</Text>
            <Text style={styles.emptySubText}>Ajoutez vos premiers cordages pour commencer à recevoir des prises de rendez-vous.</Text>
          </View>
        ) : (
          stock.map((item) => (
            <TouchableOpacity key={item.id} style={styles.stockCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
              <View style={styles.stockInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.sportEmoji}>{item.sport === 'tennis' ? '🎾' : '🏸'}</Text>
                  <Text style={styles.stockName}>{item.reference_strings?.name || item.custom_name}</Text>
                </View>
                {item.reference_strings?.brand && (
                  <Text style={styles.stockBrand}>{item.reference_strings.brand}</Text>
                )}
                <View style={styles.badgeRow}>
                  <View style={styles.laborBadge}>
                    <Text style={styles.laborText}>
                      {item.includes_labor ? 'Pose incluse' : 'Sans pose'}
                    </Text>
                  </View>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>
                      {item.quantity || 0} disponible{(item.quantity || 0) > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.stockActions}>
                <Text style={styles.stockPrice}>{item.price} €</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                    <Pencil color={theme.colors.tennisPrimary} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Trash2 color={theme.colors.alert} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bouton Ajouter */}
      <View style={styles.floatingActionContainer}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus color={theme.colors.surface} size={24} />
          <Text style={styles.addButtonText}>Ajouter un cordage</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Ajout / Édition */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Zone sombre cliquable pour fermer */}
          <TouchableWithoutFeedback onPress={confirmClose}>
            <View style={styles.modalDismissArea} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Modifier le cordage' : 'Nouveau cordage'}</Text>
            
            <Text style={styles.inputLabel}>Nom personnalisé</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Yonex BG65 Ti"
              placeholderTextColor={theme.colors.textSecondary}
              value={customName}
              onChangeText={setCustomName}
            />

            {/* Sport selector */}
            <Text style={styles.inputLabel}>Sport</Text>
            <View style={styles.sportSelector}>
              <TouchableOpacity 
                style={[styles.sportBtn, sport === 'badminton' && styles.sportBtnActiveBad]}
                onPress={() => setSport('badminton')}
              >
                <Text style={styles.sportBtnEmoji}>🏸</Text>
                <Text style={[styles.sportBtnText, sport === 'badminton' && styles.sportBtnTextActive]}>Badminton</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sportBtn, sport === 'tennis' && styles.sportBtnActiveTen]}
                onPress={() => setSport('tennis')}
              >
                <Text style={styles.sportBtnEmoji}>🎾</Text>
                <Text style={[styles.sportBtnText, sport === 'tennis' && styles.sportBtnTextActive]}>Tennis</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Prix (€)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="18.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Quantité</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
            </View>

            <View style={styles.laborToggleContainer}>
              <Text style={styles.inputLabel}>Main d'oeuvre incluse</Text>
              <Switch
                value={includesLabor}
                onValueChange={setIncludesLabor}
                trackColor={{ false: theme.colors.border, true: theme.colors.badmintonPrimary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={confirmClose} disabled={saving}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalSaveText}>{editingItem ? 'Enregistrer' : 'Ajouter'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
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
  },
  stockCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  stockInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportEmoji: {
    fontSize: 20,
  },
  stockName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  stockBrand: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginLeft: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  laborBadge: {
    backgroundColor: theme.colors.badmintonPrimary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  laborText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.badmintonPrimary,
  },
  quantityBadge: {
    backgroundColor: theme.colors.tennisPrimary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.tennisPrimary,
  },
  stockActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  stockPrice: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    backgroundColor: theme.colors.tennisPrimary + '15',
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
    color: theme.colors.surface,
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
  sportSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  sportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    gap: 8,
    ...theme.shadows.soft,
  },
  sportBtnActiveBad: {
    backgroundColor: theme.colors.badmintonPrimary,
  },
  sportBtnActiveTen: {
    backgroundColor: theme.colors.tennisPrimary,
  },
  sportBtnEmoji: {
    fontSize: 18,
  },
  sportBtnText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textPrimary,
  },
  sportBtnTextActive: {
    color: theme.colors.surface,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  laborToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
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
    backgroundColor: theme.colors.badmintonPrimary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.surface,
  }
});
