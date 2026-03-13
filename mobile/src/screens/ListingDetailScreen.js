import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Modal, TextInput,
} from 'react-native';
import { listingsAPI, requestsAPI } from '../api';
import { Button, Badge, Card, InfoRow, Loader } from '../components';
import { colors, spacing, foodTypeColors, statusColors } from '../utils/theme';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function ListingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await listingsAPI.getOne(id);
      setListing(res.listing);
    } catch (err) {
      Alert.alert('Error', err.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await requestsAPI.create(id, { message: requestMessage, pickupTime: pickupTime || undefined });
      setModalVisible(false);
      Alert.alert('✅ Request Sent!', 'The donor will review your pickup request.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Loader text="Loading details..." />;
  if (!listing) return null;

  const fc = foodTypeColors[listing.foodType] || foodTypeColors.other;
  const sc = statusColors[listing.status] || statusColors.available;
  const isNGO = user?.role === 'ngo';
  const canRequest = isNGO && listing.status === 'available';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: fc.bg }]}>
        <Text style={styles.heroEmoji}>
          {{ cooked: '🍲', raw: '🥦', packaged: '📦', beverages: '🥤', bakery: '🥖', other: '🍽️' }[listing.foodType]}
        </Text>
        <Badge label={listing.status} bg={sc.bg} textColor={sc.text} />
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {/* Details card */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>📋 Details</Text>
          <InfoRow icon="🍽️" label="Food Type" value={listing.foodType.charAt(0).toUpperCase() + listing.foodType.slice(1)} />
          <InfoRow icon="📦" label="Quantity" value={listing.quantity} />
          {listing.servings > 0 && <InfoRow icon="👥" label="Est. Servings" value={`~${listing.servings} people`} />}
          <InfoRow icon="⏰" label="Expires At" value={formatDateTime(listing.expiresAt)} />
        </Card>

        {/* Pickup card */}
        <Card>
          <Text style={styles.sectionTitle}>📍 Pickup Information</Text>
          <InfoRow icon="🏠" label="Address" value={listing.pickupAddress} />
          {listing.donor && (
            <>
              <InfoRow icon="👤" label="Donor" value={listing.donor.organizationName || listing.donor.name} />
              <InfoRow icon="📞" label="Phone" value={listing.donor.phone || 'Not provided'} />
            </>
          )}
        </Card>

        {/* Posted by */}
        <Text style={styles.postedBy}>
          Posted by {listing.donor?.organizationName || listing.donor?.name} • {formatDate(listing.createdAt)}
        </Text>

        {/* Request button for NGO */}
        {canRequest && (
          <Button
            title="🤝 Request Pickup"
            onPress={() => setModalVisible(true)}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        )}
        {isNGO && listing.status !== 'available' && (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableText}>
              This listing is {listing.status} and no longer available for pickup.
            </Text>
          </View>
        )}
      </View>

      {/* Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Pickup</Text>
            <Text style={styles.modalSub}>Send a message to the donor</Text>

            <Text style={styles.inputLabel}>Message (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tell the donor about your organization..."
              value={requestMessage}
              onChangeText={setRequestMessage}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>Preferred Pickup Time (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2024-03-25 15:00"
              value={pickupTime}
              onChangeText={setPickupTime}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Send Request" onPress={handleRequest} loading={requesting} style={{ flex: 1, marginLeft: 10 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  heroEmoji: { fontSize: 64 },
  content: { padding: spacing.xl },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: -0.3 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  postedBy: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  unavailableBox: {
    backgroundColor: colors.gray100, borderRadius: 10, padding: spacing.lg, marginTop: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  unavailableText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xxl, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.text, marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
});
