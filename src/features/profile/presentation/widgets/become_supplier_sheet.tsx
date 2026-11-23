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
import { LocationPickerModal, SelectedLocation } from '@/core/widgets/location_picker_modal';
import { CoachmarkFieldSpotlight } from '@/core/coachmarks/coachmark_field_spotlight';

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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

  const handleLocationPicked = (loc: SelectedLocation) => {
    setPhysicalAddress(loc.physicalAddress);
    setCity(loc.city);
    setRegion(loc.region);
    setLatitude(loc.latitude.toFixed(4));
    setLongitude(loc.longitude.toFixed(4));
    showInfo('Location Updated', `${loc.physicalAddress} (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`);
  };

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
        'Supplier Application Successful',
        res.message || 'Your supplier profile is registered and verified.'
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

  return (
    <>
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
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
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
                <CoachmarkFieldSpotlight fieldId="legal_name">
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
                </CoachmarkFieldSpotlight>

                {/* 2. Business Phone Number */}
                <CoachmarkFieldSpotlight fieldId="phone_number">
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
                </CoachmarkFieldSpotlight>

                {/* 3. Real Location Picker Section */}
                <View style={[styles.locationCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
                  <View style={styles.locationHeaderRow}>
                    <View style={styles.locationHeaderLeft}>
                      <View style={[styles.locationIconPill, { backgroundColor: colors.primary + '18' }]}>
                        <MaterialIcon name="my_location" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.locationTitle, { color: colors.onSurface }]}>
                          Dispatch & Warehouse Location
                        </Text>
                        <Text style={[styles.locationSubtitle, { color: colors.onSurfaceMuted }]}>
                          Real interactive map & address search
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.pickOnMapBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setShowLocationPicker(true)}
                      activeOpacity={0.85}
                    >
                      <MaterialIcon name="map" size={16} color="#FFFFFF" />
                      <Text style={styles.pickOnMapBtnText}>Pick on Map</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Selected Coordinates Status Pill */}
                  <View style={styles.coordsStatusRow}>
                    <View style={styles.coordPill}>
                      <MaterialIcon name="place" size={14} color="#10B981" />
                      <Text style={[styles.coordPillText, { color: colors.onSurface }]}>
                        {latitude && longitude ? `${latitude}° N, ${longitude}° E` : 'No coordinates selected'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setShowLocationPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.changeLocText, { color: colors.primary }]}>
                        Change Location
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Physical Address Field */}
                  <CoachmarkFieldSpotlight fieldId="physical_address">
                    <View style={[styles.formGroup, { marginTop: 10 }]}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>
                          Physical Warehouse Address
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
                            backgroundColor: colors.surface,
                            borderColor: !physicalAddress.trim() ? '#F59E0B' : colors.borderLight,
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>
                  </CoachmarkFieldSpotlight>

                  {/* City & Region */}
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
                            backgroundColor: colors.surface,
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
                            backgroundColor: colors.surface,
                            borderColor: colors.borderLight,
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Submit CTA */}
                <CoachmarkFieldSpotlight fieldId="publish" titleOverride="Submit Supplier Application">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
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
                </CoachmarkFieldSpotlight>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Real Location Picker Modal with OpenStreetMap and Live Place Search */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationPicked}
        initialLocation={{
          physicalAddress,
          city,
          region,
          latitude: parseFloat(latitude) || 0.3476,
          longitude: parseFloat(longitude) || 32.5825,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  containerDesktop: {
    width: 600,
    maxWidth: '95%',
    maxHeight: Platform.OS === 'web' ? ('85vh' as any) : 700,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#D97706',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#EF4444',
    flex: 1,
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
    fontSize: 12.5,
    fontFamily: 'Outfit_600SemiBold',
  },
  requiredTag: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#F59E0B',
  },
  input: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    outlineStyle: 'none',
  } as any,
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCard: {
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    gap: 10,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationIconPill: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
  },
  locationSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  pickOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pickOnMapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  coordsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  coordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordPillText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },
  changeLocText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 6,
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
});
