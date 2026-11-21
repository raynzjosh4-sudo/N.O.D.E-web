

import { MaterialIcon } from '@/core/widgets/material_icon';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyRoute() {
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
          <Text style={styles.appSubtitle}>National Online Distribution & Enterprise</Text>
        </View>
      </View>

      <Text style={styles.pageHeading}>Privacy Policy & Escrow Guarantee</Text>
      <Text style={styles.pageSubheading}>
        How N.O.D.E. safeguards wholesale buyer data, transaction records, escrow funds, and supplier confidentiality.
      </Text>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="security" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>1. Data Confidentiality & Business Records</Text>
        </View>
        <Text style={styles.sectionBody}>
          N.O.D.E. treats all purchase orders, inventory counts, and price tiers as proprietary business data. We do not sell or share merchant transaction volumes with unauthorized third parties.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="account_balance_wallet" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>2. Escrow Fund Security</Text>
        </View>
        <Text style={styles.sectionBody}>
          All wholesale deposits are isolated in regulated escrow accounts via licensed financial partners (Stanbic Bank and Mobile Money Business aggregators). Funds are protected against unauthorized claims until inventory sign-off.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcon name="lock" size={20} color="#12BBF0" />
          <Text style={styles.sectionTitle}>3. Account Authentication & Security</Text>
        </View>
        <Text style={styles.sectionBody}>
          Supplier and buyer logins utilize encrypted token-based sessions backed by Supabase Auth with Row Level Security (RLS). Passwords and private keys are never stored in plaintext.
        </Text>
      </View>

      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          &copy; {new Date().getFullYear()} N.O.D.E. (National Online Distribution & Enterprise).
        </Text>
        <Text style={styles.footerSubtext}>
          Kampala, Uganda &bull; Trust &amp; Safety Compliance
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
