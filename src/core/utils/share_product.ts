import { Share, Platform } from 'react-native';
import { Product } from '@/features/inventory/domain/entities/product';

/**
 * Shares a product via Web Share API or Native Share dialog.
 * If Web Share is not supported or cancelled, seamlessly copies the product link to clipboard.
 */
export async function shareProduct(
  product: Product,
  onToast?: (message: string) => void
): Promise<void> {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://node.crimchart.com';

  const shareUrl = `${origin}/product/specs/${product.id}`;
  const shareTitle = product.name;
  const shareText = `Check out ${product.name} on N.O.D.E Wholesale for UGX ${product.srp.toLocaleString()}!`;

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch {
      // User cancelled share dialog or platform fallback needed
    }
  }

  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      if (onToast) {
        onToast('Product link copied to clipboard!');
      }
    } else {
      await Share.share({
        title: shareTitle,
        message: `${shareText}\n${shareUrl}`,
        url: shareUrl,
      });
    }
  } catch (err) {
    console.warn('[shareProduct] Share/clipboard failed:', err);
  }
}
