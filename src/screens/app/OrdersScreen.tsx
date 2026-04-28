import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock, CheckCircle2, XCircle, Bell, ChevronRight, Package, ArrowLeft } from 'lucide-react-native';

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
    photo_url: string | null;
  } | null;
  stringer: {
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  stock_item: {
    custom_name: string | null;
    reference_strings: {
      name: string;
      brand: string;
    } | null;
  } | null;
}

interface AppNotification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  type: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; emoji: string; colorKey: string }> = {
  pending: { label: 'En attente', emoji: '⏳', colorKey: 'warning' },
  accepted: { label: 'En cours', emoji: '🛠️', colorKey: 'tennisPrimary' },
  completed: { label: 'Terminée', emoji: '🎉', colorKey: 'success' },
  cancelled: { label: 'Annulée', emoji: '❌', colorKey: 'alert' },
};

export const OrdersScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Offset pour la TabBar
  const tabBarBottomOffset = 85 + 8 + insets.bottom;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchNotifications()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
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
        racket:rackets(name, photo_url),
        stringer:stringer_profiles(
          profiles:profiles(first_name, last_name)
        ),
        stock_item:stock!appointments_stock_id_fkey(
          custom_name,
          reference_strings(name, brand)
        )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setOrders((data as any) || []);
  };

  const fetchNotifications = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    setNotifications(data || []);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const currentOrder = orders.find(o => o.status === 'pending' || o.status === 'accepted');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const s = styles(theme);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes Commandes</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarBottomOffset + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.badmintonPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        {notifications.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Bell size={20} color={theme.colors.textPrimary} />
              <Text style={s.sectionTitle}>Notifications</Text>
            </View>
            <View style={s.notificationsContainer}>
              {notifications.map(notif => (
                <View key={notif.id} style={s.notificationCard}>
                  <View style={[s.notifDot, { backgroundColor: notif.read ? 'transparent' : theme.colors.badmintonPrimary }]} />
                  <View style={s.notifContent}>
                    <Text style={s.notifTitle}>{notif.title}</Text>
                    <Text style={s.notifBody}>{notif.body}</Text>
                  </View>
                  <Text style={s.notifDate}>{formatDate(notif.created_at)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Main Content Section */}
        {currentOrder ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Commande actuelle</Text>
            <TouchableOpacity style={s.currentOrderCard} activeOpacity={0.9}>
              <View style={s.orderHeader}>
                <View style={s.orderIconContainer}>
                  <Package size={24} color={theme.colors.badmintonPrimary} />
                </View>
                <View style={s.orderMainInfo}>
                  <Text style={s.orderRacketName}>{currentOrder.racket?.name || 'Raquette'}</Text>
                  <Text style={s.orderStringerName}>
                    Cordeur : {currentOrder.stringer?.profiles?.first_name} {currentOrder.stringer?.profiles?.last_name}
                  </Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: (theme.colors as any)[STATUS_CONFIG[currentOrder.status].colorKey] + '20' }]}>
                  <Text style={[s.statusText, { color: (theme.colors as any)[STATUS_CONFIG[currentOrder.status].colorKey] }]}>
                    {STATUS_CONFIG[currentOrder.status].emoji} {STATUS_CONFIG[currentOrder.status].label}
                  </Text>
                </View>
              </View>
              
              <View style={s.orderDetailsRow}>
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>Tension</Text>
                  <Text style={s.detailValue}>{currentOrder.applied_tension_kg || '—'} kg</Text>
                </View>
                <View style={s.detailDivider} />
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>Date</Text>
                  <Text style={s.detailValue}>{formatDate(currentOrder.created_at)}</Text>
                </View>
              </View>

              <View style={s.progressBarContainer}>
                <View style={s.progressBarBackground}>
                  <View style={[s.progressBarFill, { width: currentOrder.status === 'accepted' ? '66%' : '33%' }]} />
                </View>
                <View style={s.progressLabels}>
                  <Text style={s.progressLabel}>Reçue</Text>
                  <Text style={s.progressLabel}>En cours</Text>
                  <Text style={s.progressLabel}>Prête</Text>
                </View>
              </View>
            </TouchableOpacity>

            {historyOrders.length > 0 && (
              <View style={[s.section, { marginTop: 24 }]}>
                <Text style={s.sectionTitle}>Historique</Text>
                <View style={s.historyContainer}>
                  {historyOrders.map(order => (
                    <TouchableOpacity key={order.id} style={s.historyCard}>
                      <View style={s.historyInfo}>
                        <Text style={s.historyRacket}>{order.racket?.name}</Text>
                        <Text style={s.historyMeta}>
                          {formatDate(order.completed_at || order.created_at)} • {order.stringer?.profiles?.first_name}
                        </Text>
                      </View>
                      <View style={s.historyRight}>
                        <View style={[s.smallStatusBadge, { backgroundColor: (theme.colors as any)[STATUS_CONFIG[order.status].colorKey] + '15' }]}>
                          <Text style={[s.smallStatusText, { color: (theme.colors as any)[STATUS_CONFIG[order.status].colorKey] }]}>
                            {STATUS_CONFIG[order.status].label}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={theme.colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : historyOrders.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Historique des commandes</Text>
            <View style={s.historyContainer}>
              {historyOrders.map(order => (
                <TouchableOpacity key={order.id} style={s.historyCard}>
                  <View style={s.historyInfo}>
                    <Text style={s.historyRacket}>{order.racket?.name}</Text>
                    <Text style={s.historyMeta}>
                      {formatDate(order.completed_at || order.created_at)} • {order.stringer?.profiles?.first_name}
                    </Text>
                  </View>
                  <View style={s.historyRight}>
                    <View style={[s.smallStatusBadge, { backgroundColor: (theme.colors as any)[STATUS_CONFIG[order.status].colorKey] + '15' }]}>
                      <Text style={[s.smallStatusText, { color: (theme.colors as any)[STATUS_CONFIG[order.status].colorKey] }]}>
                        {STATUS_CONFIG[order.status].label}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.emptyCurrentOrder}>
            <Text style={s.emptyText}>Vous n'avez passé aucune commande.</Text>
            <TouchableOpacity 
              style={s.bookButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={s.bookButtonText}>Trouver un cordeur</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  notificationsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  notifBody: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
  },
  notifDate: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  currentOrderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    padding: theme.spacing.lg,
    ...theme.shadows.elevated,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.badmintonPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  orderMainInfo: {
    flex: 1,
  },
  orderRacketName: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  orderStringerName: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 11,
  },
  orderDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  detailDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  progressBarContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.badmintonPrimary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  emptyCurrentOrder: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  emptyText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  bookButton: {
    backgroundColor: theme.colors.badmintonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bookButtonText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: '#FFFFFF',
  },
  historyContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyRacket: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  historyMeta: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallStatusText: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: 10,
  },
  emptyHistoryText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  }
});
