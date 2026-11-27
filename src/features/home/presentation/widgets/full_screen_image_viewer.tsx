import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageUrls: string[];
  initialIndex?: number;
  productTitle?: string;
  onClose: () => void;
  onShare?: () => void;
}

/**
 * Full-page image gallery viewer for mobile (mirrors Flutter's ImageViewerPage).
 * Only intended to be opened on mobile viewports when tapping a product image.
 */
export function FullScreenImageViewer({
  visible,
  imageUrls,
  initialIndex = 0,
  productTitle,
  onClose,
  onShare,
}: FullScreenImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const safeImages = imageUrls.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      const clamped = Math.max(0, Math.min(initialIndex, Math.max(0, safeImages.length - 1)));
      setCurrentIndex(clamped);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: clamped * width, animated: false });
      }, 40);
    }
  }, [visible, initialIndex, width, safeImages.length]);

  if (!visible || safeImages.length === 0) return null;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / Math.max(1, width));
    if (idx >= 0 && idx < safeImages.length) {
      setCurrentIndex(idx);
    }
  };

  const jumpTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, safeImages.length - 1));
    setCurrentIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Horizontal Paged Image Gallery */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
          style={styles.pager}
        >
          {safeImages.map((uri, idx) => (
            <View key={`full-img-${idx}`} style={[styles.slide, { width, height }]}>
              <Image
                source={{ uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Top Header Overlay */}
        <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
          <View style={styles.topRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.circleBtn}
              accessibilityLabel="Close full image viewer"
            >
              <MaterialIcon name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {safeImages.length}
              </Text>
            </View>

            {onShare ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onShare}
                style={styles.circleBtn}
                accessibilityLabel="Share product"
              >
                <MaterialIcon name="share" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.circleBtnPlaceholder} />
            )}
          </View>
        </SafeAreaView>

        {/* Bottom Caption & Thumbnail Strip */}
        {(productTitle || safeImages.length > 1) && (
          <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
            {productTitle ? (
              <Text style={styles.captionText} numberOfLines={2}>
                {productTitle}
              </Text>
            ) : null}

            {safeImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {safeImages.map((uri, idx) => {
                  const active = idx === currentIndex;
                  return (
                    <TouchableOpacity
                      key={`viewer-thumb-${idx}`}
                      activeOpacity={0.85}
                      onPress={() => jumpTo(idx)}
                      style={[
                        styles.thumbBox,
                        active && styles.thumbBoxActive,
                      ]}
                    >
                      <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </SafeAreaView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pager: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  counterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  captionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  thumbRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    opacity: 0.65,
  },
  thumbBoxActive: {
    borderColor: '#12BBF0',
    opacity: 1,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
});
