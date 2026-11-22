import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';

export type GuidedStepId =
  | 'images'
  | 'name_brand'
  | 'category'
  | 'pricing_moq'
  | 'stock_location'
  | 'publish';

export interface GuideStepInfo {
  id: GuidedStepId;
  title: string;
  fieldLabel: string;
  botPrompt: string;
  tip: string;
  scrollOffsetY: number;
}

export const POSTING_STEPS: GuideStepInfo[] = [
  {
    id: 'images',
    title: 'Product Photos & Media',
    fieldLabel: 'Media Upload',
    botPrompt:
      '📸 Step 1: Add high-resolution product photos. Pictures showing retail packaging, carton specs, and the real item build instant trust with wholesale buyers.',
    tip: 'Clear photos increase wholesale order inquiries by 3x.',
    scrollOffsetY: 0,
  },
  {
    id: 'name_brand',
    title: 'Product Title & Brand',
    fieldLabel: 'Name & Brand',
    botPrompt:
      '🏷️ Step 2: Enter the exact product title, SKU, and brand name. Retailers search by brand and model specs in the catalog.',
    tip: 'Example: "100W Monocrystalline Solar Panel — Prime Solar"',
    scrollOffsetY: 260,
  },
  {
    id: 'category',
    title: 'Category & Branch',
    fieldLabel: 'Category Selection',
    botPrompt:
      '📂 Step 3: Choose the category and branch for your product so retailers can discover it in the directory.',
    tip: 'Tap "Browse Tree" to select sub-branches like Electronics › Solar.',
    scrollOffsetY: 460,
  },
  {
    id: 'pricing_moq',
    title: 'Wholesale Tier Pricing & MOQ',
    fieldLabel: 'Volume Pricing Tiers',
    botPrompt:
      '💰 Step 4: Wholesale buyers purchase in volume! Set your bulk price tiers (e.g., 5+ pcs for 110,000 UGX, 10+ pcs for 100,000 UGX) and Minimum Order Quantity (MOQ).',
    tip: 'Tier pricing automatically shows discount rates to bulk buyers.',
    scrollOffsetY: 780,
  },
  {
    id: 'stock_location',
    title: 'Available Stock & Warehouse',
    fieldLabel: 'Stock & Location',
    botPrompt:
      '🏢 Step 5: Enter your current verified inventory count and Kampala warehouse/shop location for delivery and collection.',
    tip: 'Mentioning your Kampala hub (e.g. Kikuubo, Industrial Area) speeds up local pickup.',
    scrollOffsetY: 1250,
  },
  {
    id: 'publish',
    title: 'Review & Publish Listing',
    fieldLabel: 'Save & Publish',
    botPrompt:
      '🚀 Step 6: All set! Hit the "Save & Publish" button to broadcast your wholesale listing to verified merchants across Uganda.',
    tip: 'You can update stock or volume tiers at any time from your catalog.',
    scrollOffsetY: 1700,
  },
];

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: () => void }[];
}

