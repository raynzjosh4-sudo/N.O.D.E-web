import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useCopilot, POSTING_STEPS } from '../copilot_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { useAppTheme } from '@/core/theme/theme_context';

export function CopilotBotWidget() {
  const {
    isChatOpen,
    isGuidedMode,
    currentStepIndex,
    currentStep,
    messages,
    closeChat,
    toggleChat,
    startGuidedPostingTour,
    nextStep,
    prevStep,
    stopGuidedTour,
    sendMessage,
    autoFillSampleData,
  } = useCopilot();

  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<any>(null);

  // Animations
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const slideChatAnim = useRef(new Animated.Value(isChatOpen ? 0 : 300)).current;
  const guideDockAnim = useRef(new Animated.Value(isGuidedMode ? 0 : 200)).current;

  // Pulse effect on idle bot button
  useEffect(() => {
    if (!isGuidedMode && !isChatOpen) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleScale, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(bubbleScale, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isGuidedMode, isChatOpen, bubbleScale]);

  // Animate chat opening/closing
  useEffect(() => {
    Animated.spring(slideChatAnim, {
      toValue: isChatOpen ? 0 : 350,
      friction: 8,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isChatOpen, slideChatAnim]);

  // Animate guided dock opening/closing
  useEffect(() => {
    Animated.spring(guideDockAnim, {
      toValue: isGuidedMode ? 0 : 200,
      friction: 8,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isGuidedMode, guideDockAnim]);

  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, isChatOpen]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER 1: DOCKED GUIDANCE BAR (ACTIVE DURING GUIDED POSTING)
  // ─────────────────────────────────────────────────────────────
  if (isGuidedMode && currentStep) {
    const isLastStep = currentStepIndex === POSTING_STEPS.length - 1;

    return (
      <Animated.View
        style={[
          styles.guideDockContainer,
          {
            transform: [{ translateY: guideDockAnim }],
            left: isDesktop ? undefined : 12,
            right: 12,
            width: isDesktop ? 480 : undefined,
          },
        ]}
      >
        <View style={styles.guideCard}>
          {/* Header Row */}
          <View style={styles.guideHeader}>
            <View style={styles.guideStepBadge}>
              <View style={styles.botIconMini}>
                <MaterialIcon name="smart_toy" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.guideStepBadgeText}>
                Step {currentStepIndex + 1} of {POSTING_STEPS.length}: {currentStep.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={stopGuidedTour}
              style={styles.closeGuideBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcon name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>

          {/* Prompt speech */}
          <Text style={styles.guidePromptText}>{currentStep.botPrompt}</Text>

          {/* Pro tip pill */}
          <View style={styles.guideTipBox}>
            <MaterialIcon name="lightbulb" size={14} color="#F59E0B" />
            <Text style={styles.guideTipText}>{currentStep.tip}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.guideActionsRow}>
            {/* Auto-fill sample button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.autoFillBtn}
              onPress={autoFillSampleData}
            >
              <MaterialIcon name="auto_fix_high" size={14} color="#12BBF0" />
              <Text style={styles.autoFillText}>Auto-Fill Demo</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Back button */}
            {currentStepIndex > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.guideBackBtn}
                onPress={prevStep}
              >
                <MaterialIcon name="arrow_back" size={15} color="#E6EDF3" />
                <Text style={styles.guideBackText}>Back</Text>
              </TouchableOpacity>
            ) : null}

            {/* Next / Finish button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.guideNextBtn,
                isLastStep && { backgroundColor: '#238636' },
              ]}
              onPress={nextStep}
            >
              <Text style={styles.guideNextText}>
                {isLastStep ? 'Done & Review 🎉' : 'Next Field 👉'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER 2: FLOATING BOT BUTTON & CHAT SHEET
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── EXPANDED CHAT SHEET ── */}
      {isChatOpen ? (
        <Animated.View
          style={[
            styles.chatWindow,
            {
              transform: [{ translateY: slideChatAnim }],
              width: isDesktop ? 380 : undefined,
              left: isDesktop ? undefined : 12,
              right: 16,
              bottom: 84,
            },
          ]}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderInfo}>
              <View style={styles.botAvatar}>
                <MaterialIcon name="smart_toy" size={20} color="#FFFFFF" />
                <View style={styles.onlineBadge} />
              </View>
              <View>
                <Text style={styles.chatTitle}>N.O.D.E. Copilot</Text>
                <Text style={styles.chatSubtitle}>Wholesale AI Guide • Online</Text>
              </View>
            </View>

            <TouchableOpacity onPress={closeChat} style={styles.iconBtn}>
              <MaterialIcon name="keyboard_arrow_down" size={24} color="#E6EDF3" />
            </TouchableOpacity>
          </View>

          {/* Quick Action Suggestions */}
          <View style={styles.quickPillsWrap}>
            <TouchableOpacity
              style={styles.quickPillPrimary}
              onPress={startGuidedPostingTour}
            >
              <MaterialIcon name="rocket_launch" size={14} color="#FFFFFF" />
              <Text style={styles.quickPillPrimaryText}>Guide me to post a product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => sendMessage('Explain Wholesale Tier Pricing')}
            >
              <Text style={styles.quickPillText}>💰 Wholesale Tiers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => sendMessage('How does MOQ work?')}
            >
              <Text style={styles.quickPillText}>📦 MOQ Rules</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubbleWrap,
                    isUser ? styles.msgWrapUser : styles.msgWrapBot,
                  ]}
                >
                  {!isUser ? (
                    <View style={styles.botTinyAvatar}>
                      <MaterialIcon name="smart_toy" size={13} color="#FFFFFF" />
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.msgBubbleUser : styles.msgBubbleBot,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.msgTextUser : styles.msgTextBot,
                      ]}
                    >
                      {m.text}
                    </Text>

                    {/* Quick action buttons attached to bot message */}
                    {m.quickActions && m.quickActions.length > 0 ? (
                      <View style={styles.bubbleActions}>
                        {m.quickActions.map((qa, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.bubbleActionBtn}
                            onPress={qa.action}
                          >
                            <Text style={styles.bubbleActionText}>{qa.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.chatInputRow}>
              <TextInput
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Ask about posting, tiers, MOQ..."
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                style={styles.chatInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.sendBtn,
                  inputMessage.trim().length > 0 && styles.sendBtnActive,
                ]}
              >
                <MaterialIcon
                  name="arrow_upward"
                  size={18}
                  color={inputMessage.trim().length > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      {/* ── FLOATING TRIGGER BUTTON ── */}
      <Animated.View
        style={[
          styles.floatingBtnWrap,
          {
            transform: [{ scale: bubbleScale }],
            bottom: Platform.OS === 'web' ? 24 : 80,
            right: 18,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleChat}
          style={styles.floatingTrigger}
        >
          <View style={styles.botIconWrapper}>
            <MaterialIcon name="smart_toy" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.triggerTextWrap}>
            <Text style={styles.triggerLabel}>N.O.D.E. Copilot</Text>
            <Text style={styles.triggerSub}>Ask Guide</Text>
          </View>
          <View style={styles.glowingDot} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  /* Floating Trigger Button */
  floatingBtnWrap: {
    position: 'absolute',
    zIndex: 999990,
  },
  floatingTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F1A24',
    borderWidth: 1.5,
    borderColor: '#12BBF0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 28,
    shadowColor: '#12BBF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  botIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#12BBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTextWrap: {
    flexDirection: 'column',
  },
  triggerLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.2,
  },
  triggerSub: {
    color: '#58A6FF',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    marginLeft: 2,
  },

  /* Expanded Chat Window */
  chatWindow: {
    position: 'absolute',
    zIndex: 999995,
    maxHeight: 520,
    height: 480,
    backgroundColor: '#161B22',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#12BBF0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#3FB950',
    borderWidth: 1.5,
    borderColor: '#0D1117',
  },
  chatTitle: {
    color: '#E6EDF3',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  chatSubtitle: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  iconBtn: {
    padding: 4,
  },

  /* Quick Action Pills */
  quickPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F1A24',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12BBF0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  quickPillPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  quickPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
  },
  quickPillText: {
    color: '#C9D1D9',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  /* Messages List */
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 14,
    gap: 12,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: '90%',
  },
  msgWrapBot: {
    alignSelf: 'flex-start',
  },
  msgWrapUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botTinyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#12BBF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  msgBubbleBot: {
    backgroundColor: '#21262D',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  msgBubbleUser: {
    backgroundColor: '#12BBF0',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  msgTextBot: {
    color: '#E6EDF3',
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  bubbleActions: {
    marginTop: 8,
    gap: 6,
  },
  bubbleActionBtn: {
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  bubbleActionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },

  /* Input Row */
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  chatInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 20,
    paddingHorizontal: 14,
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#12BBF0',
  },

  /* Docked Guidance Card */
  guideDockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 36,
    zIndex: 999999,
  },
  guideCard: {
    backgroundColor: '#0F1A24',
    borderWidth: 1.5,
    borderColor: '#12BBF0',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#12BBF0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 24,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  guideStepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botIconMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#12BBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepBadgeText: {
    color: '#00E5FF',
    fontSize: 12.5,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.2,
  },
  closeGuideBtn: {
    padding: 4,
  },
  guidePromptText: {
    color: '#E6EDF3',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 8,
  },
  guideTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 12,
  },
  guideTipText: {
    color: '#FCD34D',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
  },
  guideActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(18, 187, 240, 0.3)',
  },
  autoFillText: {
    color: '#12BBF0',
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  guideBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#21262D',
  },
  guideBackText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  guideNextBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#12BBF0',
  },
  guideNextText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
});
