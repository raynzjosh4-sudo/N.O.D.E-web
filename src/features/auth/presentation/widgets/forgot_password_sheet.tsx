import React, { useState } from 'react';
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

interface ForgotPasswordSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => Promise<boolean>;
}

export function ForgotPasswordSheet({
  visible,
  onClose,
  onSubmit,
}: ForgotPasswordSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setIsSuccess(true);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to send recovery email. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsSuccess(false);
    setErrorMsg('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
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
                <Text style={[styles.title, { color: colors.onSurface }]}>Reset Password</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.closeButton, { backgroundColor: colors.cardColor }]}
                  onPress={handleDismiss}
                >
                  <MaterialIcon name="close" size={18} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                Enter your verified procurement email. We will send a secure password reset link to restore your account access.
              </Text>

              {isSuccess ? (
                <View style={[styles.successBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <MaterialIcon name="check_circle" size={24} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.successTitle, { color: '#10B981' }]}>Recovery Link Sent</Text>
                    <Text style={[styles.successText, { color: colors.onSurfaceMuted }]}>
                      If an active account exists for <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{email}</Text>, a reset instruction has been dispatched.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>REGISTERED BUSINESS EMAIL</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.cardColor, borderColor: errorMsg ? '#DE350B' : colors.borderLight }]}>
                    <MaterialIcon name="mail_outline" size={18} color={colors.onSurfaceMuted} />
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="procurement@company.ug"
                      placeholderTextColor={colors.onSurfaceMuted}
                      style={[styles.input, { color: colors.onSurface }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {errorMsg ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleSend}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcon name="send" size={16} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Send Recovery Link</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    marginBottom: 8,
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
    marginBottom: 20,
  },
  formSection: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 0,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#DE350B',
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 10,
  },
  successTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  successText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 18,
  },
});
