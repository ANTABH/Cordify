import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Save, User, MapPin, AlignLeft, Euro, CreditCard, Dumbbell, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const PAYMENT_OPTIONS = [
  { id: 'cb', label: 'Carte Bancaire' },
  { id: 'cash', label: 'Espèces' },
  { id: 'lydia', label: 'Lydia / Paylib' },
  { id: 'transfer', label: 'Virement' },
];

const SPORT_OPTIONS = [
  { id: 'badminton', label: 'Badminton' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'squash', label: 'Squash' },
  { id: 'padel', label: 'Padel' },
];

export const PublicProfileEditScreen = () => {
  const { theme } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Stringer profile data
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'independant' | 'boutique'>('independant');
  const [laborPrice, setLaborPrice] = useState('10');
  const [selectedSports, setSelectedSports] = useState<string[]>(['badminton']);
  const [selectedPayments, setSelectedPayments] = useState<string[]>(['cash']);

  const s = styles(theme);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setAvatarUrl(profileData.avatar_url || null);

      const { data: stringerData, error: stringerError } = await supabase
        .from('stringer_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (stringerError && stringerError.code !== 'PGRST116') {
        throw stringerError;
      }

      if (stringerData) {
        setDescription(stringerData.description || '');
        setAddress(stringerData.address || '');
        setType(stringerData.type || 'independant');
        setLaborPrice(stringerData.labor_price?.toString() || '10');
        setSelectedSports(stringerData.sports || ['badminton']);
        setSelectedPayments(stringerData.payment_methods || ['cash']);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Extract file extension
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Convert URI to blob (needed for React Native Supabase storage upload)
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData);

      if (uploadError) {
        console.warn('Bucket error detail:', uploadError);
        throw new Error('Assurez-vous que le bucket "avatars" existe et est public.');
      }

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);

    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Erreur Upload', error.message || 'Impossible d\'envoyer l\'image.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !address) {
      Alert.alert('Champs requis', 'Veuillez remplir votre nom, prénom et adresse.');
      return;
    }

    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) return;

      // Update profiles
      const { error: pError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl
        })
        .eq('id', userId);

      if (pError) throw pError;

      // Update stringer_profiles
      const priceNum = parseFloat(laborPrice.replace(',', '.'));
      
      const { error: sError } = await supabase
        .from('stringer_profiles')
        .upsert({
          id: userId,
          type,
          description,
          address,
          labor_price: isNaN(priceNum) ? 10 : priceNum,
          sports: selectedSports,
          payment_methods: selectedPayments
        });

      if (sError) throw sError;

      Alert.alert('Succès', 'Votre fiche publique a été mise à jour !');
      navigation.goBack();

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur de sauvegarde', error.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={s.headerTitle}>Fiche Publique</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION: Photo & Name */}
        <View style={s.section}>
          <View style={s.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={s.avatarButton}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <User color={theme.colors.textSecondary} size={40} />
                </View>
              )}
              <View style={s.uploadBadge}>
                <Upload color="#FFF" size={14} />
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>Photo de profil publique</Text>
          </View>

          <View style={s.row}>
            <View style={s.inputContainerRow}>
              <Text style={s.inputLabel}>Prénom</Text>
              <TextInput
                style={s.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ex: Jean"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={s.inputContainerRow}>
              <Text style={s.inputLabel}>Nom</Text>
              <TextInput
                style={s.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ex: Dupont"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* SECTION: Pro Infos */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Présentation</Text>
          
          <View style={s.typeToggleContainer}>
            <TouchableOpacity 
              style={[s.typeBtn, type === 'independant' && s.typeBtnActive]} 
              onPress={() => setType('independant')}
            >
              <Text style={[s.typeBtnText, type === 'independant' && s.typeBtnTextActive]}>Indépendant</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.typeBtn, type === 'boutique' && s.typeBtnActive]} 
              onPress={() => setType('boutique')}
            >
              <Text style={[s.typeBtnText, type === 'boutique' && s.typeBtnTextActive]}>Boutique</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.inputLabel}>À propos de vous (Bio)</Text>
          <View style={[s.input, s.textAreaContainer]}>
            <AlignLeft size={20} color={theme.colors.textSecondary} style={{marginTop: 4, marginRight: 8}} />
            <TextInput
              style={s.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Cordeur certifié depuis 10 ans..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* SECTION: Address & Price */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Infos Pratiques</Text>
          
          <Text style={s.inputLabel}>Adresse de dépôt</Text>
          <View style={s.inputWithIcon}>
            <MapPin size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={s.inputFlex}
              value={address}
              onChangeText={setAddress}
              placeholder="Ville ou adresse complète"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <Text style={s.inputLabel}>Tarif Main d'œuvre (Pose uniquement)</Text>
          <View style={s.inputWithIcon}>
            <Euro size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={s.inputFlex}
              value={laborPrice}
              onChangeText={setLaborPrice}
              placeholder="10"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={s.currencyLabel}>€ / pose</Text>
          </View>
          <Text style={s.inputHint}>Prix facturé quand le client fournit son propre cordage.</Text>
        </View>

        {/* SECTION: Sports */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sports acceptés</Text>
          <View style={s.tagsContainer}>
            {SPORT_OPTIONS.map(sport => {
              const isSelected = selectedSports.includes(sport.id);
              return (
                <TouchableOpacity 
                  key={sport.id}
                  style={[s.tagBtn, isSelected && {backgroundColor: theme.colors.tennisPrimary, borderColor: theme.colors.tennisPrimary}]}
                  onPress={() => toggleSelection(sport.id, selectedSports, setSelectedSports)}
                >
                  <Dumbbell size={16} color={isSelected ? '#FFF' : theme.colors.textSecondary} />
                  <Text style={[s.tagText, isSelected && {color: '#FFF'}]}>{sport.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* SECTION: Payments */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Moyens de paiement</Text>
          <View style={s.tagsContainer}>
            {PAYMENT_OPTIONS.map(payment => {
              const isSelected = selectedPayments.includes(payment.id);
              return (
                <TouchableOpacity 
                  key={payment.id}
                  style={[s.tagBtn, isSelected && {backgroundColor: theme.colors.badmintonPrimary, borderColor: theme.colors.badmintonPrimary}]}
                  onPress={() => toggleSelection(payment.id, selectedPayments, setSelectedPayments)}
                >
                  <CreditCard size={16} color={isSelected ? '#FFF' : theme.colors.textSecondary} />
                  <Text style={[s.tagText, isSelected && {color: '#FFF'}]}>{payment.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity 
          style={s.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text style={s.saveButtonText}>Mettre à jour la fiche</Text>
            </>
          )}
        </TouchableOpacity>

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
    paddingBottom: 60,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    ...theme.shadows.soft,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.badmintonPrimary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarHint: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputContainerRow: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  inputHint: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputFlex: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  currencyLabel: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.textSecondary,
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  textArea: {
    flex: 1,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 16,
    color: theme.colors.textPrimary,
    minHeight: 80,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  typeBtnActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.soft,
  },
  typeBtnText: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
  },
  typeBtnTextActive: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tagText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: theme.colors.badmintonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
    ...theme.shadows.elevated,
  },
  saveButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
    color: '#FFF',
  }
});
