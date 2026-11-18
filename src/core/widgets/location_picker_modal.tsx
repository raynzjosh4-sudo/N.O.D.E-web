import React, { useState, useEffect, useRef } from 'react';
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
import * as Location from 'expo-location';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

export interface SelectedLocation {
  physicalAddress: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (loc: SelectedLocation) => void;
  initialLocation?: Partial<SelectedLocation>;
}

interface PlaceSearchResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

const PRESET_HUBS: { name: string; address: string; city: string; region: string; lat: number; lon: number }[] = [
  {
    name: 'Industrial Area',
    address: 'Plot 14, 7th Street, Industrial Area',
    city: 'Kampala',
    region: 'Central',
    lat: 0.3168,
    lon: 32.5994,
  },
  {
    name: 'Kikuubo Wholesale',
    address: 'Kikuubo Wholesale Commercial Corridor',
    city: 'Kampala',
    region: 'Central',
    lat: 0.3136,
    lon: 32.5746,
  },
  {
    name: 'Nakawa Business Hub',
    address: 'Port Bell Road, Nakawa Industrial Hub',
    city: 'Kampala',
    region: 'Central',
    lat: 0.3297,
    lon: 32.6186,
  },
  {
    name: 'Kampala Central',
    address: 'Kampala Road / City Square Central',
    city: 'Kampala',
    region: 'Central',
    lat: 0.3136,
    lon: 32.5811,
  },
  {
    name: 'Namanve Industrial',
    address: 'Kampala Industrial and Business Park Namanve',
    city: 'Mukono',
    region: 'Central',
    lat: 0.3551,
    lon: 32.6936,
  },
  {
    name: 'Entebbe Freight Hub',
    address: 'Entebbe International Airport Cargo Corridor',
    city: 'Entebbe',
    region: 'Central',
    lat: 0.0442,
    lon: 32.4435,
  },
];

