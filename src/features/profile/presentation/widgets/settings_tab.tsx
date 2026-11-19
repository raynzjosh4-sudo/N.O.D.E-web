import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';

import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { NodeIcon } from '@/core/widgets/node_icon';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { UserProfile } from '../../domain/entities/profile_models';
import { ProfileApiService } from '../../data/services/profile_api_service';

type SettingsSubView = 'main' | 'manifesto' | 'profile_info' | 'warehouse' | 'terms' | 'theme';

interface SettingsTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export function SettingsTab({
  profile,
  onUpdateProfile,
  onLogout,
}: SettingsTabProps) {
  const { themeMode, isDark, colors, setThemeMode } = useAppTheme();
  const [subView, setSubView] = useState<SettingsSubView>('main');

  // Profile Edit Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [legalName, setLegalName] = useState(profile.legalBusinessName);
  const [taxId, setTaxId] = useState(profile.taxId);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [warehouseAddress, setWarehouseAddress] = useState(profile.warehouseAddress);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Preference switches
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isAutoDraftEnabled, setIsAutoDraftEnabled] = useState(true);
  const [currency, setCurrency] = useState<'UGX' | 'USD'>('UGX');

  const handleSaveProfile = async () => {
    onUpdateProfile({
      ...profile,
      fullName,
      legalBusinessName: legalName,
      taxId,
      email,
      phone,
      warehouseAddress,
    });
    setSaveSuccessMsg(true);

    try {
      await Promise.allSettled([
        ProfileApiService.updateUser({ fullName }),
        ProfileApiService.updateBusiness({
          legalName,
          phoneNumber: phone,
          physicalAddress: warehouseAddress,
        }),
      ]);
    } catch (e) {
      console.warn('Failed to sync profile update to db:', e);
    }

    setTimeout(() => {
      setSaveSuccessMsg(false);
      setSubView('main');
    }, 1200);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SUBVIEW: OUR PURPOSE & MANIFESTO
  // ═══════════════════════════════════════════════════════════════════════════
  if (subView === 'manifesto') {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subViewContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtnRow}
          onPress={() => setSubView('main')}
        >
          <MaterialIcon name="arrow_back" size={18} color={AppColors.primary} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        {/* Hero Manifesto Banner */}
        <View style={[styles.manifestoHero, { backgroundColor: isDark ? colors.cardColor : 'rgba(18, 187, 240, 0.04)' }]}>
          <NodeIcon size={44} />
          <Text style={[styles.manifestoTitle, { color: colors.onSurface }]}>THE N.O.D.E. MANIFESTO</Text>
          <Text style={[styles.manifestoSubtitle, { color: colors.onSurfaceMuted }]}>
            National, Order & Distribution, Exchange
          </Text>
          <View style={styles.manifestoDivider} />
          <Text style={styles.manifestoLead}>
            "Building Africa's open, direct, and transparent wholesale economy."
          </Text>
        </View>

        {/* Pillars */}
        <View style={styles.manifestoSection}>
          <Text style={[styles.manifestoSectionTitle, { color: colors.onSurfaceMuted }]}>CORE PRINCIPLES</Text>

          <View style={[styles.pillarCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.surface }]}>
              <MaterialIcon name="factory" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pillarTitle, { color: colors.onSurface }]}>1. Elimination of Middlemen</Text>
              <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
                Direct connection between verified manufacturers, primary importers, and regional enterprise retailers.
              </Text>
            </View>
          </View>

          <View style={[styles.pillarCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.surface }]}>
              <MaterialIcon name="inventory" size={20} color="#FF9800" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pillarTitle, { color: colors.onSurface }]}>2. Transparent Tier Pricing</Text>
              <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
                Open wholesale tier breakdowns with volume discounts applied automatically across carton and pallet consignments.
              </Text>
            </View>
          </View>

          <View style={[styles.pillarCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.surface }]}>
              <MaterialIcon name="verified_user" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pillarTitle, { color: colors.onSurface }]}>3. Escrow & QA Assurance</Text>
              <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
                Funds are held in secure escrow until physical delivery inspection is verified at authorized distribution hubs.
              </Text>
            </View>
          </View>

          <View style={[styles.pillarCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.surface }]}>
              <MaterialIcon name="local_shipping" size={20} color="#2196F3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pillarTitle, { color: colors.onSurface }]}>4. Synchronized Freight Logistics</Text>
              <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
                Pallet tracking with UNBS compliance verification and direct delivery to designated regional warehouses.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SUBVIEW: PROFILE & BUSINESS SETUP EDIT FORM
  // ═══════════════════════════════════════════════════════════════════════════
  if (subView === 'profile_info') {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subViewContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtnRow}
          onPress={() => setSubView('main')}
        >
          <MaterialIcon name="arrow_back" size={18} color={AppColors.primary} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.formPageTitle, { color: colors.onSurface }]}>Profile & Legal Business Info</Text>
        <Text style={[styles.formPageSubtitle, { color: colors.onSurfaceMuted }]}>
          These details appear on your verified wholesale orders, invoices, and delivery manifests.
        </Text>

        {saveSuccessMsg && (
          <View style={styles.successBanner}>
            <MaterialIcon name="check_circle" size={18} color="#10B981" />
            <Text style={styles.successBannerText}>
              Business profile updated successfully!
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          {/* Contact Person Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>PRIMARY CONTACT / PROCUREMENT OFFICER</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={[styles.textInput, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface }]}
              placeholder="Full Name"
              placeholderTextColor={colors.onSurfaceMuted}
            />
          </View>

          {/* Legal Business Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>REGISTERED COMPANY NAME (LEGAL ENTITY)</Text>
            <TextInput
              value={legalName}
              onChangeText={setLegalName}
              style={[styles.textInput, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface }]}
              placeholder="Company Legal Name"
              placeholderTextColor={colors.onSurfaceMuted}
            />
          </View>

          {/* Tax Identification (TIN) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>UGANDA REVENUE AUTHORITY TAX PIN (TIN)</Text>
            <TextInput
              value={taxId}
              onChangeText={setTaxId}
              style={[styles.textInput, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface }]}
              placeholder="e.g. TIN: 1002948123"
              placeholderTextColor={colors.onSurfaceMuted}
            />
          </View>

          {/* Business Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>OFFICIAL PROCUREMENT EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[styles.textInput, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface }]}
              keyboardType="email-address"
              placeholder="procurement@company.ug"
              placeholderTextColor={colors.onSurfaceMuted}
            />
          </View>

          {/* Phone / MoMo */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>PROCUREMENT PHONE / ESCROW NOTIFICATIONS</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={[styles.textInput, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, color: colors.onSurface }]}
              keyboardType="phone-pad"
              placeholder="+256 700 000 000"
              placeholderTextColor={colors.onSurfaceMuted}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveFormBtn}
            onPress={handleSaveProfile}
          >
            <MaterialIcon name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveFormText}>Save Profile Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SUBVIEW: WAREHOUSE DELIVERY ADDRESS
  // ═══════════════════════════════════════════════════════════════════════════
  if (subView === 'warehouse') {
    const WAREHOUSE_HUBS = [
      'Plot 44, 7th Street Industrial Area, Kampala (Main Warehouse)',
      'Bugolobi Logistics Hub, Spring Road Gate 2, Kampala',
      'Jinja Road Freight Terminal, Kyambogo Distribution Yard',
      'Gulu Central Regional Depot, Airfield Road',
    ];

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subViewContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtnRow}
          onPress={() => setSubView('main')}
        >
          <MaterialIcon name="arrow_back" size={18} color={AppColors.primary} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.formPageTitle, { color: colors.onSurface }]}>Warehouse Delivery Address</Text>
        <Text style={[styles.formPageSubtitle, { color: colors.onSurfaceMuted }]}>
          Select or update your primary drop-off depot for consolidated freight and pallet delivery.
        </Text>

        <View style={styles.hubList}>
          {WAREHOUSE_HUBS.map((hub, idx) => {
            const isSelected = warehouseAddress === hub;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                style={[
                  styles.hubCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(18, 187, 240, 0.12)' : 'rgba(18, 187, 240, 0.06)')
                      : colors.cardColor,
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => {
                  setWarehouseAddress(hub);
                  onUpdateProfile({ ...profile, warehouseAddress: hub });
                }}
              >
                <MaterialIcon
                  name={isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                  size={20}
                  color={isSelected ? colors.primary : colors.onSurfaceMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.hubNameText,
                      { color: isSelected ? colors.primary : colors.onSurface },
                      isSelected && styles.hubNameTextSelected,
                    ]}
                  >
                    {hub}
                  </Text>
                  <Text style={[styles.hubSubText, { color: colors.onSurfaceMuted }]}>Forklift Access • Security Gate 24/7</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SUBVIEW: WHOLESALE TRADING TERMS & POLICIES
  // ═══════════════════════════════════════════════════════════════════════════
  if (subView === 'terms') {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subViewContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtnRow}
          onPress={() => setSubView('main')}
        >
          <MaterialIcon name="arrow_back" size={18} color={AppColors.primary} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.formPageTitle, { color: colors.onSurface }]}>Wholesale Trading Terms</Text>
        <Text style={[styles.formPageSubtitle, { color: colors.onSurfaceMuted }]}>
          Governs bulk transactions, minimum order quantities, and pallet inspection on N.O.D.E.
        </Text>

        <View style={[styles.termsCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight }]}>
          <Text style={[styles.termsArticleTitle, { color: colors.onSurface }]}>1. Order Commitments & MOQs</Text>
          <Text style={[styles.termsArticleBody, { color: colors.onSurfaceMuted }]}>
            Wholesale tier prices are strictly binding upon confirmation of order quantities. Sub-tier adjustments are subject to supplier approval before freight dispatch.
          </Text>

          <Text style={[styles.termsArticleTitle, { color: colors.onSurface }]}>2. Escrow & Payment Release</Text>
          <Text style={[styles.termsArticleBody, { color: colors.onSurfaceMuted }]}>
            Funds deposited via Stanbic Bank escrow or Mobile Money Business are safeguarded until signed delivery confirmation is uploaded by the warehouse manager.
          </Text>

          <Text style={[styles.termsArticleTitle, { color: colors.onSurface }]}>3. Inspection Window & Returns</Text>
          <Text style={[styles.termsArticleBody, { color: colors.onSurfaceMuted }]}>
            Buyers have forty-eight (48) hours from arrival to conduct QA batch sampling. Manufacturer warranties apply for 14 to 90 days depending on verified catalog classification.
          </Text>

          <Text style={[styles.termsArticleTitle, { color: colors.onSurface }]}>4. UNBS & East African Compliance</Text>
          <Text style={[styles.termsArticleBody, { color: colors.onSurfaceMuted }]}>
            All electronic, chemical, and consumable wholesale lots include digital UNBS QA certifications and tax invoice receipts compliant with EFRIS regulations.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SUBVIEW: THEME & APPEARANCE (Matching Flutter ThemeSettingsPage)
  // ═══════════════════════════════════════════════════════════════════════════
  if (subView === 'theme') {
    const THEME_OPTIONS: { mode: 'system' | 'light' | 'dark'; label: string; subtext: string; icon: string }[] = [
      {
        mode: 'system',
        label: 'System Default',
        subtext: 'Automatically match your device operating system theme',
        icon: 'settings_brightness',
      },
      {
        mode: 'light',
        label: 'Light Mode',
        subtext: 'Classic clean white wholesale catalog theme',
        icon: 'light_mode',
      },
      {
        mode: 'dark',
        label: 'Dark Mode',
        subtext: 'Obsidian dark enterprise theme with high-contrast accents',
        icon: 'dark_mode',
      },
    ];

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subViewContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtnRow}
          onPress={() => setSubView('main')}
        >
          <MaterialIcon name="arrow_back" size={18} color={AppColors.primary} />
          <Text style={styles.backBtnText}>Back to Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.formPageTitle, { color: colors.onSurface }]}>Appearance & Theme</Text>
        <Text style={[styles.formPageSubtitle, { color: colors.onSurfaceMuted }]}>
          Choose how N.O.D.E. is presented on your screen across all wholesale pages.
        </Text>

        <View style={styles.hubList}>
          {THEME_OPTIONS.map((opt) => {
            const isSelected = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                activeOpacity={0.8}
                style={[
                  styles.hubCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(18, 187, 240, 0.12)' : 'rgba(18, 187, 240, 0.06)')
                      : colors.cardColor,
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => setThemeMode(opt.mode)}
              >
                <View
                  style={[
                    styles.pillarIcon,
                    { backgroundColor: colors.surface },
                    isSelected && { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <MaterialIcon
                    name={opt.icon}
                    size={22}
                    color={isSelected ? colors.primary : colors.onSurface}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.hubNameText,
                      { color: isSelected ? colors.primary : colors.onSurface },
                      isSelected && styles.hubNameTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.hubSubText, { color: colors.onSurfaceMuted }]}>{opt.subtext}</Text>
                </View>

                <MaterialIcon
                  name={isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                  size={20}
                  color={isSelected ? colors.primary : colors.onSurfaceMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MAIN SETTINGS VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  const renderTile = (
    title: string,
    icon: string,
    onPress?: () => void,
    trailing?: string,
    isDestructive: boolean = false
  ) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.tileContainer, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight }]}
        onPress={onPress}
      >
        <View
          style={[
            styles.tileIconWrapper,
            { backgroundColor: colors.surface },
            isDestructive && styles.tileIconWrapperDestructive,
          ]}
        >
          <MaterialIcon
            name={icon}
            size={20}
            color={isDestructive ? '#D32F2F' : colors.onSurface}
          />
        </View>

        <Text
          style={[
            styles.tileTitle,
            { color: colors.onSurface },
            isDestructive && styles.tileTitleDestructive,
          ]}
        >
          {title}
        </Text>

        {trailing && <Text style={[styles.tileTrailing, { color: colors.onSurfaceMuted }]}>{trailing}</Text>}

        <MaterialIcon
          name="chevron_right"
          size={20}
          color={colors.onSurfaceMuted}
        />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string) => {
    return (
      <View style={styles.sectionHeaderContainer}>
        <Text style={[styles.sectionHeaderText, { color: colors.onSurfaceMuted }]}>{title.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollList}
    >
      {/* ── N.O.D.E. Brand Header ── */}
      <View style={[styles.brandingCard, { backgroundColor: colors.cardColor, borderColor: colors.borderLight, borderWidth: 1 }]}>
        <NodeIcon size={34} />
        <View style={styles.brandingTextContainer}>
          <Text style={[styles.brandTitle, { color: colors.onSurface }]}>N.O.D.E.</Text>
          <Text style={[styles.brandSubtitle, { color: colors.onSurfaceMuted }]}>
            National, Order & Distribution, Exchange
          </Text>
        </View>
      </View>

      {/* ── Manifesto Entry ── */}
      {renderTile(
        'Our Purpose & Mission',
        'lightbulb',
        () => setSubView('manifesto'),
        'Manifesto'
      )}

      {renderSectionHeader('Account & Verification')}
      {renderTile(
        'Profile & Legal Info',
        'person',
        () => setSubView('profile_info'),
        profile.fullName
      )}
      {renderTile(
        'Warehouse Delivery Address',
        'warehouse',
        () => setSubView('warehouse'),
        'Industrial Area'
      )}
      {renderTile(
        'Tax & Compliance Documents',
        'verified_user',
        () => setSubView('profile_info'),
        profile.taxId
      )}

      {renderSectionHeader('Wholesale Preferences')}
      {renderTile(
        'Appearance & Theme',
        'palette',
        () => setSubView('theme'),
        themeMode === 'system' ? 'System Default' : themeMode === 'light' ? 'Light' : 'Dark'
      )}
      {/* Currency Switcher */}
      <View style={[styles.switchTile, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.tileIconWrapper, { backgroundColor: colors.surface }]}>
          <MaterialIcon name="payments" size={20} color={colors.onSurface} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tileTitle, { color: colors.onSurface }]}>Display Currency</Text>
          <Text style={[styles.tileSubtitle, { color: colors.onSurfaceMuted }]}>Active: {currency === 'UGX' ? 'Uganda Shillings (UGX)' : 'US Dollars ($)'}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.currencyTogglePill, { backgroundColor: colors.primary + '18' }]}
          onPress={() => setCurrency((c) => (c === 'UGX' ? 'USD' : 'UGX'))}
        >
          <Text style={[styles.currencyToggleText, { color: colors.primary }]}>{currency}</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Switch */}
      <View style={[styles.switchTile, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.tileIconWrapper, { backgroundColor: colors.surface }]}>
          <MaterialIcon name="notifications" size={20} color={colors.onSurface} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tileTitle, { color: colors.onSurface }]}>Pallet & Price Notifications</Text>
          <Text style={[styles.tileSubtitle, { color: colors.onSurfaceMuted }]}>Alerts for price drops & dispatches</Text>
        </View>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={setIsNotificationsEnabled}
          trackColor={{ false: colors.borderLight, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Auto-save Drafts Switch */}
      <View style={[styles.switchTile, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.tileIconWrapper, { backgroundColor: colors.surface }]}>
          <MaterialIcon name="save_as" size={20} color={colors.onSurface} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tileTitle, { color: colors.onSurface }]}>Auto-save Wholesale Drafts</Text>
          <Text style={[styles.tileSubtitle, { color: colors.onSurfaceMuted }]}>Preserve custom color and size groups</Text>
        </View>
        <Switch
          value={isAutoDraftEnabled}
          onValueChange={setIsAutoDraftEnabled}
          trackColor={{ false: colors.borderLight, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {renderSectionHeader('Support & Legal')}
      {renderTile('Wholesale Trading Terms', 'description', () => setSubView('terms'))}
      {renderTile('Help Center & FAQs', 'help_outline', () => setSubView('terms'), 'Online 24/7')}
      {renderTile('Privacy Policy & Escrow Guarantee', 'privacy_tip', () => setSubView('terms'))}

      {renderSectionHeader('Session')}
      {renderTile('Sign Out from N.O.D.E.', 'logout', onLogout, undefined, true)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  scrollList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  subViewContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
  },
  brandingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.07)',
    marginBottom: 4,
  },
  brandingTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.45)',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  sectionHeaderContainer: {
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.4)',
    letterSpacing: 1,
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
  },
  switchTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    gap: 12,
  },
  tileIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(28, 27, 31, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tileIconWrapperDestructive: {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
  },
  tileTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: AppColors.onSurface,
  },
  tileSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.45)',
    marginTop: 2,
  },
  tileTitleDestructive: {
    color: '#D32F2F',
  },
  tileTrailing: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.4)',
    marginRight: 6,
  },
  currencyTogglePill: {
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currencyToggleText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
  },

  // ── MANIFESTO STYLES ──
  manifestoHero: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 187, 240, 0.04)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  manifestoTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
    color: AppColors.onSurface,
    letterSpacing: 2,
    marginTop: 12,
  },
  manifestoSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 4,
  },
  manifestoDivider: {
    width: 40,
    height: 2,
    backgroundColor: AppColors.primary,
    marginVertical: 14,
  },
  manifestoLead: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  manifestoSection: {
    gap: 12,
  },
  manifestoSectionTitle: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.45)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  pillarDesc: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.65)',
    marginTop: 3,
    lineHeight: 18,
  },

  // ── FORM STYLES ──
  formPageTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  formPageSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.5)',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#2E7D32',
  },
  formCard: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: 'rgba(28, 27, 31, 0.5)',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    outlineStyle: 'none' as any,
  },
  saveFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  saveFormText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },

  // ── HUB LIST STYLES ──
  hubList: {
    gap: 12,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  hubCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(18, 187, 240, 0.03)',
  },
  hubNameText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  hubNameTextSelected: {
    color: AppColors.primary,
  },
  hubSubText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },

  // ── TERMS STYLES ──
  termsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  termsArticleTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.onSurface,
  },
  termsArticleBody: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.65)',
    lineHeight: 19,
    marginBottom: 6,
  },
});
