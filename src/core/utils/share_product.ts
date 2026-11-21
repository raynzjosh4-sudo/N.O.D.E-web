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
 * Extracts volume wholesale tier pricing for share messages
 */
export function formatWholesaleSharePricing(product: Product): {
  headline: string;
  tierSummary: string;
} {
  const tiers = Array.isArray(product.priceTiers)
    ? product.priceTiers.filter((t) => t && t.price > 0).sort((a, b) => a.minQuantity - b.minQuantity)
    : [];

  if (tiers.length > 0) {
    const prices = tiers.map((t) => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const moq = tiers[0].minQuantity || product.moq || 1;

    const tierSummary = tiers
      .map((t) => `${t.minQuantity}+ pcs: UGX ${t.price.toLocaleString()}`)
      .join(' • ');

    const headline =
      minPrice === maxPrice
        ? `Wholesale UGX ${minPrice.toLocaleString()} / unit (MOQ: ${moq} pcs)`
        : `Wholesale from UGX ${minPrice.toLocaleString()} / unit (MOQ: ${moq} pcs)`;

    return { headline, tierSummary };
  }

  const srp = product.srp || 0;
  const headline = srp > 0 ? `UGX ${srp.toLocaleString()} / unit` : 'Wholesale Direct';
  return { headline, tierSummary: '' };
}

/**
 * Directly opens WhatsApp with the formatted product share message.
 */
export function shareToWhatsApp(product: Product): void {
  const shareUrl = getProductShareUrl(product.id);
  const { headline, tierSummary } = formatWholesaleSharePricing(product);
  const tierBlock = tierSummary ? `\n📦 Wholesale Tiers: ${tierSummary}` : '';
  const text = `*${product.name}* — ${headline}${tierBlock}\nOrder directly from verified suppliers on N.O.D.E:\n${shareUrl}`;
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
  const { headline, tierSummary } = formatWholesaleSharePricing(product);
  const tierBlock = tierSummary ? ` | Tiers: ${tierSummary}` : '';
  const shareText = `Check out ${product.name} on N.O.D.E Wholesale — ${headline}${tierBlock}!\n${shareUrl}`;

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

