import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useAppTheme } from '@/core/theme/theme_context';
import { useAuth } from '@/features/auth/context/auth_context';
import { useCoachmark } from '@/core/coachmarks/coachmark_context';
import { BecomeSupplierSheet } from '@/features/profile/presentation/widgets/become_supplier_sheet';

interface GuideOption {
  id: string;
  icon: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  onPress: () => void;
}

export function FloatingRobotGuide() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const { showCoachmark, startPostProductFlow } = useCoachmark();

  const [isOpen, setIsOpen] = useState(false);
  const [showBecomeSupplier, setShowBecomeSupplier] = useState(false);

  // Pulse animation for robot button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const isSupplier =
    (user?.role || '').toLowerCase() === 'supplier' ||
    (user?.role || '').toLowerCase() === 'admin';

  const guideOptions: GuideOption[] = [
    {
      id: 'how_to_post',
      icon: 'add_box',
      badge: 'SUPPLIER',
      badgeColor: '#10B981',
      title: 'How to post a wholesale product',
      description:
        'If you are not yet a supplier, it first takes you to register your business. Then you can list wholesale items with MOQ, price tiers & warehouse inventory.',
      onPress: () => {
        setIsOpen(false);
        if (!isAuthenticated) {
          router.push('/login');
          setTimeout(() => {
            showCoachmark({
              id: 'login_guide',
              x: 24,
              y: 160,
              width: 320,
              height: 48,
              shape: 'rect',
              title: 'Step 1: Sign In 🔒',
              badgeText: 'REQUIRED',
              badgeType: 'required',
              message: 'Log in to your account first before posting wholesale listings or registering as a supplier.',
            });
          }, 600);
          return;
        }

        if (!isSupplier) {
          // Directs to become a supplier
          setShowBecomeSupplier(true);
        } else {
          // Direct to supplier products page
          router.push('/supplier-products');
        }
      },
    },
    {
      id: 'how_to_become_supplier',
      icon: 'storefront',
      badge: 'REGISTRATION',
      badgeColor: '#F59E0B',
      title: 'How to become a verified supplier',
      description:
        'Register your company name, warehouse location in Kampala, and phone number to start selling to wholesale buyers nationwide.',
      onPress: () => {
        setIsOpen(false);
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }
        setShowBecomeSupplier(true);
      },
    },
    {
      id: 'how_to_order',
      icon: 'shopping_cart_checkout',
      badge: 'WHOLESALE ORDER',
      badgeColor: '#00E5FF',
      title: 'How to place a wholesale order',
      description:
        'Configure size quantities & color variants. Increasing total pieces automatically lowers the price per unit according to wholesale tier discounts.',
      onPress: () => {
        setIsOpen(false);
        router.push('/');
        setTimeout(() => {
          showCoachmark({
            id: 'catalog_order_guide',
            x: 24,
            y: 260,
            width: 320,
            height: 120,
            shape: 'rect',
            title: 'Select a Product to Order 📦',
            badgeText: 'WHOLESALE CATALOG',
            badgeType: 'info',
            message: 'Tap any product card in the catalog to open its specifications, select sizes & colors, and order at tiered volume prices.',
            actionLabel: 'Got it',
          });
        }, 600);
      },
    },
    {
      id: 'how_to_bulk_order',
      icon: 'inventory_2',
      badge: 'MULTI-PRODUCT',
      badgeColor: '#8B5CF6',
      title: 'How to make a bulk multi-item order',
      description:
        'Save multiple listings to your wholesale bag using the top bookmark button, then order all items combined in a single pro-forma order.',
      onPress: () => {
        setIsOpen(false);
        router.push('/profile');
      },
    },
    {
      id: 'how_to_pdf_order',
      icon: 'picture_as_pdf',
      badge: 'OFFICIAL SPEC SHEET',
      badgeColor: '#EC4899',
      title: 'How to make a PDF order & spec sheet',
      description:
        'Every wholesale order generates a matrix PDF spec sheet with item breakdown, color/size distribution, supplier verification, and tiered price calculations.',
      onPress: () => {
        setIsOpen(false);
        router.push('/profile');
      },
    },
    {
      id: 'how_to_manage_orders',
      icon: 'assignment_turned_in',
      badge: 'TRACKING & STATUS',
      badgeColor: '#10B981',
      title: 'How to manage my orders',
      description:
        'View live status: Pending approval, processing at Kampala warehouse, dispatched, and download generated invoices and PDFs.',
      onPress: () => {
        setIsOpen(false);
        router.push('/profile');
      },
    },
  ];

  return (
    <>
      {/* ── FLOATING ROBOT BUTTON ── */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.pulseGlow,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.robotBtn,
            {
              backgroundColor: isDark ? '#0D1F1A' : '#E6FDF4',
              borderColor: '#10B981',
            },
          ]}
          onPress={() => setIsOpen(true)}
        >
          <MaterialIcon name="smart_toy" size={26} color="#10B981" />
          <View style={styles.helpBadge}>
            <Text style={styles.helpBadgeText}>GUIDE</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── INTERACTIVE GUIDE MENU MODAL ── */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.menuCard,
                  {
                    backgroundColor: isDark ? '#0A1513' : '#FFFFFF',
                    borderColor: isDark ? '#1C3A32' : '#D1FAE5',
                  },
                ]}
              >
                {/* Modal Header */}
                <View style={[styles.headerRow, { borderBottomColor: isDark ? '#1C3A32' : '#E5E7EB' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.robotAvatarCircle}>
                      <MaterialIcon name="smart_toy" size={22} color="#10B981" />
                    </View>
                    <View>
                      <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                        N.O.D.E. Guide Assistant 🤖
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: colors.onSurfaceMuted }]}>
                        Choose a topic to direct you step-by-step
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialIcon name="close" size={20} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>
                </View>

                {/* Guide Options List */}
                <ScrollView
                  style={styles.optionsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
                >
                  {guideOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.8}
                      onPress={opt.onPress}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isDark ? '#0F2620' : '#F9FAFB',
                          borderColor: isDark ? '#1C3A32' : '#E5E7EB',
                        },
                      ]}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: opt.badgeColor + '18' }]}>
                        <MaterialIcon name={opt.icon} size={20} color={opt.badgeColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.badgeRow}>
                          <View style={[styles.badgePill, { backgroundColor: opt.badgeColor + '20' }]}>
                            <Text style={[styles.badgePillText, { color: opt.badgeColor }]}>
                              {opt.badge}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.optionTitle, { color: colors.onSurface }]}>
                          {opt.title}
                        </Text>
                        <Text style={[styles.optionDescription, { color: colors.onSurfaceMuted }]}>
                          {opt.description}
                        </Text>
                      </View>
                      <MaterialIcon name="chevron_right" size={20} color={colors.onSurfaceMuted} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Embedded Become Supplier Sheet for direct access */}
      <BecomeSupplierSheet
        visible={showBecomeSupplier}
        onClose={() => setShowBecomeSupplier(false)}
        onSuccess={() => setShowBecomeSupplier(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 85,
    right: 20,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  robotBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  helpBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  helpBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  menuCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  robotAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  optionsList: {
    marginTop: 6,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 16,
  },
});
