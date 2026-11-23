import React, { useRef, useEffect } from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { useCoachmark } from './coachmark_context';

interface CoachmarkAnchorProps extends ViewProps {
  id: string;
  children: React.ReactNode;
}

/**
 * CoachmarkAnchor
 * 
 * Automatically captures the exact screen coordinates and dimensions
 * of any button or input so the spotlight overlay can highlight it.
 */
export function CoachmarkAnchor({ id, children, style, ...rest }: CoachmarkAnchorProps) {
  const { registerTargetLayout } = useCoachmark();
  const viewRef = useRef<any>(null);

  const measureWidget = () => {
    if (!viewRef.current) return;

    if (Platform.OS === 'web' && typeof viewRef.current.getBoundingClientRect === 'function') {
      const rect = viewRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        registerTargetLayout(id, {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        return;
      }
    }

    if (typeof viewRef.current.measureInWindow === 'function') {
      viewRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0 && height > 0) {
          registerTargetLayout(id, {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      });
    }
  };

  useEffect(() => {
    const t = setTimeout(measureWidget, 350);
    return () => clearTimeout(t);
  });

  return (
    <View
      ref={viewRef}
      onLayout={() => {
        measureWidget();
      }}
      style={style}
      {...rest}
    >
      {children}
    </View>
  );
}

