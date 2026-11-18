import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { ProfileApiService } from '../../data/services/profile_api_service';
import { useAuth } from '@/features/auth/context/auth_context';
import { useToast } from '@/core/widgets/whatsapp_dialog';

interface BecomeSupplierSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BecomeSupplierSheet({
  visible,
  onClose,
  onSuccess,
}: BecomeSupplierSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { refreshProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [city, setCity] = useState('Kampala');
  const [region, setRegion] = useState('Central');
  const [latitude, setLatitude] = useState('0.3476');
  const [longitude, setLongitude] = useState('32.5825');
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    ProfileApiService.getFullProfile()
      .then((res) => {
        if (!isMounted) return;
        const b = res.business;
        if (b) {
          if (b.legal_name) setLegalName(b.legal_name);
          if (b.phone_number) setPhoneNumber(b.phone_number);
          if (b.physical_address) setPhysicalAddress(b.physical_address);
          if (b.city) setCity(b.city);
          if (b.region) setRegion(b.region);
          if (b.latitude !== null && b.latitude !== undefined) setLatitude(String(b.latitude));
          if (b.longitude !== null && b.longitude !== undefined) setLongitude(String(b.longitude));
        }
      })
      .catch((err) => {
        console.warn('Could not load current business data:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Quick field check for missing items
  const missingFields: string[] = [];
  if (!legalName.trim()) missingFields.push('Business Legal Name');
  if (!phoneNumber.trim()) missingFields.push('Phone Number');
  if (!physicalAddress.trim()) missingFields.push('Physical Address');
  if (!city.trim()) missingFields.push('City');
  if (!latitude.trim() || isNaN(Number(latitude))) missingFields.push('Latitude');
  if (!longitude.trim() || isNaN(Number(longitude))) missingFields.push('Longitude');

  const handleSubmit = async () => {
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}.`);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // 1. Save / Update business info first
      await ProfileApiService.updateBusiness({
        legalName: legalName.trim(),
        phoneNumber: phoneNumber.trim(),
        physicalAddress: physicalAddress.trim(),
        city: city.trim(),
        region: region.trim() || undefined,
        latitude: parseFloat(latitude) || 0.3476,
        longitude: parseFloat(longitude) || 32.5825,
      });

      // 2. Submit the supplier application
      const res = await ProfileApiService.applyToBecomeSupplier();

      showSuccess(
        'Application Submitted',
        res.message || 'Your supplier application is under review by N.O.D.E. administrators.'
      );
      setAlreadyApplied(true);
      await refreshProfile();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit supplier application. Please try again.';
      setErrorMessage(msg);
      showError('Application Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
          showInfo('Location Acquired', 'GPS coordinates updated from browser.');
        },
        () => {
          showInfo('Default Location Used', 'Using central Kampala distribution coordinates.');
          setLatitude('0.3476');
          setLongitude('32.5825');
        }
      );
    } else {
      setLatitude('0.3476');
      setLongitude('32.5825');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
        <View
          style={[
            styles.container,
            isDesktop && styles.containerDesktop,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <MaterialIcon name="storefront" size={20} color={colors.primary} />
                <Text style={[styles.title, { color: colors.onSurface }]}>Become a Supplier</Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                Provide your commercial business details to list products nationwide
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcon name="close" size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>
                Loading your business profile...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Missing Fields Banner */}
              {missingFields.length > 0 && (
                <View style={styles.warningBox}>
                  <MaterialIcon name="info" size={18} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    Missing required fields:{' '}
                    <Text style={{ fontWeight: '700' }}>{missingFields.join(', ')}</Text>.
                  </Text>
                </View>
              )}

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <MaterialIcon name="error_outline" size={18} color="#FF4D4F" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 1. Legal Name */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Business Legal / Registered Name
                  </Text>
                  {!legalName.trim() && <Text style={styles.requiredTag}>Required</Text>}
                </View>
                <TextInput
                  value={legalName}
                  onChangeText={setLegalName}
                  placeholder="e.g. Apex Wholesale Uganda Ltd"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardColor,
                      borderColor: !legalName.trim() ? '#F59E0B' : colors.borderLight,
                      color: colors.onSurface,
                    },
                  ]}
                />
              </View>

              {/* 2. Business Phone Number */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Business Phone Number
                  </Text>
                  {!phoneNumber.trim() && <Text style={styles.requiredTag}>Required</Text>}
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="e.g. +256 700 000 000"
                  placeholderTextColor={colors.onSurfaceMuted}
                  keyboardType="phone-pad"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardColor,
                      borderColor: !phoneNumber.trim() ? '#F59E0B' : colors.borderLight,
                      color: colors.onSurface,
                    },
                  ]}
                />
              </View>

              {/* 3. Physical Address */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Physical Warehouse / Store Address
                  </Text>
                  {!physicalAddress.trim() && <Text style={styles.requiredTag}>Required</Text>}
                </View>
                <TextInput
                  value={physicalAddress}
                  onChangeText={setPhysicalAddress}
                  placeholder="e.g. Plot 14, Industrial Area, 7th Street"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardColor,
                      borderColor: !physicalAddress.trim() ? '#F59E0B' : colors.borderLight,
                      color: colors.onSurface,
                    },
                  ]}
                />
              </View>

              {/* 4. City & Region */}
              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.onSurface }]}>City</Text>
                    {!city.trim() && <Text style={styles.requiredTag}>Required</Text>}
                  </View>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Kampala"
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardColor,
                        borderColor: !city.trim() ? '#F59E0B' : colors.borderLight,
                        color: colors.onSurface,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>Region / Province</Text>
                  <TextInput
                    value={region}
                    onChangeText={setRegion}
                    placeholder="e.g. Central"
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardColor,
                        borderColor: colors.borderLight,
                        color: colors.onSurface,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 5. Coordinates */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Dispatch Coordinates (Lat, Long)
                  </Text>
                  <TouchableOpacity onPress={handleUseCurrentLocation}>
                    <Text style={[styles.linkAction, { color: colors.primary }]}>
                      Auto-detect Location
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TextInput
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="Latitude (e.g. 0.3476)"
                    placeholderTextColor={colors.onSurfaceMuted}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      { flex: 1, backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface },
                    ]}
                  />
                  <TextInput
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="Longitude (e.g. 32.5825)"
                    placeholderTextColor={colors.onSurfaceMuted}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      { flex: 1, backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface },
                    ]}
                  />
                </View>
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSubmitting}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcon name="send" size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submit Supplier Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    elevation: 8,
  },
  containerDesktop: {
    maxWidth: 580,
    borderRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  warningText: {
    flex: 1,
    color: '#D97706',
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 79, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    color: '#FF4D4F',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  formGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  requiredTag: {
    fontSize: 10,
    color: '#F59E0B',
    fontFamily: 'Outfit_700Bold',
  },
  linkAction: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    outlineStyle: 'none' as any,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
});
