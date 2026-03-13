import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Modal, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { listingsAPI, requestsAPI } from '../api';
import { Button, Badge, Card, InfoRow, Loader } from '../components';
import { colors, spacing, foodTypeColors, statusColors } from '../utils/theme';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, getAddressFromCoords, openInMaps } from '../utils/location';

export default function ListingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [requesting, setRequesting] = useState(false);

  // NGO location
  const [ngoLocation, setNgoLocation] = useState(null);
  const [ngoAddress, setNgoAddress] = useState('');
  const [fetchingNgoLocation, setFetchingNgoLocation] = useState(false);

  useEffect(() => { fetchListing(); }, [id]);

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

  const handleGetNgoLocation = async () => {
    setFetchingNgoLocation(true);
    try {
      const coords = await getCurrentLocation();
      const address = await getAddressFromCoords(coords.latitude, coords.longitude);
      setNgoLocation(coords);
      setNgoAddress(address);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setFetchingNgoLocation(false);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await requestsAPI.create(id, {
        message: requestMessage,
        pickupTime: pickupTime || undefined,
        ngoLocation: ngoLocation ? {
          address: ngoAddress,
          latitude: ngoLocation.latitude,
          longitude: ngoLocation.longitude,
        } : undefined,
      });
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
  const hasLocation = listing.pickupLocation?.latitude && listing.pickupLocation?.longitude;

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
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {/* Details */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>📋 Details</Text>
          <InfoRow icon="🍽️" label="Food Type" value={listing.foodType.charAt(0).toUpperCase() + listing.foodType.slice(1)} />
          <InfoRow icon="📦" label="Quantity" value={listing.quantity} />
          {listing.servings > 0 && <InfoRow icon="👥" label="Est. Servings" value={`~${listing.servings} people`} />}
          <InfoRow icon="⏰" label="Expires At" value={formatDateTime(listing.expiresAt)} />
        </Card>

        {/* Pickup Location Card */}
        <Card>
          <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
          <InfoRow icon="🏠" label="Address" value={listing.pickupAddress} />
          {listing.donor && (
            <>
              <InfoRow icon="👤" label="Donor" value={listing.donor.organizationName || listing.donor.name} />
              <InfoRow icon="📞" label="Phone" value={listing.donor.phone || 'Not provided'} />
            </>
          )}

          {/* Open in Maps button */}
          {hasLocation && (
            <TouchableOpacity
              style={styles.openMapBtn}
              onPress={() => openInMaps(
                listing.pickupLocation.latitude,
                listing.pickupLocation.longitude,
                listing.pickupAddress
              )}
            >
              <Text style={styles.openMapIcon}>🗺️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.openMapText}>Open Pickup Location in Maps</Text>
                <Text style={styles.openMapCoords}>
                  {listing.pickupLocation.latitude.toFixed(5)}, {listing.pickupLocation.longitude.toFixed(5)}
                </Text>
              </View>
              <Text style={styles.openMapArrow}>›</Text>
            </TouchableOpacity>
          )}

          {!hasLocation && (
            <View style={styles.noLocationBox}>
              <Text style={styles.noLocationText}>📍 No map location provided for this listing</Text>
            </View>
          )}
        </Card>

        <Text style={styles.postedBy}>
          Posted by {listing.donor?.organizationName || listing.donor?.name} • {formatDate(listing.createdAt)}
        </Text>

        {canRequest && (
          <Button title="🤝 Request Pickup" onPress={() => setModalVisible(true)} size="lg" style={{ marginTop: spacing.lg }} />
        )}
        {isNGO && listing.status !== 'available' && (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableText}>
              This listing is {listing.status} and no longer available.
            </Text>
          </View>
        )}
      </View>

      {/* Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Pickup</Text>
            <Text style={styles.modalSub}>Send your location so the donor knows where you are</Text>

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

            {/* NGO Location */}
            <Text style={styles.inputLabel}>Your Location (optional)</Text>
            <TouchableOpacity
              style={[styles.locationBtn, ngoLocation && styles.locationBtnActive]}
              onPress={handleGetNgoLocation}
              disabled={fetchingNgoLocation}
            >
              {fetchingNgoLocation ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                  <Text style={styles.locationBtnText}>
                    {ngoLocation ? 'Location Set ✓ Tap to Update' : 'Share My Current Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {ngoLocation && (
              <View style={styles.coordsBox}>
                <Text style={styles.coordsAddress}>{ngoAddress}</Text>
                <Text style={styles.coordsText}>
                  {ngoLocation.latitude.toFixed(5)}, {ngoLocation.longitude.toFixed(5)}
                </Text>
              </View>
            )}

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
  openMapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accent, borderRadius: 10, padding: 12,
    marginTop: 8, borderWidth: 1, borderColor: colors.primary + '30',
  },
  openMapIcon: { fontSize: 24 },
  openMapText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  openMapCoords: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  openMapArrow: { fontSize: 22, color: colors.primary },
  noLocationBox: {
    backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginTop: 8,
  },
  noLocationText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  postedBy: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  unavailableBox: {
    backgroundColor: colors.gray100, borderRadius: 10, padding: spacing.lg, marginTop: spacing.lg,
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
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 12, gap: 8, marginBottom: 8,
  },
  locationBtnActive: { backgroundColor: colors.success },
  locationBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  coordsBox: {
    backgroundColor: colors.accent, borderRadius: 8, padding: 10, marginBottom: 12,
  },
  coordsAddress: { fontSize: 13, fontWeight: '600', color: colors.primary },
  coordsText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
});