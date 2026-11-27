import { Linking, Platform } from 'react-native';

/**
 * Official N.O.D.E. External Legal & Privacy Portal (mirrors Flutter Dart LegalTermsPage)
 */
export const NODE_LEGAL_PORTAL_URL = 'https://raynzjosh4-sudo.github.io/N.O.D.E.T/';

export function openNodeLegalPortal(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(NODE_LEGAL_PORTAL_URL, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(NODE_LEGAL_PORTAL_URL).catch(() => {});
  }
}
