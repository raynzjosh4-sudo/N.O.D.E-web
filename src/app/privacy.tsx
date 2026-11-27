import { useEffect } from 'react';
import { View, ActivityIndicator, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { NODE_LEGAL_PORTAL_URL } from '@/core/constants/legal';

export default function PrivacyRoute() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(NODE_LEGAL_PORTAL_URL);
    } else {
      Linking.openURL(NODE_LEGAL_PORTAL_URL).catch(() => {});
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#12BBF0" />
    </View>
  );
}