interface CopilotContextType {
  isChatOpen: boolean;
  isGuidedMode: boolean;
  currentStepIndex: number;
  currentStep: GuideStepInfo | null;
  targetFieldId: GuidedStepId | null;
  messages: ChatMessage[];
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  startGuidedPostingTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  stopGuidedTour: () => void;
  sendMessage: (text: string) => void;
  registerScrollTarget: (id: GuidedStepId, yOffset: number) => void;
  scrollToStep: (yOffset: number) => void;
  setOnScrollToStep: (cb: ((yOffset: number) => void) | undefined) => void;
  autoFillSampleData?: () => void;
  setOnAutoFillSampleData: (cb: (() => void) | undefined) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const scrollCallbacksRef = useRef<((yOffset: number) => void) | undefined>(undefined);
  const autoFillCallbackRef = useRef<(() => void) | undefined>(undefined);
  const customOffsetsRef = useRef<Record<string, number>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Hello! I am your N.O.D.E. Wholesale Copilot. I can guide you step-by-step through posting products, setting wholesale price tiers, and managing inventory.',
      timestamp: 'Just now',
    },
  ]);

  const setOnScrollToStep = useCallback((cb: ((yOffset: number) => void) | undefined) => {
    scrollCallbacksRef.current = cb;
  }, []);

  const setOnAutoFillSampleData = useCallback((cb: (() => void) | undefined) => {
    autoFillCallbackRef.current = cb;
  }, []);

  const registerScrollTarget = useCallback((id: GuidedStepId, yOffset: number) => {
    customOffsetsRef.current[id] = yOffset;
  }, []);

  const scrollToStepIndex = useCallback((index: number) => {
    const step = POSTING_STEPS[index];
    if (step && scrollCallbacksRef.current) {
      const y = customOffsetsRef.current[step.id] ?? step.scrollOffsetY;
      scrollCallbacksRef.current(y);
    }
  }, []);

  const startGuidedPostingTour = useCallback(() => {
    setIsGuidedMode(true);
    setCurrentStepIndex(0);
    setIsChatOpen(false); // Switch from full chat to docked interactive guide bar

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        text: 'I want to post a wholesale product.',
        timestamp: 'Just now',
      },
      {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: '🚀 Excellent! Starting the step-by-step posting guide. Follow the glowing highlighted fields!',
        timestamp: 'Just now',
      },
    ]);

    // Navigate to /posts if not already there
    try {
      router.push('/posts');
    } catch {
      // ignore if already on route
    }

    setTimeout(() => {
      scrollToStepIndex(0);
    }, 400);
  }, [router, scrollToStepIndex]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < POSTING_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      scrollToStepIndex(nextIdx);
    } else {
      // Finished all steps
      setIsGuidedMode(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'bot',
          text: '🎉 Congratulations! You have completed all fields. Hit "Save & Publish" to activate your listing.',
          timestamp: 'Just now',
        },
      ]);
    }
  }, [currentStepIndex, scrollToStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      scrollToStepIndex(prevIdx);
    }
  }, [currentStepIndex, scrollToStepIndex]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < POSTING_STEPS.length) {
        setCurrentStepIndex(index);
        scrollToStepIndex(index);
      }
    },
    [scrollToStepIndex]
  );

  const stopGuidedTour = useCallback(() => {
    setIsGuidedMode(false);
  }, []);

  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);
  const toggleChat = useCallback(() => setIsChatOpen((prev) => !prev), []);

  const autoFillSampleData = useCallback(() => {
    if (autoFillCallbackRef.current) {
      autoFillCallbackRef.current();
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'user',
        text: trimmed,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, userMsg]);

      // Intelligent wholesale bot response
      setTimeout(() => {
        const lower = trimmed.toLowerCase();
        let reply = '';

        if (lower.includes('post') || lower.includes('add product') || lower.includes('sell') || lower.includes('create listing')) {
          reply = 'Ready to post? Tap below to launch the step-by-step interactive walkthrough!';
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              sender: 'bot',
              text: reply,
              timestamp: 'Just now',
              quickActions: [
                {
                  label: '🚀 Start Guided Posting',
                  action: startGuidedPostingTour,
                },
              ],
            },
          ]);
          return;
        } else if (lower.includes('price') || lower.includes('tier') || lower.includes('discount')) {
          reply =
            '💡 Wholesale Tier Pricing allows you to offer progressive volume discounts. For example: 1–4 units: 120,000 UGX, 5–9 units: 110,000 UGX, 10+ units: 100,000 UGX. This encourages retailers to purchase larger bulk orders!';
        } else if (lower.includes('moq') || lower.includes('minimum')) {
          reply =
            '📦 MOQ (Minimum Order Quantity) is the smallest quantity a buyer can purchase from you. For example, if MOQ = 5, retailers cannot checkout with fewer than 5 units.';
        } else if (lower.includes('escrow') || lower.includes('payment') || lower.includes('secure')) {
          reply =
            '🛡️ N.O.D.E. Escrow holds the buyer\'s payment safely when an order is placed. Funds are disbursed directly to your mobile money or bank once the goods are inspected and delivered in Kampala.';
        } else if (lower.includes('photo') || lower.includes('image')) {
          reply =
            '📸 For best results, upload 2–4 photos showing the product, manufacturer box/specs label, and master cartons. Good lighting makes products stand out!';
        } else {
          reply =
            `I'm here to help with your wholesale business! You can ask about setting bulk price tiers, MOQ, escrow guarantees, or start the guided product posting tour.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'bot',
            text: reply,
            timestamp: 'Just now',
          },
        ]);
      }, 500);
    },
    [startGuidedPostingTour]
  );

  const scrollToStep = useCallback((yOffset: number) => {
    scrollCallbacksRef.current?.(yOffset);
  }, []);

  const currentStep = isGuidedMode ? POSTING_STEPS[currentStepIndex] : null;
  const targetFieldId = currentStep ? currentStep.id : null;

  return (
    <CopilotContext.Provider
      value={{
        isChatOpen,
        isGuidedMode,
        currentStepIndex,
        currentStep,
        targetFieldId,
        messages,
        openChat,
        closeChat,
        toggleChat,
        startGuidedPostingTour,
        nextStep,
        prevStep,
        goToStep,
        stopGuidedTour,
        sendMessage,
        registerScrollTarget,
        scrollToStep,
        setOnScrollToStep,
        autoFillSampleData,
        setOnAutoFillSampleData,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return ctx;
}
