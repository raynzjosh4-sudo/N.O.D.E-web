import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';

interface ShimmerBlockProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  circle?: boolean;
  style?: ViewStyle;
}

export function ShimmerBlock({
  width = '100%',
  height,
  borderRadius = 8,
  circle = false,
  style,
}: ShimmerBlockProps) {
  const { isDark } = useAppTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const baseOpacity = isDark ? 0.08 : 0.06;
  const highlightOpacity = isDark ? 0.22 : 0.16;

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [baseOpacity, highlightOpacity],
  });

  const baseColor = isDark ? '#FFFFFF' : '#000000';

  const shapeStyle: ViewStyle = circle
    ? {
        width: typeof width === 'number' ? width : height,
        height,
        borderRadius: height / 2,
      }
    : {
        width: width as any,
        height,
        borderRadius,
      };

  return (
    <Animated.View
      style={[
        styles.block,
        shapeStyle,
        {
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
