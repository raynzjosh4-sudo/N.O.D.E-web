import { StyleSheet, Text, View } from 'react-native';

import { NodeColors as colors } from '../../../../../core/theme/app_theme';

export default function PopularSection() {
  return (
    <View>
      <Text style={styles.title}>Popular</Text>
      <View style={styles.row}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.card}>
            <View style={styles.thumbnail} />
            <View style={styles.details}>
              <View style={[styles.line, styles.name]} />
              <View style={[styles.line, styles.brand]} />
              <View style={styles.bottom}>
                <View style={[styles.line, styles.price]} />
                <View style={styles.cart} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 100,
  },
  card: {
    width: 220,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E8EAED',
  },
  details: {
    flex: 1,
    height: 72,
    marginLeft: 12,
    justifyContent: 'center',
  },
  line: {
    borderRadius: 4,
    backgroundColor: '#E8EAED',
  },
  name: {
    width: '90%',
    height: 12,
  },
  brand: {
    width: '55%',
    height: 8,
    marginTop: 6,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  price: {
    width: 56,
    height: 12,
  },
  cart: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cyan,
  },
});