export function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}: LocationPickerModalProps) {
  const { colors, isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Selected state
  const [selectedLat, setSelectedLat] = useState<number>(initialLocation?.latitude ?? 0.3168);
  const [selectedLon, setSelectedLon] = useState<number>(initialLocation?.longitude ?? 32.5994);
  const [selectedAddress, setSelectedAddress] = useState<string>(
    initialLocation?.physicalAddress || 'Plot 14, 7th Street, Industrial Area'
  );
  const [selectedCity, setSelectedCity] = useState<string>(initialLocation?.city || 'Kampala');
  const [selectedRegion, setSelectedRegion] = useState<string>(initialLocation?.region || 'Central');

  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible && initialLocation) {
      if (initialLocation.latitude) setSelectedLat(initialLocation.latitude);
      if (initialLocation.longitude) setSelectedLon(initialLocation.longitude);
      if (initialLocation.physicalAddress) setSelectedAddress(initialLocation.physicalAddress);
      if (initialLocation.city) setSelectedCity(initialLocation.city);
      if (initialLocation.region) setSelectedRegion(initialLocation.region);
    }
  }, [visible, initialLocation]);

  // Debounced search via OpenStreetMap Nominatim
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim() || text.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text.trim()
        )}&addressdetails=1&limit=5&countrycodes=ug,ke,tz,rw`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'NodeAppLocationPicker/1.0' },
        });
        if (resp.ok) {
          const data: PlaceSearchResult[] = await resp.json();
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (item: PlaceSearchResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setSelectedLat(lat);
    setSelectedLon(lon);

    const addr = item.address;
    const road = addr?.road || addr?.suburb || addr?.neighbourhood || '';
    const city = addr?.city || addr?.town || addr?.village || addr?.county || 'Kampala';
    const region = addr?.state || 'Central';

    const fullStreet = road ? `${road}, ${city}` : item.display_name.split(',').slice(0, 2).join(',').trim();
    setSelectedAddress(fullStreet || item.display_name.split(',')[0]);
    setSelectedCity(city);
    setSelectedRegion(region);

    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectPreset = (hub: typeof PRESET_HUBS[0]) => {
    setSelectedLat(hub.lat);
    setSelectedLon(hub.lon);
    setSelectedAddress(hub.address);
    setSelectedCity(hub.city);
    setSelectedRegion(hub.region);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Reverse geocode lat, lon to address
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'NodeAppLocationPicker/1.0' },
      });
      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address;
        const street = addr?.road || addr?.suburb || addr?.neighbourhood || 'Commercial District';
        const city = addr?.city || addr?.town || addr?.village || addr?.county || 'Kampala';
        const region = addr?.state || 'Central';

        setSelectedAddress(`${street}, ${city}`);
        setSelectedCity(city);
        setSelectedRegion(region);
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  };

  // Detect current GPS location
  const handleDetectCurrentLocation = async () => {
    setIsLocating(true);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(4));
            const lon = Number(pos.coords.longitude.toFixed(4));
            setSelectedLat(lat);
            setSelectedLon(lon);
            await reverseGeocode(lat, lon);
            setIsLocating(false);
          },
          async (err) => {
            console.warn('Browser geolocation failed, using fallback:', err);
            handleSelectPreset(PRESET_HUBS[0]);
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        handleSelectPreset(PRESET_HUBS[0]);
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = Number(location.coords.latitude.toFixed(4));
      const lon = Number(location.coords.longitude.toFixed(4));
      setSelectedLat(lat);
      setSelectedLon(lon);
      await reverseGeocode(lat, lon);
    } catch (err) {
      console.warn('Location detection failed:', err);
      handleSelectPreset(PRESET_HUBS[0]);
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      physicalAddress: selectedAddress.trim(),
      city: selectedCity.trim(),
      region: selectedRegion.trim(),
      latitude: selectedLat,
      longitude: selectedLon,
    });
    onClose();
  };

  // OpenStreetMap embed URL
  const delta = 0.008;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLon - delta}%2C${
    selectedLat - delta
  }%2C${selectedLon + delta}%2C${selectedLat + delta}&layer=mapnik&marker=${selectedLat}%2C${selectedLon}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
        <View
          style={[
            styles.container,
            isDesktop && styles.containerDesktop,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                <MaterialIcon name="place" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.onSurface }]}>Pick Dispatch Location</Text>
                <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                  Select your physical warehouse or store location on the map
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcon name="close" size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Search Bar & Auto-Detect Row */}
          <View style={[styles.searchSection, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <MaterialIcon name="search" size={20} color={colors.onSurfaceMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search district, market, road (e.g. Industrial Area, Kikuubo)..."
                placeholderTextColor={colors.onSurfaceMuted}
                style={[styles.searchInput, { color: colors.onSurface }]}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <MaterialIcon name="close" size={18} color={colors.onSurfaceMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.locateBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
              onPress={handleDetectCurrentLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcon name="my_location" size={18} color={colors.primary} />
              )}
              <Text style={[styles.locateBtnText, { color: colors.primary }]}>
                {isLocating ? 'Locating...' : 'Use Current GPS'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <View style={[styles.searchResultsBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={[styles.searchResultItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => handleSelectSearchResult(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcon name="location_on" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultItemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={[styles.resultItemSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                    <MaterialIcon name="chevron_right" size={16} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Hub Presets Chips */}
          <View style={styles.presetsSection}>
            <Text style={[styles.presetLabel, { color: colors.onSurfaceMuted }]}>
              Quick East Africa Commercial Hubs:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
              {PRESET_HUBS.map((hub) => (
                <TouchableOpacity
                  key={hub.name}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        Math.abs(selectedLat - hub.lat) < 0.005 && Math.abs(selectedLon - hub.lon) < 0.005
                          ? colors.primary
                          : colors.cardColor,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => handleSelectPreset(hub)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          Math.abs(selectedLat - hub.lat) < 0.005 && Math.abs(selectedLon - hub.lon) < 0.005
                            ? '#FFFFFF'
                            : colors.onSurface,
                      },
                    ]}
                  >
                    {hub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Interactive Map View */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <iframe
                title="Location Map"
                src={mapEmbedUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 16,
                }}
              />
            ) : (
              <View style={[styles.fallbackMapCard, { backgroundColor: colors.cardColor }]}>
                <MaterialIcon name="map" size={54} color={colors.primary} />
                <Text style={[styles.fallbackMapTitle, { color: colors.onSurface }]}>
                  Map Centered at Selected Coordinates
                </Text>
                <Text style={[styles.fallbackMapCoords, { color: colors.primary }]}>
                  {selectedLat.toFixed(4)}° N, {selectedLon.toFixed(4)}° E
                </Text>
              </View>
            )}

            {/* Target Reticle Overlay Badge */}
            <View style={styles.mapBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.mapBadgeText}>
                {selectedLat.toFixed(4)}, {selectedLon.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Selected Location Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <View style={styles.summaryTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.onSurfaceMuted }]}>
                  Selected Warehouse Address
                </Text>
                <Text style={[styles.summaryAddress, { color: colors.onSurface }]} numberOfLines={2}>
                  {selectedAddress}
                </Text>
                <Text style={[styles.summaryCity, { color: colors.onSurfaceMuted }]}>
                  {selectedCity}, {selectedRegion}
                </Text>
              </View>

              <View style={styles.verifiedBadge}>
                <MaterialIcon name="verified" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>GPS Locked</Text>
              </View>
            </View>
          </View>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.onSurface }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <MaterialIcon name="check_circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  containerDesktop: {
    width: 680,
    maxHeight: 740,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    outlineStyle: 'none',
  } as any,
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  locateBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  searchResultsBox: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultItemTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  resultItemSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  presetsSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  presetLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_600SemiBold',
  },
  mapContainer: {
    height: 240,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fallbackMapCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackMapTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  fallbackMapCoords: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  mapBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  mapBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  summaryCard: {
    margin: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAddress: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    marginTop: 3,
  },
  summaryCity: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10.5,
    fontFamily: 'Outfit_700Bold',
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
});
