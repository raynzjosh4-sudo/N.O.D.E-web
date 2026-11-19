import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialIcon } from '@/core/widgets/material_icon';

export type ToastStatus = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  message?: string;
  status?: ToastStatus;
  duration?: number; // ms, default 3500
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [slideAnim, opacityAnim]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast(options);

      // Slide down WhatsApp style from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration ?? 3500;
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [slideAnim, opacityAnim, hideToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ title, message, status: 'success' });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ title, message, status: 'error' });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ title, message, status: 'info' });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ title, message, status: 'warning' });
    },
    [showToast]
  );

  // Status Colors & Icons (WhatsApp / Emerald clean style)
  const getStatusConfig = (status?: ToastStatus) => {
    switch (status) {
      case 'success':
        return {
          icon: 'check_circle',
          barColor: '#25D366', // WhatsApp Green
          iconColor: '#25D366',
        };
      case 'error':
        return {
          icon: 'error',
          barColor: '#EF4444',
          iconColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: 'warning',
          barColor: '#F59E0B',
          iconColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          barColor: '#12BBF0',
          iconColor: '#12BBF0',
        };
    }
  };

  const statusConfig = getStatusConfig(toast?.status);

  const toastContent = toast ? (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        isDesktop && styles.overlayDesktop,
      ]}
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Status Indicator Bar */}
        <View
          style={[
            styles.statusBar,
            { backgroundColor: statusConfig.barColor },
          ]}
        />

        {/* Icon */}
        <View style={styles.iconWrapper}>
          <MaterialIcon
            name={statusConfig.icon}
            size={22}
            color={statusConfig.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          ) : null}
        </View>

        {/* Action Button if specified */}
        {toast.actionLabel && toast.onAction ? (
          <TouchableOpacity
            onPress={() => {
              toast.onAction?.();
              hideToast();
            }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>{toast.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Close Button */}
        <TouchableOpacity onPress={hideToast} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcon name="close" size={16} color="rgba(255, 255, 255, 0.45)" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  ) : null;

  // On Web, portal the toast directly into document.body so it is never trapped
  // behind React Native Web's Modal portals (which attach directly to the DOM body).
  const renderedToast =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? (() => {
          try {
            const ReactDOM = require('react-dom');
            if (ReactDOM && typeof ReactDOM.createPortal === 'function' && document.body) {
              return ReactDOM.createPortal(toastContent, document.body);
            }
          } catch {
            // fallback to standard in-tree rendering
          }
          return toastContent;
        })()
      : toastContent;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideToast,
      }}
    >
      {children}
      {renderedToast}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    zIndex: 2147483647,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDesktop: {
    left: '50%',
    marginLeft: -240,
    width: 480,
    right: 'auto',
  },
  toastCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1C1F26', // Deep sleek WhatsApp-dark card
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
});
