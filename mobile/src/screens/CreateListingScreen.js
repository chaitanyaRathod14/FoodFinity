import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { listingsAPI } from '../api';
import { Button, Input } from '../components';
import { colors, spacing, radius } from '../utils/theme';

const FOOD_TYPES = ['cooked', 'raw', 'packaged', 'beverages', 'bakery', 'other'];

export default function CreateListingScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', foodType: 'cooked',
    quantity: '', servings: '', expiresAt: '', pickupAddress: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.quantity.trim()) e.quantity = 'Quantity is required';
    if (!form.expiresAt.trim()) e.expiresAt = 'Expiry date/time is required';
    else {
      const d = new Date(form.expiresAt);
      if (isNaN(d)) e.expiresAt = 'Use format: YYYY-MM-DD HH:MM';
      else if (d <= new Date()) e.expiresAt = 'Must be a future date';
    }
    if (!form.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        expiresAt: new Date(form.expiresAt).toISOString(),
        servings: form.servings ? parseInt(form.servings) : 0,
      };
      await listingsAPI.create(payload);
      Alert.alert('✅ Success', 'Your food listing has been posted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>New Food Listing</Text>
        <Text style={styles.sub}>Share your surplus food with those in need</Text>

        <Input label="Title *" value={form.title} onChangeText={v => update('title', v)}
          placeholder="e.g. Leftover pasta from catering event" error={errors.title} />

        <Input label="Description *" value={form.description} onChangeText={v => update('description', v)}
          placeholder="Describe the food, how it was prepared, etc." multiline error={errors.description} />

        {/* Food Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Food Type *</Text>
          <View style={styles.typeGrid}>
            {FOOD_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => update('foodType', type)}
                style={[styles.typeChip, form.foodType === type && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, form.foodType === type && styles.typeChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Input label="Quantity *" value={form.quantity} onChangeText={v => update('quantity', v)}
              placeholder="e.g. 5 kg, 20 boxes" error={errors.quantity} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Input label="Servings" value={form.servings} onChangeText={v => update('servings', v)}
              placeholder="~0" keyboardType="numeric" />
          </View>
        </View>

        <Input label="Expires At *" value={form.expiresAt} onChangeText={v => update('expiresAt', v)}
          placeholder="YYYY-MM-DD HH:MM" error={errors.expiresAt} />
        <Text style={styles.hint}>Format: 2024-03-25 18:00</Text>

        <Input label="Pickup Address *" value={form.pickupAddress} onChangeText={v => update('pickupAddress', v)}
          placeholder="Full pickup address" multiline error={errors.pickupAddress} />

        <Button title="Post Listing" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: 8 }} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xxl },
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  typeChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  typeChipTextActive: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: -10, marginBottom: spacing.lg },
});
