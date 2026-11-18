/**
 * image_utils.ts
 * Shared image URL resolution and browser-side compression helpers.
 */

import { Platform } from 'react-native';

/** Backend base URL — matches BACKEND_BASE_URL in the Python config. */
const BACKEND_BASE = 'https://n-o-d-e-backent.onrender.com';

/** Fallback placeholder for broken or missing images. */
export const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80';

/**
 * Converts any stored image URL/path into an absolute HTTP(S) URL that can be
 * passed directly to `<Image source={{ uri }}>` on both web and mobile.
 *
 * Rules:
 *  1. Null / empty / asset-relative paths  → FALLBACK_IMAGE_URL
 *  2. Already absolute (http / https)       → returned as-is
 *  3. Starts with /static/                  → prefixed with BACKEND_BASE
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || url.trim() === '') return FALLBACK_IMAGE_URL;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/static/')) return `${BACKEND_BASE}${trimmed}`;
  // Legacy asset paths like "assets/welcomeimages/..." → fallback
  return FALLBACK_IMAGE_URL;
}

/**
 * Compresses a File/Blob on the **web** platform using an offscreen Canvas.
 * - Scales the image down so its longest side is at most `maxDim` pixels.
 * - Re-encodes as JPEG at the given quality (0–1).
 * - Returns the original Blob unchanged on native platforms or on error.
 */
export async function compressImageWeb(
  blob: Blob,
  maxDim = 1200,
  quality = 0.78
): Promise<Blob> {
  if (Platform.OS !== 'web') return blob;
  try {
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });
    URL.revokeObjectURL(url);

    let { naturalWidth: w, naturalHeight: h } = img;
    if (Math.max(w, h) > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.drawImage(img, 0, 0, w, h);

    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality
      )
    );
  } catch (err) {
    console.warn('[compressImageWeb] Compression failed, using original:', err);
    return blob;
  }
}
