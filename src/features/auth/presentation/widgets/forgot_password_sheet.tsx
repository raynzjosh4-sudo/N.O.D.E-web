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
import { useAuth } from '@/features/auth/context/auth_context';
import { useToast } from '@/core/widgets/whatsapp_dialog';

interface ForgotPasswordSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => Promise<boolean>;
}

type SheetStep = 'request_pin' | 'enter_pin';

export function ForgotPasswordSheet({
  visible,
  onClose,
  onSubmit,
}: ForgotPasswordSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { sendPasswordReset, resetPasswordWithPin } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [step, setStep] = useState<SheetStep>('request_pin');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendPin = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid account email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(email.trim().toLowerCase());
      } else {
        await sendPasswordReset(email.trim().toLowerCase());
      }
      showSuccess('Reset PIN Sent', `A 6-digit recovery PIN has been sent to ${email.trim()}.`);
      setStep('enter_pin');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to send recovery PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!pin.trim() || pin.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit PIN sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      await resetPasswordWithPin(email.trim().toLowerCase(), pin.trim(), newPassword);
      showSuccess(
        'Password Updated!',
        'Your password has been reset successfully. You can now log in with your new password.'
      );
      handleDismiss();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to update password. Please check your PIN and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setStep('request_pin');
    setErrorMsg('');
    setEmail('');
    setPin('');
    setNewPassword('');
    setConfirmPassword('');
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
                <View style={styles.headerTitleGroup}>
                  <MaterialIcon name="lock_reset" size={22} color={colors.primary} />
                  <Text style={[styles.title, { color: colors.onSurface }]}>
                    {step === 'request_pin' ? 'Reset Password' : 'Set New Password'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.closeButton, { backgroundColor: colors.cardColor }]}
                  onPress={handleDismiss}
                >
                  <MaterialIcon name="close" size={18} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                {step === 'request_pin'
                  ? 'Enter your verified account email. We will send a 6-digit security PIN to reset your password.'
                  : `Enter the 6-digit PIN sent to ${email} and choose your new password.`}
              </Text>

              {/* Error Message */}
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <MaterialIcon name="error_outline" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* STEP 1: Request PIN */}
              {step === 'request_pin' ? (
                <View style={styles.formSection}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>
                    ACCOUNT EMAIL ADDRESS
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: colors.cardColor, borderColor: colors.borderLight },
                    ]}
                  >
                    <MaterialIcon name="mail" size={20} color={colors.onSurfaceMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder="e.g. procurement@company.com"
                      placeholderTextColor={colors.onSurfaceMuted}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setErrorMsg('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleSendPin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcon name="send" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Send 6-Digit Reset PIN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* STEP 2: Enter PIN & New Password */
                <View style={styles.formSection}>
                  {/* PIN Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>
                      6-DIGIT RESET PIN
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: colors.cardColor, borderColor: colors.borderLight },
                      ]}
                    >
                      <MaterialIcon name="pin" size={20} color={colors.primary} />
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: colors.onSurface,
                            letterSpacing: 6,
                            fontWeight: '700',
                            fontSize: 18,
                          },
                        ]}
                        placeholder="123456"
                        placeholderTextColor={colors.onSurfaceMuted}
                        value={pin}
                        onChangeText={(t) => {
                          setPin(t);
                          setErrorMsg('');
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                    </View>
                  </View>

                  {/* New Password */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>
                      NEW PASSWORD
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: colors.cardColor, borderColor: colors.borderLight },
                      ]}
                    >
                      <MaterialIcon name="lock" size={20} color={colors.onSurfaceMuted} />
                      <TextInput
                        style={[styles.input, { color: colors.onSurface }]}
                        placeholder="At least 6 characters"
                        placeholderTextColor={colors.onSurfaceMuted}
                        value={newPassword}
                        onChangeText={(t) => {
                          setNewPassword(t);
                          setErrorMsg('');
                        }}
                        secureTextEntry={obscurePassword}
                      />
                      <TouchableOpacity
                        onPress={() => setObscurePassword(!obscurePassword)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcon
                          name={obscurePassword ? 'visibility' : 'visibility_off'}
                          size={18}
                          color={colors.onSurfaceMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm New Password */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>
                      CONFIRM NEW PASSWORD
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: colors.cardColor, borderColor: colors.borderLight },
                      ]}
                    >
                      <MaterialIcon name="lock" size={20} color={colors.onSurfaceMuted} />
                      <TextInput
                        style={[styles.input, { color: colors.onSurface }]}
                        placeholder="Re-enter new password"
                        placeholderTextColor={colors.onSurfaceMuted}
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          setErrorMsg('');
                        }}
                        secureTextEntry={obscurePassword}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleUpdatePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcon name="check_circle" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Update & Save Password</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.stepBackRow}>
                    <TouchableOpacity
                      onPress={handleSendPin}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.linkAction, { color: colors.primary }]}>
                        Resend PIN
                      </Text>
                    </TouchableOpacity>

                    <Text style={{ color: colors.onSurfaceMuted }}>•</Text>

                    <TouchableOpacity
                      onPress={() => setStep('request_pin')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.linkAction, { color: colors.onSurfaceMuted }]}>
                        Change Email
                      </Text>
                    </TouchableOpacity>
                  </View>
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
    maxWidth: 500,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetContainerDesktop: {
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 28,
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
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
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#EF4444',
    flex: 1,
  },
  formSection: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
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
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 0,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  stepBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  linkAction: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
  },
});
