import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface HomeSearchBarProps {
  value?: string;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: (text: string) => void;
  onCartPress?: () => void;
}

export function HomeSearchBar({
  value,
  onSearchPress,
  onFilterPress,
  onChangeText,
  onSubmitEditing,
  onCartPress,
}: HomeSearchBarProps) {
  const { colors } = useAppTheme();
  const [internalText, setInternalText] = useState(value ?? '');
  const text = value !== undefined ? value : internalText;

  const handleChange = (newText: string) => {
    if (value === undefined) {
      setInternalText(newText);
    }
    onChangeText?.(newText);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalText('');
    }
    onChangeText?.('');
  };

  return (
    <View style={styles.container}>
      {/* Search Input Field */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <MaterialIcon
          name="search"
          size={18}
          color={colors.onSurfaceMuted}
        />
        <TextInput
          value={text}
          onChangeText={handleChange}
          onPressIn={onSearchPress}
          onFocus={onSearchPress}
          onSubmitEditing={() => onSubmitEditing?.(text)}
          placeholder="Search for products..."
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.input, { color: colors.onSurface }]}
          returnKeyType="search"
        />

        {text.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcon
              name="close"
              size={16}
              color={colors.onSurfaceMuted}
            />
          </TouchableOpacity>
        ) : (
          /* Cart Button Inside Search Bar */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCartPress}
            style={[styles.cartButton, { backgroundColor: colors.primary }]}
          >
            <MaterialIcon
              name="shopping_cart"
              size={14}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onFilterPress}
        style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      >
        <MaterialIcon
          name="tune"
          size={18}
          color={colors.onSurface}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: AppColors.onSurface,
    paddingVertical: 0,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  cartButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary, // Flutter primary color for cart icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});
