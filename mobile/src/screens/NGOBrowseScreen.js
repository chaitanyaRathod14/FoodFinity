import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listingsAPI } from '../api';
import { Card, Badge, EmptyState, Loader } from '../components';
import { colors, spacing, foodTypeColors, statusColors } from '../utils/theme';
import { formatDate, timeAgo, isExpired } from '../utils/helpers';

const FOOD_TYPE_ICONS = {
  cooked: '🍲', raw: '🥦', packaged: '📦', beverages: '🥤', bakery: '🥖', other: '🍽️',
};

export default function NGOBrowseScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const res = await listingsAPI.getAvailable();
      setListings(res.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const FILTERS = ['all', 'cooked', 'raw', 'packaged', 'beverages', 'bakery', 'other'];
  const filtered = filter === 'all' ? listings : listings.filter(l => l.foodType === filter);

  if (loading) return <Loader text="Finding available food..." />;

  const renderItem = ({ item }) => {
    const fc = foodTypeColors[item.foodType] || foodTypeColors.other;
    const sc = statusColors[item.status] || statusColors.available;
    const expired = isExpired(item.expiresAt);

    return (
      <Card onPress={() => navigation.navigate('ListingDetail', { id: item._id, role: 'ngo' })} style={expired ? { opacity: 0.6 } : {}}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.foodTypeIcon, { backgroundColor: fc.bg }]}>
            <Text style={styles.foodTypeEmoji}>{FOOD_TYPE_ICONS[item.foodType] || '🍽️'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.donorName}>{item.donor?.organizationName || item.donor?.name}</Text>
          </View>
          <Badge label={item.status} bg={sc.bg} textColor={sc.text} />
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>📦 {item.quantity}</Text>
          {item.servings > 0 && <Text style={styles.metaItem}>👥 ~{item.servings} servings</Text>}
          <Text style={[styles.metaItem, expired && { color: colors.danger }]}>
            ⏱ {expired ? 'Expired' : `Exp. ${formatDate(item.expiresAt)}`}
          </Text>
        </View>

        {/* Address */}
        <Text style={styles.address} numberOfLines={1}>📍 {item.pickupAddress}</Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Badge label={item.foodType} bg={fc.bg} textColor={fc.text} />
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                {item === 'all' ? 'All Food' : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Text style={styles.resultCount}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''} available</Text>
        }
        ListEmptyComponent={
          <EmptyState icon="🍽️" title="No food available" subtitle="Check back soon! Donors are posting new listings" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  filterChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.xl, flexGrow: 1 },
  resultCount: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, fontWeight: '500' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  foodTypeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  foodTypeEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  donorName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metaItem: { fontSize: 12, color: colors.textSecondary },
  address: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timeAgo: { fontSize: 11, color: colors.textMuted },
});
