import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useCopilot, GuidedStepId, POSTING_STEPS } from '../copilot_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface FieldSpotlightProps {
  fieldId: GuidedStepId;
  children: React.ReactNode;
  style?: any;
  titleOverride?: string;
}

/**
 * FieldSpotlight
 * 
 * Highlights the target field during the guided posting walkthrough with
 * a pulsing cyber-cyan border, high-contrast spotlight beacon, and step indicator badge.
 */
export function FieldSpotlight({ fieldId, children, style, titleOverride }: FieldSpotlightProps) {
  const { isGuidedMode, targetFieldId, currentStepIndex, registerScrollTarget } = useCopilot();
  const isActive = isGuidedMode && targetFieldId === fieldId;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.015,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(glowAnim, {
              toValue: 0.9,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(glowAnim, {
              toValue: 0.4,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.4);
    }
  }, [isActive, glowAnim, pulseAnim]);

  const stepNumber = currentStepIndex + 1;
  const stepInfo = POSTING_STEPS.find((s) => s.id === fieldId);
  const badgeLabel = titleOverride || stepInfo?.title || `Step ${stepNumber}`;

  return (
    <View
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        registerScrollTarget(fieldId, Math.max(0, layout.y - 40));
      }}
      style={[styles.container, style]}
    >
      {isActive ? (
        <Animated.View
          style={[
            styles.spotlightHighlightWrap,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: '#12BBF0',
              shadowColor: '#12BBF0',
            },
          ]}
        >
          {/* Beacon Floating Badge */}
          <View style={styles.beaconBadge}>
            <View style={styles.botIconCircle}>
              <MaterialIcon name="smart_toy" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.badgeText}>
              Step {stepNumber} of 6: {badgeLabel}
            </Text>
            <View style={styles.liveDot} />
          </View>

          {/* Children wrapped inside the spotlight */}
          <View style={styles.activeContent}>{children}</View>
        </Animated.View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 4,
  },
  spotlightHighlightWrap: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 6,
    backgroundColor: 'rgba(18, 187, 240, 0.05)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  beaconBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F2B3E',
    borderWidth: 1,
    borderColor: '#12BBF0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#12BBF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  botIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#12BBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
  },
  activeContent: {
    width: '100%',
  },
});
