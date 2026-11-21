import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/features/auth/context/auth_context';

interface GoogleOneTapPromptProps {
  onSuccess?: () => void;
}

/**
 * Headless Google One Tap integration using the official Google Identity Services (GSI) web SDK.
 * Renders null so no simulated/dummy UI is shown.
 * Google's native SDK injects and displays the official Google One Tap prompt with the user's
 * real Google account email, name, avatar, and one-tap sign-in button.
 */
export function GoogleOneTapPrompt({ onSuccess }: GoogleOneTapPromptProps) {
  const { user, isAuthenticated, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isAuthenticated || user) return;

    const existingScript = document.getElementById('google-gsi-client');

    const initGsi = () => {
      try {
        const google = (window as any).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: '222218933371-rug9cjnfcc8hgirbjvdd6do8p6akf37n.apps.googleusercontent.com',
            callback: async (res: any) => {
              if (res?.credential) {
                await signInWithGoogle({ idToken: res.credential });
                if (onSuccess) onSuccess();
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
          });

          // Trigger Google's official One Tap prompt
          google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              console.log('Google One Tap not displayed:', notification.getNotDisplayedReason());
            } else if (notification.isSkippedMoment()) {
              console.log('Google One Tap skipped:', notification.getSkippedReason());
            } else if (notification.isDismissedMoment()) {
              console.log('Google One Tap dismissed:', notification.getDismissedReason());
            }
          });
        }
      } catch (err) {
        console.warn('Google One Tap initialization error:', err);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    } else {
      initGsi();
    }
  }, [isAuthenticated, user, signInWithGoogle, onSuccess]);

  return null;
}
