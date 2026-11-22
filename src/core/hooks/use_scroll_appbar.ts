import { useRef, useCallback, useState } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';

interface UseScrollAppbarOptions {
  headerHeight?: number; // Total collapsible header height in pixels (default: 110)
  scrollThreshold?: number; // Min scroll delta before triggering collapse (default: 8)
  collapseDuration?: number; // Animation duration in ms (default: 200)
}

/**
 * useScrollAppbar
 * 
 * Smoothly collapses / slides up the top app bar when scrolling down,
 * and reveals it when scrolling up or returning to the top of the page.
 * Cross-platform compatible with React Native Web, iOS, and Android.
 */
export function useScrollAppbar(options: UseScrollAppbarOptions = {}) {
  const {
    headerHeight = 110,
    scrollThreshold = 8,
    collapseDuration = 220,
  } = options;

  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const isHiddenRef = useRef(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const showHeader = useCallback(() => {
    if (!isHiddenRef.current) return;
    isHiddenRef.current = false;
    setIsHeaderVisible(true);

    Animated.parallel([
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: collapseDuration,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: collapseDuration * 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [collapseDuration, headerTranslateY, headerOpacity]);

  const hideHeader = useCallback(() => {
    if (isHiddenRef.current) return;
    isHiddenRef.current = true;
    setIsHeaderVisible(false);

    Animated.parallel([
      Animated.timing(headerTranslateY, {
        toValue: -headerHeight,
        duration: collapseDuration,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: collapseDuration * 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [collapseDuration, headerHeight, headerTranslateY, headerOpacity]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      // When near the top, always show the header
      if (currentY <= 15) {
        showHeader();
        lastScrollY.current = Math.max(0, currentY);
        return;
      }

      // Scrolling Down past threshold -> Hide Header
      if (diff > scrollThreshold && currentY > headerHeight * 0.5) {
        hideHeader();
      }
      // Scrolling Up past threshold -> Reveal Header
      else if (diff < -scrollThreshold) {
        showHeader();
      }

      lastScrollY.current = Math.max(0, currentY);
    },
    [headerHeight, hideHeader, scrollThreshold, showHeader]
  );

  return {
    headerTranslateY,
    headerOpacity,
    isHeaderVisible,
    onScroll,
    showHeader,
    hideHeader,
    headerHeight,
    headerAnimatedStyle: {
      transform: [{ translateY: headerTranslateY }],
      opacity: headerOpacity,
    },
    headerCollapseStyle: {
      transform: [{ translateY: headerTranslateY }],
      marginBottom: headerTranslateY,
      opacity: headerOpacity,
      overflow: 'hidden' as const,
    },
  };
}
