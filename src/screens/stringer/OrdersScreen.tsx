import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Clock, CheckCircle2, XCircle, PartyPopper, Phone, Mail, User, ChevronDown } from 'lucide-react-native';

type OrderStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  applied_tension_kg: number | null;
  scheduled_time: string | null;
  completed_at: string | null;
  created_at: string;
  racket: {
    name: string;
  } | null;
  client: {
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
    club: string | null;
  } | null;
  stock_item: {
    custom_name: string | null;
    price: number;
    includes_labor: boolean;
    reference_strings: {
      name: string;
      brand: string;
    } | null;
  } | null;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; emoji: string; colorKey: string }> = {
  pending: { label: 'En attente', emoji: '⏳', colorKey: 'warning' },
  accepted: { label: 'Acceptée', emoji: '✅', colorKey: 'tennisPrimary' },
  completed: { label: 'Terminée', emoji: '🎉', colorKey: 'success' },
  cancelled: { label: 'Annulée', emoji: '❌', colorKey: 'alert' },
};

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptées' },
  { key: 'completed', label: 'Terminées' },
  { key: 'cancelled', label: 'Annulées' },
];

export const OrdersScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          applied_tension_kg,
          scheduled_time,
          completed_at,
          created_at,
          racket:rackets(name),
          client:profiles!appointments_client_id_fkey(first_name, last_name, phone, email, club),
          stock_item:stock!appointments_stock_id_fkey(
            custom_name,
            price,
            includes_labor,
            reference_strings(name, brand)
          )
        `)
        .eq('stringer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(true);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, ...updateData } : o
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updateData });
      }

      if (newStatus === 'completed') {
        // Create notification for the client
        const order = orders.find(o => o.id === orderId);
        if (order?.client) {
          await supabase.from('notifications').insert({
            user_id: (order as any).client_id || session?.user?.id,
            title: '🎉 Raquette prête !',
            body: `Votre raquette ${order.racket?.name || ''} est prête à être récupérée.`,
            type: 'appointment_ready',
            related_entity_id: orderId,
          });
        }
      }

      const statusLabel = STATUS_CONFIG[newStatus].label.toLowerCase();
      Alert.alert('Succès', `Commande marquée comme "${statusLabel}"`);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReadyPress = (order: Order) => {
    Alert.alert(
      '🎉 C\'est prêt !',
      `Confirmer que la raquette "${order.racket?.name || 'Raquette'}" est prête ?\n\nLe client sera notifié automatiquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => updateOrderStatus(order.id, 'completed'),
        },
      ]
    );
  };

  const handleAcceptPress = (order: Order) => {
    Alert.alert(
      'Accepter la commande',
      `Accepter la commande pour "${order.racket?.name || 'Raquette'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => updateOrderStatus(order.id, 'accepted'),
        },
      ]
    );
  };

  const handleCancelPress = (order: Order) => {
    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la commande',
          style: 'destructive',
          onPress: () => updateOrderStatus(order.id, 'cancelled'),
        },
      ]
    );
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStringName = (order: Order) => {
    if (order.stock_item?.reference_strings?.name) return order.stock_item.reference_strings.name;
    if (order.stock_item?.custom_name) return order.stock_item.custom_name;
    return 'Cordage non spécifié';
  };

  const s = styles(theme);

  if (loading && orders.length === 0) {
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
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Commandes</Text>
          <Text style={s.headerSubtitle}>{orders.length} commande{orders.length > 1 ? 's' : ''} au total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterTab, filter === f.key && s.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterTabText, filter === f.key && s.filterTabTextActive]}>
              {f.label}
            </Text>
            {f.key !== 'all' && (
              <View style={[s.filterBadge, filter === f.key && s.filterBadgeActive]}>
                <Text style={[s.filterBadgeText, filter === f.key && s.filterBadgeTextActive]}>
                  {orders.filter(o => o.status === f.key).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.badmintonPrimary} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyText}>
              {filter === 'all' ? 'Aucune commande pour le moment' : `Aucune commande "${FILTERS.find(f => f.key === filter)?.label}"`}
            </Text>
            <Text style={s.emptySubText}>
              Les commandes de vos clients apparaîtront ici.
            </Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const statusConf = STATUS_CONFIG[order.status];
            const statusColor = (theme.colors as any)[statusConf.colorKey];

            return (
              <TouchableOpacity
                key={order.id}
                style={s.orderCard}
                onPress={() => openOrderDetail(order)}
                activeOpacity={0.7}
              >
                <View style={s.orderCardTop}>
                  <View style={s.orderNameRow}>
                    <Text style={s.orderRacketName}>{order.racket?.name || 'Raquette inconnue'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={{ color: statusColor, fontFamily: theme.typography.fonts.semiBold, fontSize: 12 }}>
                      {statusConf.emoji} {statusConf.label}
                    </Text>
                  </View>
                </View>

                <View style={s.orderCardMid}>
                  <Text style={s.orderInfoText}>
                    🧵 {getStringName(order)}
                    {order.applied_tension_kg ? ` · ${order.applied_tension_kg} kg` : ''}
                  </Text>
                  <Text style={s.orderInfoText}>
                    👤 {order.client?.first_name} {order.client?.last_name}
                  </Text>
                </View>

                <View style={s.orderCardBottom}>
                  <Text style={s.orderDate}>
                    {order.scheduled_time
                      ? `📅 ${formatDate(order.scheduled_time)} · ${formatTime(order.scheduled_time)}`
                      : `📅 ${formatDate(order.created_at)}`
                    }
                  </Text>

                  {order.status === 'pending' && (
                    <View style={s.quickActions}>
                      <TouchableOpacity
                        style={[s.quickBtn, { backgroundColor: theme.colors.success }]}
                        onPress={(e) => { e.stopPropagation?.(); handleAcceptPress(order); }}
                      >
                        <Text style={s.quickBtnText}>Accepter</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {order.status === 'accepted' && (
                    <View style={s.quickActions}>
                      <TouchableOpacity
                        style={[s.quickBtn, { backgroundColor: theme.colors.badmintonPrimary }]}
                        onPress={(e) => { e.stopPropagation?.(); handleReadyPress(order); }}
                      >
                        <Text style={s.quickBtnText}>🎉 C'est prêt !</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalDismissArea} onPress={() => setModalVisible(false)} />
          <View style={s.modalContent}>
            {selectedOrder && (() => {
              const statusConf = STATUS_CONFIG[selectedOrder.status];
              const statusColor = (theme.colors as any)[statusConf.colorKey];

              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Order Header */}
                  <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>{selectedOrder.racket?.name || 'Raquette'}</Text>
                    <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={{ color: statusColor, fontFamily: theme.typography.fonts.semiBold, fontSize: 14 }}>
                        {statusConf.emoji} {statusConf.label}
                      </Text>
                    </View>
                  </View>

                  {/* Cordage Info */}
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Cordage</Text>
                    <View style={s.detailCard}>
                      <Text style={s.detailText}>🧵 {getStringName(selectedOrder)}</Text>
                      {selectedOrder.stock_item?.reference_strings?.brand && (
                        <Text style={s.detailSubText}>{selectedOrder.stock_item.reference_strings.brand}</Text>
                      )}
                      {selectedOrder.applied_tension_kg && (
                        <Text style={s.detailText}>
                          ⚡ Tension : {selectedOrder.applied_tension_kg} kg / {(selectedOrder.applied_tension_kg * 2.20462).toFixed(1)} lbs
                        </Text>
                      )}
                      {selectedOrder.stock_item && (
                        <Text style={s.detailText}>
                          💰 {selectedOrder.stock_item.price} € {selectedOrder.stock_item.includes_labor ? '(pose incluse)' : '(sans pose)'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Client Info */}
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Coordonnées du client</Text>
                    <View style={s.detailCard}>
                      <View style={s.contactRow}>
                        <User size={18} color={theme.colors.textSecondary} />
                        <Text style={s.detailText}>
                          {selectedOrder.client?.first_name} {selectedOrder.client?.last_name}
                        </Text>
                      </View>
                      {selectedOrder.client?.club && (
                        <Text style={s.detailSubText}>🏸 Club : {selectedOrder.client.club}</Text>
                      )}
                      {selectedOrder.client?.phone && (
                        <View style={s.contactRow}>
                          <Phone size={18} color={theme.colors.textSecondary} />
                          <Text style={s.detailText}>{selectedOrder.client.phone}</Text>
                        </View>
                      )}
                      {selectedOrder.client?.email && (
                        <View style={s.contactRow}>
                          <Mail size={18} color={theme.colors.textSecondary} />
                          <Text style={s.detailText}>{selectedOrder.client.email}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Dates */}
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Dates</Text>
                    <View style={s.detailCard}>
                      <Text style={s.detailText}>📅 Créée le {formatDate(selectedOrder.created_at)}</Text>
                      {selectedOrder.scheduled_time && (
                        <Text style={s.detailText}>
                          🕐 RDV : {formatDate(selectedOrder.scheduled_time)} à {formatTime(selectedOrder.scheduled_time)}
                        </Text>
                      )}
                      {selectedOrder.completed_at && (
                        <Text style={s.detailText}>
                          ✅ Terminée le {formatDate(selectedOrder.completed_at)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={s.modalActions}>
                    {selectedOrder.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: theme.colors.success }]}
                          onPress={() => handleAcceptPress(selectedOrder)}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <>
                              <CheckCircle2 size={20} color="#FFF" />
                              <Text style={s.actionBtnText}>Accepter</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: theme.colors.alert }]}
                          onPress={() => handleCancelPress(selectedOrder)}
                          disabled={updatingStatus}
                        >
                          <XCircle size={20} color="#FFF" />
                          <Text style={s.actionBtnText}>Refuser</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {selectedOrder.status === 'accepted' && (
                      <>
                        <TouchableOpacity
                          style={[s.readyBtn]}
                          onPress={() => handleReadyPress(selectedOrder)}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <>
                              <PartyPopper size={24} color="#FFF" />
                              <Text style={s.readyBtnText}>C'est prêt !</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: theme.colors.alert + '20' }]}
                          onPress={() => handleCancelPress(selectedOrder)}
                          disabled={updatingStatus}
                        >
                          <XCircle size={20} color={theme.colors.alert} />
                          <Text style={[s.actionBtnText, { color: theme.colors.alert }]}>Annuler</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {/* Close button */}
                  <TouchableOpacity style={s.closeBtn} onPress={() => setModalVisible(false)}>
                    <Text style={s.closeBtnText}>Fermer</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
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
    alignItems: 'center',
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
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    gap: 6,
    ...theme.shadows.soft,
  },
  filterTabActive: {
    backgroundColor: theme.colors.badmintonPrimary,
  },
  filterTabText: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderNameRow: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  orderRacketName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  orderCardMid: {
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  orderInfoText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  orderDate: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.badge,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickBtnText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  // Modal
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  detailSection: {
    marginBottom: theme.spacing.md,
  },
  detailSectionTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.md,
    gap: 8,
    ...theme.shadows.soft,
  },
  detailText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  detailSubText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginLeft: 26,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 24,
  },
  actionBtnText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: '#FFFFFF',
  },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 28,
    backgroundColor: theme.colors.badmintonPrimary,
    ...theme.shadows.elevated,
  },
  readyBtnText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: '#FFFFFF',
  },
  closeBtn: {
    alignItems: 'center',
    padding: 16,
    marginTop: theme.spacing.sm,
  },
  closeBtnText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
});
