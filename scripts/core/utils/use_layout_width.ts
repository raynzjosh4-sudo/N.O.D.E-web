import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

function subscribeToBrowserResize(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function getBrowserWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth;
}

export function useLayoutWidth() {
  const nativeWidth = useWindowDimensions().width;
  const browserWidth = useSyncExternalStore(
    subscribeToBrowserResize,
    getBrowserWidth,
    () => 0,
  );

  return Platform.OS === 'web' ? browserWidth : nativeWidth;
}
