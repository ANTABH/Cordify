import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Pencil, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { RacketIcon } from '../../components/RacketIcon';
import { EquipmentIcon } from '../../components/EquipmentIcon';
import { StringReelIcon } from '../../components/StringReelIcon';
import { AddRacketLogo } from '../../components/AddRacketLogo';
import { AddStringLogo } from '../../components/AddStringLogo';

export const RacketsScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'rackets' | 'strings'>('rackets');
  
  const [rackets, setRackets] = useState<any[]>([]);
  const [clientStrings, setClientStrings] = useState<any[]>([]);
  
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarBottomOffset = 85 + 8 + insets.bottom;

  // Modal states for Racket
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [tension, setTension] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  // Additional modal state for String
  const [stringType, setStringType] = useState<'garniture' | 'bobine'>('garniture');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const [racketsRes, stringsRes] = await Promise.all([
        supabase.from('rackets').select('*').eq('client_id', userId).order('created_at', { ascending: false }),
        supabase.from('client_strings').select('*').eq('client_id', userId).order('created_at', { ascending: false })
      ]);

      if (racketsRes.error) throw racketsRes.error;
      // Note: If client_strings table doesn't exist yet, it might error here in real app, we log but don't break
      if (stringsRes.error) {
        console.warn('Strings fetch error, maybe table missing:', stringsRes.error);
      } else {
        setClientStrings(stringsRes.data || []);
      }

      setRackets(racketsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setTension('');
    setStringType('garniture');
    setQuantity('1');
    setPhotoBase64(null);
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setPhotoBase64(item.photo_url || null);
    if (viewMode === 'rackets') {
      setTension(item.preferred_tension_kg?.toString() || '');
    } else {
      setStringType(item.type || 'garniture');
      setQuantity(item.quantity?.toString() || '1');
    }
    setModalVisible(true);
  };

  const pickImage = () => {
    Alert.alert('Photo', 'Choisissez une option de capture', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Permission refusée', 'La permission de la caméra est requise.');
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true });
          if (!result.canceled && result.assets[0].base64) setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      },
      {
        text: 'Choisir depuis la galerie',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true });
          if (!result.canceled && result.assets[0].base64) setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      },
      { text: 'Annuler', style: 'cancel' }
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Erreur', 'Veuillez renseigner un nom.');

    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      if (viewMode === 'rackets') {
        const tensionNum = parseFloat(tension.replace(',', '.'));
        const payload: any = { name: name.trim(), preferred_tension_kg: tension ? tensionNum : null, client_id: userId, photo_url: photoBase64 };
        if (editingItem) await supabase.from('rackets').update(payload).eq('id', editingItem.id);
        else await supabase.from('rackets').insert(payload);
      } else {
        const payload: any = { 
          name: name.trim(), 
          type: stringType, 
          quantity: parseInt(quantity) || 1,
          client_id: userId, 
          photo_url: photoBase64 
        };
        if (editingItem) await supabase.from('client_strings').update(payload).eq('id', editingItem.id);
        else await supabase.from('client_strings').insert(payload);
      }

      setModalVisible(false);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible denregistrer l\'équipement (Assurez-vous que la modification SQL a été faite)');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cet équipement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await supabase.from(table).delete().eq('id', id);
            fetchEquipment();
          } catch (err) {
            Alert.alert("Erreur", "Impossible de supprimer");
          }
        }
      }
    ]);
  };

  const s = styles(theme);

  if (loading && rackets.length === 0 && clientStrings.length === 0) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingContainer}><ActivityIndicator size="large" color={theme.colors.badmintonPrimary} /></View>
      </SafeAreaView>
    );
  }

  const items = viewMode === 'rackets' ? rackets : clientStrings;

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Mon Équipement</Text>
          <Text style={s.headerSubtitle}>{items.length} {viewMode === 'rackets' ? 'raquette(s)' : 'cordage(s)'}</Text>
        </View>
        <TouchableOpacity style={s.headerAddButton} onPress={openAddModal} activeOpacity={0.7}>
          <Text style={s.headerAddButtonText}>Ajouter</Text>
          {viewMode === 'rackets' ? (
            <AddRacketLogo size={28} color={isDark ? '#FFFFFF' : '#000000'} plusColor={theme.colors.badmintonPrimary} />
          ) : (
            <AddStringLogo size={28} color={isDark ? '#FFFFFF' : '#000000'} plusColor={theme.colors.badmintonPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <View style={s.toggleContainer}>
          <TouchableOpacity style={[s.toggleButton, viewMode === 'rackets' && s.toggleActive]} onPress={() => setViewMode('rackets')}>
            <Text style={[s.toggleText, viewMode === 'rackets' && s.toggleTextActive]}>Raquettes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleButton, viewMode === 'strings' && s.toggleActive]} onPress={() => setViewMode('strings')}>
            <Text style={[s.toggleText, viewMode === 'strings' && s.toggleTextActive]}>Mes Cordages</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarBottomOffset + 24 }]}>
        {items.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              {viewMode === 'rackets' ? <RacketIcon size={22} color="#FFFFFF" /> : <StringReelIcon size={22} color="#FFFFFF" />}
            </View>
            <Text style={s.emptyText}>Aucun{viewMode === 'rackets' ? 'e raquette' : ' cordage'} enregistré{viewMode === 'rackets' ? 'e' : ''}.</Text>
            <TouchableOpacity style={s.emptyAddButton} onPress={openAddModal}>
              <Text style={s.emptyAddButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity key={item.id} style={s.racketCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
              {item.photo_url && <Image source={{ uri: item.photo_url }} style={s.racketThumbnail} />}
              <View style={s.racketInfo}>
                <Text style={s.racketName}>{item.name}</Text>
                {viewMode === 'rackets' && item.preferred_tension_kg && (
                  <View style={s.tensionBadge}><Text style={s.tensionText}>Tension habituelle : {item.preferred_tension_kg} kg</Text></View>
                )}
                {viewMode === 'strings' && (
                  <View style={s.tensionBadge}>
                    <Text style={s.tensionText}>
                      {item.type === 'bobine' ? 'Bobine' : 'Garniture'} • Qté : {item.quantity || 1}
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={s.editBtn}><Pencil color={theme.colors.badmintonPrimary} size={18} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, viewMode === 'rackets' ? 'rackets' : 'client_strings')} style={s.deleteBtn}><Trash2 color={theme.colors.alert} size={18} /></TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}><View style={s.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editingItem ? 'Modifier' : 'Ajouter'} {viewMode === 'rackets' ? 'la raquette' : 'le cordage'}</Text>
            
            <Text style={s.inputLabel}>Modèle</Text>
            <TextInput style={s.input} placeholder={viewMode === 'rackets' ? "Ex: Yonex Astrox 88D Pro" : "Ex: BG66 Ultimax"} placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
            
            {viewMode === 'strings' && (
              <>
                <Text style={s.inputLabel}>Type de cordage</Text>
                <View style={[s.toggleContainer, { marginBottom: theme.spacing.md, height: 50 }]}>
                    <TouchableOpacity style={[s.toggleButton, stringType === 'garniture' && s.toggleActive]} onPress={() => setStringType('garniture')}>
                      <Text style={[s.toggleText, stringType === 'garniture' && s.toggleTextActive]}>Garniture (12m)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.toggleButton, stringType === 'bobine' && s.toggleActive]} onPress={() => setStringType('bobine')}>
                      <Text style={[s.toggleText, stringType === 'bobine' && s.toggleTextActive]}>Bobine (200m)</Text>
                    </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={s.inputLabel}>Photo</Text>
            <TouchableOpacity style={s.photoScnBtn} onPress={pickImage}>
              {photoBase64 ? <Image source={{ uri: photoBase64 }} style={s.photoPreview} /> : <View style={s.photoPlaceholder}><Camera size={24} color={theme.colors.textSecondary} /><Text style={s.photoPlaceholderText}>Ajouter une photo</Text></View>}
            </TouchableOpacity>

            {viewMode === 'rackets' && (
              <>
                <Text style={s.inputLabel}>Tension habituelle (kg)</Text>
                <TextInput style={s.input} placeholder="Ex: 11.5" placeholderTextColor={theme.colors.textSecondary} keyboardType="decimal-pad" value={tension} onChangeText={setTension} />
              </>
            )}

            {viewMode === 'strings' && (
              <>
                <Text style={s.inputLabel}>Quantité en stock</Text>
                <TextInput style={s.input} placeholder="Ex: 1" placeholderTextColor={theme.colors.textSecondary} keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />
              </>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setModalVisible(false)} disabled={saving}><Text style={s.modalCancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalSave, { backgroundColor: theme.colors.badmintonPrimary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.modalSaveText}>{editingItem ? 'Enregistrer' : 'Ajouter'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, justifyContent: 'space-between' },
  headerAddButton: { paddingLeft: 16, paddingRight: 8, height: 44, borderRadius: 22, backgroundColor: theme.colors.badmintonPrimary + '20', flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.colors.badmintonPrimary + '40' },
  headerAddButtonText: { fontFamily: theme.typography.fonts.bold, fontSize: 14, color: theme.isDark ? '#FFFFFF' : '#000000', marginRight: 2 },
  headerTitle: { fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.h2, color: theme.colors.textPrimary },
  headerSubtitle: { fontFamily: theme.typography.fonts.regular, fontSize: theme.typography.sizes.subtext, color: theme.colors.textSecondary, marginTop: 2 },
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.isDark ? '#2C3E50' : '#EAECEF', borderRadius: 24, padding: 4, height: 48 },
  toggleButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  toggleActive: { backgroundColor: theme.colors.surface, ...theme.shadows.soft },
  toggleText: { fontFamily: theme.typography.fonts.medium, fontSize: theme.typography.sizes.subtext, color: theme.colors.textSecondary },
  toggleTextActive: { color: theme.colors.textPrimary, fontFamily: theme.typography.fonts.semiBold },
  scrollContent: { padding: theme.spacing.md },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.lg, ...theme.shadows.soft },
  emptyText: { fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  emptyAddButton: { backgroundColor: theme.colors.badmintonPrimary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, ...theme.shadows.soft },
  emptyAddButtonText: { fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.body, color: '#FFFFFF' },
  racketCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: theme.spacing.md, marginBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...theme.shadows.soft },
  racketInfo: { flex: 1 },
  racketName: { fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.body, color: theme.colors.textPrimary },
  tensionBadge: { marginTop: 6 },
  tensionText: { fontFamily: theme.typography.fonts.medium, fontSize: 13, color: theme.colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: theme.colors.badmintonPrimary + '15', borderRadius: 14 },
  deleteBtn: { padding: 8, backgroundColor: theme.colors.alert + '15', borderRadius: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: theme.spacing.lg, paddingBottom: 40 },
  modalTitle: { fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  inputLabel: { fontFamily: theme.typography.fonts.semiBold, fontSize: theme.typography.sizes.subtext, color: theme.colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, fontFamily: theme.typography.fonts.medium, fontSize: theme.typography.sizes.body, color: theme.colors.textPrimary, marginBottom: theme.spacing.md, ...theme.shadows.soft },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  modalCancel: { flex: 1, padding: 16, borderRadius: 24, backgroundColor: theme.colors.surface, alignItems: 'center' },
  modalCancelText: { fontFamily: theme.typography.fonts.semiBold, color: theme.colors.textSecondary },
  modalSave: { flex: 2, padding: 16, borderRadius: 24, alignItems: 'center' },
  modalSaveText: { fontFamily: theme.typography.fonts.bold, color: '#FFFFFF' },
  racketThumbnail: { width: 60, height: 60, borderRadius: 12, marginRight: 16, backgroundColor: theme.colors.border },
  photoScnBtn: { backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: theme.spacing.md, overflow: 'hidden', height: 160, width: 160, alignSelf: 'center', ...theme.shadows.soft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center', gap: 8 },
  photoPlaceholderText: { fontFamily: theme.typography.fonts.medium, color: theme.colors.textSecondary, fontSize: theme.typography.sizes.subtext }
});
