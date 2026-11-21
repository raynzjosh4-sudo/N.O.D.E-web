import React from 'react';
import { StyleSheet, Text, Platform } from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';

interface MaterialIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function MaterialIcon({ name, size = 20, color }: MaterialIconProps) {
  const { colors } = useAppTheme();
  const iconColor = color ?? colors.onSurface;

  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: size,
          lineHeight: size + 2,
          color: iconColor,
        },
      ]}
    >
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: Platform.select({
      web: "'Material Symbols Outlined', 'MaterialSymbols', sans-serif",
      default: 'MaterialSymbols',
    }),
    fontWeight: 'normal',
    textAlign: 'center',
    userSelect: 'none',
  },
});
