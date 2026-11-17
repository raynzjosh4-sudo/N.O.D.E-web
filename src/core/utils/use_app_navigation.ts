import { useRouter as useExpoRouter } from 'expo-router';

/**
 * Safe navigation hook for Web & Mobile:
 * Prevents "The action 'GO_BACK' was not handled by any navigator" error
 * when users refresh or directly load a nested page on the web.
 */
export function useAppNavigation() {
  const router = useExpoRouter();

  const safeGoBack = (fallbackRoute: string = '/') => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  return {
    ...router,
    safeGoBack,
  };
}
