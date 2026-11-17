import { StyleSheet, Text, View } from 'react-native';

import { NodeColors as colors } from '../../../../core/theme/app_theme';

export default function QuickSelectionsList() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Suppliers</Text>
      <Text style={styles.more}>See more</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  more: {
    color: '#747982',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
