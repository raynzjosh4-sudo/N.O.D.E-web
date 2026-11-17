import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface NodeIconProps {
  size?: number;
}

export function NodeIcon({ size = 22 }: NodeIconProps) {
  return (
    <Image
      source={require('@/../assets/images/node/nodeicon.png')}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 6,
  },
});
