import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from '@/core/widgets/material_icon';

export default function TermsRoute() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.backRow}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }}
      >
        <MaterialIcon name="arrow_back" size={20} color="#12BBF0" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />
        <View style={styles.brandInfo}>
          <Text style={styles.appTitle}>N.O.D.E. Wholesale</Text>
          <Text style={styles.appSubtitle}>National Order and Distribution Exchanges</Text>
        </View>
      </View>

      <Text style={styles.pageHeading}>Wholesale Trading Terms & Policies</Text>
      <Text style={styles.pageSubheading}>
        Governs bulk transactions, minimum order quantities (MOQs), pallet inspection, and escrow protection on N.O.D.E.
      </Text>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="inventory_2" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>1. Order Commitments & MOQs</Text>
        </View>
        <Text style={styles.sectionBody}>
          Wholesale tier prices are strictly binding upon confirmation of order quantities. Minimum Order Quantities (MOQs) are determined by verified manufacturers and importers. Sub-tier adjustments are subject to supplier approval before freight dispatch.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="verified_user" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>2. Escrow & Payment Release</Text>
        </View>
        <Text style={styles.sectionBody}>
          Buyer funds deposited via Stanbic Bank escrow or Mobile Money Business are safeguarded until signed delivery confirmation is uploaded by the receiving warehouse manager. Suppliers are guaranteed payout upon verified handover.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="fact_check" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>3. Inspection Window & Returns</Text>
        </View>
        <Text style={styles.sectionBody}>
          Buyers have forty-eight (48) hours from shipment arrival to conduct QA batch sampling. Any discrepancy must be logged via the N.O.D.E. dispute portal. Manufacturer warranties apply for 14 to 90 days depending on catalog classification.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="gavel" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>4. UNBS & East African Compliance</Text>
        </View>
        <Text style={styles.sectionBody}>
          All electronic, chemical, and consumable wholesale lots include digital UNBS QA certifications and tax invoice receipts fully compliant with Uganda Revenue Authority (URA) EFRIS regulations.
        </Text>
      </View>

      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          &copy; {new Date().getFullYear()} N.O.D.E. (National Order and Distribution Exchanges).
        </Text>
        <Text style={styles.footerSubtext}>
          Kampala, Uganda &bull; B2B Wholesale Distribution Network
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 60,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    color: '#12BBF0',
    fontSize: 16,
    fontWeight: '600',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  appLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  brandInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#12BBF0',
    marginTop: 2,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F6FC',
    marginBottom: 8,
  },
  pageSubheading: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8B949E',
  },
  footerBox: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6E7681',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#484F58',
    marginTop: 4,
  },
});
