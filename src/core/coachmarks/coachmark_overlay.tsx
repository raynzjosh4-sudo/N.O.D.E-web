import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useCoachmark } from './coachmark_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

export function CoachmarkOverlay() {
  const { activeCoachmark, dismissCoachmark } = useCoachmark();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeCoachmark) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 700,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [activeCoachmark, fadeAnim, pulseAnim]);

  if (!activeCoachmark) return null;

  const {
    x = 20,
    y = 100,
    width = 100,
    height = 50,
    shape = 'rect',
    title,
    message,
    badgeText,
    badgeType = 'info',
    actionLabel = 'Got it',
    onAction,
  } = activeCoachmark;

  const isCircle = shape === 'circle';
  const borderRadius = isCircle ? Math.max(width, height) / 2 : 12;

  // Position tooltip: top or bottom half of the screen
  const isTopHalf = y < screenHeight * 0.52;
  const tooltipTop = isTopHalf ? y + height + 16 : Math.max(20, y - 180);
  const tooltipLeft = Math.max(16, Math.min(x, screenWidth - 326));

  const badgeBg =
    badgeType === 'required'
      ? '#EF4444'
      : badgeType === 'optional'
      ? 'rgba(18, 187, 240, 0.2)'
      : '#10B981';

  const badgeTextColor =
    badgeType === 'required'
      ? '#FFFFFF'
      : badgeType === 'optional'
      ? '#00E5FF'
      : '#FFFFFF';

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      dismissCoachmark();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Full-Screen Dark Dimmed Backdrop */}
      <TouchableWithoutFeedback onPress={dismissCoachmark}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* ── HIGHLIGHTED SPOTLIGHT RING (Jiji / App Style) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlightRing,
          {
            top: y - 5,
            left: x - 5,
            width: width + 10,
            height: height + 10,
            borderRadius: isCircle ? (width + 10) / 2 : borderRadius + 6,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Target Focus Border cutout */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleAction}
        style={[
          styles.targetHole,
          {
            top: y,
            left: x,
            width,
            height,
            borderRadius,
          },
        ]}
      />

      {/* ── TOOLTIP SPEECH BUBBLE CARD ── */}
      <View
        style={[
          styles.tooltipBubble,
          {
            top: tooltipTop,
            left: tooltipLeft,
          },
        ]}
      >
        {/* Pointer Arrow pointing to the highlighted button */}
        <View
          style={[
            styles.pointerArrow,
            isTopHalf ? styles.arrowTop : styles.arrowBottom,
            { left: Math.min(Math.max(24, x - tooltipLeft + width / 2 - 10), 260) },
          ]}
        />

        {/* Badge & Close Button */}
        <View style={styles.tooltipHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            {badgeText ? (
              <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgePillText, { color: badgeTextColor }]}>
                  {badgeText}
                </Text>
              </View>
            ) : null}
            {title ? (
              <Text style={styles.tooltipTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={dismissCoachmark} style={styles.closeBtn}>
            <MaterialIcon name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>

        {/* Explanatory Message */}
        <Text style={styles.tooltipMessage}>{message}</Text>

        {/* Action Buttons Row */}
        <View style={styles.tooltipActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={dismissCoachmark}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Dismiss</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAction}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <MaterialIcon name="arrow_forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 10, 16, 0.82)',
    zIndex: 9999999,
    elevation: 99999,
  },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 24,
  },
  targetHole: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
  },
  tooltipBubble: {
    position: 'absolute',
    width: 310,
    backgroundColor: '#0A251E',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  pointerArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowTop: {
    top: -10,
    borderBottomWidth: 10,
    borderBottomColor: '#10B981',
  },
  arrowBottom: {
    bottom: -10,
    borderTopWidth: 10,
    borderTopColor: '#10B981',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgePillText: {
    fontSize: 9.5,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  tooltipTitle: {
    color: '#34D399',
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.2,
    flex: 1,
  },
  closeBtn: {
    padding: 2,
  },
  tooltipMessage: {
    color: '#E6EDF3',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
    marginBottom: 12,
  },
  tooltipActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});
