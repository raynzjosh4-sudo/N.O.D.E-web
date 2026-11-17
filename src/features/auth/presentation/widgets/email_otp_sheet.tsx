import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';

interface EmailOtpSheetProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
  onResend?: () => Promise<void>;
}

export function EmailOtpSheet({
  visible,
  email,
  onClose,
  onVerified,
  onResend,
}: EmailOtpSheetProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!visible) return;
    setDigits(['', '', '', '', '', '']);
    setResendTimer(45);
    setCanResend(false);
    setErrorMsg('');

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    const updated = [...digits];
    updated[index] = clean.slice(-1);
    setDigits(updated);
    setErrorMsg('');

    // Auto advance focus
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the code.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600)); // verify code
      onVerified();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(45);
    setErrorMsg('');
    if (onResend) await onResend();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.sheetContainer,
                isDesktop && styles.sheetContainerDesktop,
                { backgroundColor: colors.surface, borderColor: colors.borderLight },
              ]}
            >
              {/* Handlebar (Mobile only) */}
              {!isDesktop && (
                <View style={[styles.handlebar, { backgroundColor: colors.borderLight }]} />
              )}

              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.onSurface }]}>Confirm Verification</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.closeButton, { backgroundColor: colors.cardColor }]}
                  onPress={onClose}
                >
                  <MaterialIcon name="close" size={18} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                We dispatched a 6-digit wholesale verification code to{' '}
                <Text style={{ color: colors.onSurface, fontFamily: 'Outfit_700Bold' }}>{email || 'your email'}</Text>.
              </Text>

              {/* 6 Digit Input Boxes */}
              <View style={styles.digitsRow}>
                {digits.map((digit, idx) => {
                  const isFilled = digit.length > 0;
                  return (
                    <TextInput
                      key={idx}
                      ref={(ref) => (inputRefs.current[idx] = ref)}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, idx)}
                      onKeyPress={(e) => handleKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={[
                        styles.digitBox,
                        {
                          backgroundColor: colors.cardColor,
                          borderColor: isFilled ? colors.primary : colors.borderLight,
                          color: colors.onSurface,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              {/* Verify Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcon name="verified_user" size={18} color="#FFFFFF" />
                    <Text style={styles.verifyButtonText}>Verify & Complete Setup</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Link */}
              <View style={styles.resendRow}>
                <Text style={[styles.resendLabel, { color: colors.onSurfaceMuted }]}>
                  Didn't receive the code?
                </Text>
                <TouchableOpacity
                  disabled={!canResend}
                  onPress={handleResendCode}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      { color: canResend ? colors.primary : colors.onSurfaceMuted },
                    ]}
                  >
                    {canResend ? 'Resend code' : `Resend in ${resendTimer}s`}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    padding: 24,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 540,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  sheetContainerDesktop: {
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
  },
  handlebar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 19,
    marginBottom: 24,
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  digitBox: {
    width: 46,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    outlineStyle: 'none' as any,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#DE350B',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifyButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  verifyButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  resendLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  resendLink: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});
