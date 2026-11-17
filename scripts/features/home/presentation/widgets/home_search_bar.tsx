import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { NodeColors as colors } from '../../../../core/theme/app_theme';
import MaterialIcon from '../../../../core/widgets/material_icon';

export default function HomeSearchBar() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.row}>
      <View style={styles.searchField}>
        <MaterialIcon name="search" size={18} color="#7A7F87" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for products..."
          placeholderTextColor="#7A7F87"
          style={styles.input}
        />
        {query.length === 0 && (
          <View style={styles.cart}>
            <MaterialIcon name="shopping_cart" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.filter}>
        <MaterialIcon name="tune" size={18} color={colors.ink} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchField: {
    height: 42,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: colors.ink,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  cart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyan,
  },
  filter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
