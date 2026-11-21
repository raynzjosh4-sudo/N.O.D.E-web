import { Share, Platform, Linking } from 'react-native';
import { Product } from '@/features/inventory/domain/entities/product';

export const BASE_WEB_URL = 'https://node.crimchart.com';

/**
 * Returns the canonical sharing URL for a product.
 * When posted to WhatsApp, Facebook, Twitter, or Google,
 * the Cloudflare SEO Worker intercepts this URL to generate rich image and price previews.
 */
export function getProductShareUrl(productId: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : BASE_WEB_URL;
  return `${origin}/product/specs/${productId}`;
}

/**
 * Copies the clean product link to clipboard.
 */
export async function copyProductLink(
  product: Product,
  onToast?: (message: string) => void
): Promise<string> {
  const shareUrl = getProductShareUrl(product.id);
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      if (onToast) onToast('Product link copied! Ready to paste into WhatsApp.');
    }
  } catch (err) {
    console.warn('[copyProductLink] Clipboard failed:', err);
  }
  return shareUrl;
}

/**
 * Directly opens WhatsApp with the formatted product share message.
 */
export function shareToWhatsApp(product: Product): void {
  const shareUrl = getProductShareUrl(product.id);
  const price = product.srp ? `UGX ${product.srp.toLocaleString()}` : '';
  const text = `*${product.name}* — Wholesale ${price}\nOrder directly from verified suppliers on N.O.D.E:\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  Linking.openURL(whatsappUrl);
}

/**
 * Shares a product via Web Share API or Native Share dialog.
 * If Web Share is not supported or cancelled, seamlessly copies the product link to clipboard.
 */
export async function shareProduct(
  product: Product,
  onToast?: (message: string) => void
): Promise<void> {
  const shareUrl = getProductShareUrl(product.id);
  const shareTitle = product.name;
  const priceText = product.srp ? ` for UGX ${product.srp.toLocaleString()}` : '';
  const shareText = `Check out ${product.name} on N.O.D.E Wholesale${priceText}!\n${shareUrl}`;

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
        message: shareText,
        url: shareUrl,
      });
    }
  } catch (err) {
    console.warn('[shareProduct] Share/clipboard failed:', err);
  }
}

