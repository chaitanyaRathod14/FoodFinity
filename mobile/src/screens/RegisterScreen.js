import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';

const ROLES = [
  { key: 'donor', label: '🍱 Donor', desc: 'Restaurants, events, individuals' },
  { key: 'ngo', label: '🤝 NGO', desc: 'Organizations collecting food' },
  { key: 'driver', label: '🚚 Driver', desc: 'Deliver food to NGOs' },
];

const VEHICLE_TYPES = ['bike', 'car', 'van', 'truck'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'donor',
    phone: '', address: '', organizationName: '',
    vehicleType: 'bike', vehicleNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (form.role === 'driver' && !form.vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image 
            source={require('../../logo/image.png')} 
            style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 12, alignSelf: 'center' }} 
            resizeMode="cover" 
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FoodBridge today</Text>
        </View>

        <View style={styles.formCard}>
          {/* Role selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role.key}
                onPress={() => update('role', role.key)}
                style={[styles.roleCard, form.role === role.key && styles.roleCardActive]}
              >
                <Text style={styles.roleLabel}>{role.label}</Text>
                <Text style={[styles.roleDesc, form.role === role.key && { color: colors.primary }]}>
                  {role.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Full Name *" value={form.name} onChangeText={v => update('name', v)}
            placeholder="Enter your name" error={errors.name} />

          {(form.role === 'ngo' || form.role === 'donor') && (
            <Input label="Organization Name (optional)" value={form.organizationName}
              onChangeText={v => update('organizationName', v)} placeholder="e.g. City Rescue Mission" />
          )}

          <Input label="Email *" value={form.email} onChangeText={v => update('email', v)}
            placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <Input label="Password *" value={form.password} onChangeText={v => update('password', v)}
            placeholder="Min 6 characters" secureTextEntry error={errors.password} />
          <Input label="Phone (optional)" value={form.phone} onChangeText={v => update('phone', v)}
            placeholder="+1 234 567 8900" keyboardType="phone-pad" />

          {form.role !== 'driver' && (
            <Input label="Address (optional)" value={form.address} onChangeText={v => update('address', v)}
              placeholder="Street, City, State" multiline />
          )}

          {/* Driver specific fields */}
          {form.role === 'driver' && (
            <>
              <Text style={styles.sectionLabel}>Vehicle Details</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => update('vehicleType', v)}
                    style={[styles.vehicleChip, form.vehicleType === v && styles.vehicleChipActive]}
                  >
                    <Text style={styles.vehicleEmoji}>
                      {v === 'bike' ? '🏍️' : v === 'car' ? '🚗' : v === 'van' ? '🚐' : '🚛'}
                    </Text>
                    <Text style={[styles.vehicleText, form.vehicleType === v && { color: colors.primary, fontWeight: '700' }]}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Vehicle Number *" value={form.vehicleNumber}
                onChangeText={v => update('vehicleNumber', v)}
                placeholder="e.g. MH12AB1234" autoCapitalize="characters" error={errors.vehicleNumber} />
            </>
          )}

          <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: 4 }} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingBottom: 40 },
  header: { paddingTop: 48, paddingBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  formCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleGrid: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl, flexWrap: 'wrap' },
  roleCard: {
    flex: 1, minWidth: '28%', borderWidth: 2, borderColor: colors.border,
    borderRadius: 12, padding: 10, backgroundColor: colors.gray100,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  roleLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  roleDesc: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  vehicleGrid: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg, flexWrap: 'wrap' },
  vehicleChip: {
    flex: 1, minWidth: '20%', alignItems: 'center', padding: 10,
    borderWidth: 2, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.gray100,
  },
  vehicleChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  vehicleEmoji: { fontSize: 22, marginBottom: 4 },
  vehicleText: { fontSize: 11, color: colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});