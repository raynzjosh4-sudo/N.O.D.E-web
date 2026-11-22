import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth_context';

export interface CoachmarkTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: 'circle' | 'rect';
  title?: string;
  message: string;
  badgeText?: string;
  badgeType?: 'required' | 'optional' | 'info';
  position?: 'top' | 'bottom' | 'left' | 'right';
  actionLabel?: string;
  onAction?: () => void;
  nextStepId?: string;
}

interface CoachmarkContextType {
  activeCoachmark: CoachmarkTarget | null;
  showCoachmark: (target: CoachmarkTarget) => void;
  dismissCoachmark: () => void;
  startPostProductFlow: () => void;
  registerTargetLayout: (id: string, layout: { x: number; y: number; width: number; height: number }) => void;
  getTargetLayout: (id: string) => { x: number; y: number; width: number; height: number } | undefined;
}

const CoachmarkContext = createContext<CoachmarkContextType | undefined>(undefined);

export function CoachmarkProvider({ children }: { children: React.ReactNode }) {
  const [activeCoachmark, setActiveCoachmark] = useState<CoachmarkTarget | null>(null);
  const registeredLayouts = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const registerTargetLayout = useCallback(
    (id: string, layout: { x: number; y: number; width: number; height: number }) => {
      registeredLayouts.current[id] = layout;
    },
    []
  );

  const getTargetLayout = useCallback((id: string) => {
    return registeredLayouts.current[id];
  }, []);

  const showCoachmark = useCallback((target: CoachmarkTarget) => {
    setActiveCoachmark(target);
  }, []);

  const dismissCoachmark = useCallback(() => {
    setActiveCoachmark(null);
  }, []);

  /**
   * Intelligently routes the user when they want to post:
   * 1. If not logged in -> Directs them to sign in.
   * 2. If logged in as customer (non-supplier) -> Directs them to "Become a Supplier" sheet.
   * 3. If supplier -> Directs them to create wholesale listing.
   */
  const startPostProductFlow = useCallback(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      setTimeout(() => {
        showCoachmark({
          id: 'login_prompt',
          x: 24,
          y: 140,
          width: 320,
          height: 54,
          shape: 'rect',
          position: 'bottom',
          title: 'Sign In Required 🔒',
          badgeText: 'REQUIRED STEP',
          badgeType: 'required',
          message:
            'To post wholesale items or manage inventory on N.O.D.E., please log in or create an account first.',
          actionLabel: 'Sign In',
        });
      }, 500);
      return;
    }

    const role = (user.role || '').toLowerCase();
    const isSupplier = role === 'supplier' || role === 'admin';

    if (!isSupplier) {
      // Must first become a supplier
      router.push('/posts');
      setTimeout(() => {
        const layout = registeredLayouts.current['apply_supplier_btn'] || {
          x: 24,
          y: 280,
          width: 340,
          height: 48,
        };
        showCoachmark({
          id: 'become_supplier_guide',
          ...layout,
          shape: 'rect',
          position: 'bottom',
          title: 'Step 1: Become a Verified Supplier 🏢',
          badgeText: 'REQUIRED STEP 1',
          badgeType: 'required',
          message:
            'You are registered as a buyer. To post wholesale items, you must first register as a verified supplier. Tap here to submit your business details!',
          actionLabel: 'Apply Now',
          onAction: () => {
            dismissCoachmark();
          },
        });
      }, 600);
      return;
    }

    // Already a verified supplier! Direct to post listing
    router.push('/posts');
    setTimeout(() => {
      const layout = registeredLayouts.current['add_product_btn'] || {
        x: 24,
        y: 160,
        width: 140,
        height: 40,
      };
      showCoachmark({
        id: 'create_listing_guide',
        ...layout,
        shape: 'rect',
        position: 'bottom',
        title: 'Step 2: Create Wholesale Listing 📦',
        badgeText: 'READY TO POST',
        badgeType: 'info',
        message:
          'Tap here to add a new product! You can upload photos, set tiered wholesale prices, and set your MOQ.',
        actionLabel: 'Create Listing',
      });
    }, 600);
  }, [isAuthenticated, user, router, showCoachmark, dismissCoachmark]);

  return (
    <CoachmarkContext.Provider
      value={{
        activeCoachmark,
        showCoachmark,
        dismissCoachmark,
        startPostProductFlow,
        registerTargetLayout,
        getTargetLayout,
      }}
    >
      {children}
    </CoachmarkContext.Provider>
  );
}

export function useCoachmark() {
  const ctx = useContext(CoachmarkContext);
  if (!ctx) {
    throw new Error('useCoachmark must be used within a CoachmarkProvider');
  }
  return ctx;
}
