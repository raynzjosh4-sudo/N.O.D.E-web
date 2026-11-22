import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCoachmark } from './coachmark_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

export interface FieldGuideConfig {
  fieldId: string;
  badgeType: 'required' | 'optional' | 'step';
  badgeLabel: string;
  title: string;
  hint: string;
}

export const FIELD_GUIDE_CONFIGS: Record<string, FieldGuideConfig> = {
  images: {
    fieldId: 'images',
    badgeType: 'required',
    badgeLabel: 'REQUIRED TO PUBLISH',
    title: 'Product Photos & Media',
    hint: 'Add at least 1 crisp photo showing the wholesale packaging, label, or unit.',
  },
  name_brand: {
    fieldId: 'name_brand',
    badgeType: 'required',
    badgeLabel: 'REQUIRED',
    title: 'Product Title & Brand',
    hint: 'Enter the exact product name and brand as recognized by wholesale buyers in Uganda.',
  },
  category: {
    fieldId: 'category',
    badgeType: 'required',
    badgeLabel: 'REQUIRED',
    title: 'Catalog Category',
    hint: 'Select the precise category tree so buyers filter your listing on the Explore page.',
  },
  pricing_moq: {
    fieldId: 'pricing_moq',
    badgeType: 'required',
    badgeLabel: 'REQUIRED TIERS',
    title: 'Wholesale Pricing Tiers & MOQ',
    hint: 'Set minimum order quantity (MOQ) and tiered discounts (e.g. 10-49 units vs 50+ units).',
  },
  stock_location: {
    fieldId: 'stock_location',
    badgeType: 'required',
    badgeLabel: 'REQUIRED',
    title: 'Stock & Warehouse Location',
    hint: 'Specify inventory quantity ready for dispatch from your Kampala distribution hub.',
  },
  hs_code: {
    fieldId: 'hs_code',
    badgeType: 'optional',
    badgeLabel: 'OPTIONAL',
    title: 'HS Tariff Code & UNBS',
    hint: 'Harmonized System code and UNBS quality certificate for export/import cross-border.',
  },
  publish: {
    fieldId: 'publish',
    badgeType: 'step',
    badgeLabel: 'FINAL STEP',
    title: 'Publish Wholesale Listing',
    hint: 'Click publish to broadcast this listing to verified buyers across East Africa.',
  },
  // Supplier Registration Fields
  legal_name: {
    fieldId: 'legal_name',
    badgeType: 'required',
    badgeLabel: 'REQUIRED STEP 1',
    title: 'Business Legal Name',
    hint: 'Registered company or trading enterprise name as listed on your URSB documents.',
  },
  phone_number: {
    fieldId: 'phone_number',
    badgeType: 'required',
    badgeLabel: 'REQUIRED',
    title: 'Direct Business Phone',
    hint: 'UG phone number (MTN / Airtel) where wholesale buyer orders and escrow notifications arrive.',
  },
  physical_address: {
    fieldId: 'physical_address',
    badgeType: 'required',
    badgeLabel: 'REQUIRED',
    title: 'Physical Warehouse Address',
    hint: 'Street, plaza, or industrial hub in Kampala (e.g. Kikuubo, Nakasero, Namanve).',
  },
  tin_number: {
    fieldId: 'tin_number',
    badgeType: 'optional',
    badgeLabel: 'OPTIONAL',
    title: 'URA Tax Identification Number',
    hint: 'Optional URA TIN for tax invoices and institutional wholesale contracts.',
  },
};

interface CoachmarkFieldSpotlightProps {
  fieldId: string;
  titleOverride?: string;
  children: React.ReactNode;
}

export function CoachmarkFieldSpotlight({
  fieldId,
  titleOverride,
  children,
}: CoachmarkFieldSpotlightProps) {
  const { showCoachmark } = useCoachmark();
  const config = FIELD_GUIDE_CONFIGS[fieldId];

  if (!config) {
    return <View>{children}</View>;
  }

  const isRequired = config.badgeType === 'required';
  const isStep = config.badgeType === 'step';

  const badgeBg = isRequired
    ? 'rgba(16, 185, 129, 0.16)'
    : isStep
    ? 'rgba(18, 187, 240, 0.2)'
    : 'rgba(148, 163, 184, 0.15)';

  const badgeTextColor = isRequired
    ? '#10B981'
    : isStep
    ? '#00E5FF'
    : '#94A3B8';

  const borderColor = isRequired
    ? 'rgba(16, 185, 129, 0.35)'
    : isStep
    ? 'rgba(18, 187, 240, 0.4)'
    : 'rgba(148, 163, 184, 0.25)';

  const handleTriggerSpotlight = (event: any) => {
    // If clicked, open the focused coachmark tooltip pointing to this field
    const { pageX = 24, pageY = 200 } = event?.nativeEvent || {};
    showCoachmark({
      id: fieldId,
      x: Math.max(16, pageX - 60),
      y: Math.max(60, pageY - 30),
      width: 140,
      height: 36,
      shape: 'rect',
      position: 'bottom',
      title: titleOverride || config.title,
      badgeText: config.badgeLabel,
      badgeType: isRequired ? 'required' : config.badgeType === 'optional' ? 'optional' : 'info',
      message: config.hint,
      actionLabel: 'Got It',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Badge Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.badgePill, { backgroundColor: badgeBg, borderColor }]}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isRequired ? '#10B981' : isStep ? '#00E5FF' : '#94A3B8' },
            ]}
          />
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
            {config.badgeLabel}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleTriggerSpotlight}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.infoBtn}
        >
          <MaterialIcon name="info" size={14} color="#00E5FF" />
          <Text style={styles.infoBtnText}>How to fill</Text>
        </TouchableOpacity>
      </View>

      {/* Actual Form Field Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.6,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  infoBtnText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#00E5FF',
  },
});
