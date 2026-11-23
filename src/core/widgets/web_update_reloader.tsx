import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { MaterialIcon } from './material_icon';

export function forceAppReload() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Clear any cached service workers or caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      }).catch(() => {});
    }
    // Hard reload
    window.location.reload();
  }
}

export function WebUpdateReloader() {
  if (Platform.OS !== 'web') {
    return null;
  }

  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const currentBuildTimestamp = useRef<number | null>(null);
  const slideAnim = useRef(new Animated.Value(-80)).current;

  // Read initial build time from meta tag or first fetch
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="app-build-time"]');
      if (meta) {
        const val = Number(meta.getAttribute('content'));
        if (!isNaN(val) && val > 0) {
          currentBuildTimestamp.current = val;
        }
      }
    }

    const checkRemoteVersion = async () => {
      try {
        setIsChecking(true);
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.buildTimestamp === 'number') {
            if (currentBuildTimestamp.current === null) {
              currentBuildTimestamp.current = data.buildTimestamp;
            } else if (data.buildTimestamp > currentBuildTimestamp.current) {
              setHasUpdate(true);
              Animated.spring(slideAnim, {
                toValue: 0,
                friction: 7,
                tension: 40,
                useNativeDriver: false,
              }).start();
            }
          }
        }
      } catch {
        // network issue or offline, ignore
      } finally {
        setIsChecking(false);
      }
    };

    // Check on startup
    checkRemoteVersion();

    // Check periodically every 35 seconds
    const interval = setInterval(checkRemoteVersion, 35000);

    // Check on tab focus / visibilitychange
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkRemoteVersion();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [slideAnim]);

  if (!hasUpdate) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        <View style={styles.iconCircle}>
          <MaterialIcon name="update" size={18} color="#00E5FF" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>New Update Published! 🚀</Text>
          <Text style={styles.subtitle}>
            A fresh version of N.O.D.E. is ready. Tap reload to get the latest features.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={forceAppReload}
          style={styles.reloadButton}
        >
          <MaterialIcon name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.reloadButtonText}>Reload Now</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999999,
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2636',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 620,
    width: '100%',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#00E5FF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    color: '#E6EDF3',
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12BBF0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});
