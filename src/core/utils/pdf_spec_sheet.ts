import { Platform, Share } from 'react-native';
import { API_CONFIG } from '@/core/api/api_config';
import { Product } from '@/features/inventory/domain/entities/product';
import { ColorGroup } from '@/features/home/presentation/pages/specificationorderpage/order_models';

export interface SpecSheetOrderEntry {
  name: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    brand?: string;
    sku?: string;
    srp?: number;
    imageUrl?: string;
    price_tiers?: { minQuantity: number; price: number }[];
    moq?: number;
    supplierName?: string;
    warehouseLoc?: string;
    stockQuantity?: number;
  };
  imageUrl?: string;
  image_url?: string;
  color: string;
  colorHex: string;
  size_quantities: Record<string, number>;
  confirmedGroups: ColorGroup[];
  unit_price: number;
  total_units: number;
  totalUnits: number;
  subtotal: number;
}

export interface SpecSheetPayload {
  order_id: string;
  title: string;
  supplier_id?: string;
  business_name: string;
  business_phone: string;
  business_city: string;
  business_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  buyer_user: {
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  buyer_business: {
    legal_name?: string;
    city?: string;
    physical_address?: string;
    phone_number?: string;
  };
  entries_json: SpecSheetOrderEntry[];
}

export interface BuildSpecSheetItemInput {
  product: Product;
  groups: ColorGroup[];
  unitPrice: number;
}

/**
 * Build a unified spec-sheet payload compatible with both the backend
 * `/orders/pdf/preview` generator and the on-device PDF fallback generator.
 */
export function buildSpecSheetPayload(params: {
  orderId?: string;
  title: string;
  items: BuildSpecSheetItemInput[];
  buyerProfile?: {
    fullName?: string;
    legalBusinessName?: string;
    email?: string;
    phone?: string;
    warehouseAddress?: string;
  };
  isAuthenticated: boolean;
}): SpecSheetPayload {
  const orderId = params.orderId || `SPEC-${Date.now().toString(36).toUpperCase()}`;
  const profile = params.buyerProfile || {};

  const businessName =
    profile.legalBusinessName ||
    profile.fullName ||
    (params.isAuthenticated ? 'Verified Wholesale Buyer' : 'Guest Wholesale Buyer');
  const businessPhone = profile.phone || (params.isAuthenticated ? 'Not Specified' : 'Guest Inquiry');
  const businessAddress = profile.warehouseAddress || 'Kampala Wholesale Hub, Uganda';

  const entries_json: SpecSheetOrderEntry[] = params.items
    .filter((item) => item.groups.length > 0)
    .map((item) => {
      const totalUnits = item.groups.reduce(
        (acc, g) => acc + Object.values(g.sizeQtys).reduce((s, q) => s + (q || 0), 0),
        0
      );
      const mergedSizeQtys: Record<string, number> = {};
      item.groups.forEach((g) => {
        Object.entries(g.sizeQtys).forEach(([sz, q]) => {
          if (q > 0) mergedSizeQtys[sz] = (mergedSizeQtys[sz] || 0) + q;
        });
      });

      const firstColor = item.groups[0]?.color;
      return {
        name: item.product.name,
        product_id: item.product.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          sku: item.product.sku,
          srp: item.product.srp,
          imageUrl: item.product.imageUrl,
          price_tiers: item.product.priceTiers,
          moq: item.product.moq,
          supplierName: item.product.supplierName,
          warehouseLoc: item.product.warehouseLoc,
          stockQuantity: item.product.stockQuantity,
        },
        imageUrl: item.product.imageUrl,
        image_url: item.product.imageUrl,
        color: item.groups.length === 1 && firstColor ? firstColor.label : `${item.groups.length} Colors`,
        colorHex: firstColor?.color || '#12BBF0',
        size_quantities: mergedSizeQtys,
        confirmedGroups: item.groups,
        unit_price: item.unitPrice,
        total_units: totalUnits,
        totalUnits,
        subtotal: totalUnits * item.unitPrice,
      };
    });

  const totalAmount = entries_json.reduce((sum, entry) => sum + entry.subtotal, 0);

  return {
    order_id: orderId,
    title: params.title,
    supplier_id: params.items[0]?.product.supplierId || '',
    business_name: businessName,
    business_phone: businessPhone,
    business_city: 'Kampala',
    business_address: businessAddress,
    total_amount: totalAmount,
    status: 'draft',
    created_at: new Date().toISOString(),
    buyer_user: {
      full_name: profile.fullName || businessName,
      email: profile.email || '',
      phone_number: businessPhone,
    },
    buyer_business: {
      legal_name: businessName,
      city: 'Kampala',
      physical_address: businessAddress,
      phone_number: businessPhone,
    },
    entries_json,
  };
}

function sanitisePdfText(input: string): string {
  const normalized = (input || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00d7/g, 'x')
    .replace(/\u2022/g, '*')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7E]/g, ' ');
  return normalized.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [0, 0, 0];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [0, 0, 0];
  return [r, g, b];
}

function formatUgx(val: number): string {
  return `UGX ${Math.round(val || 0).toLocaleString('en-US')}`;
}

function truncateText(text: string, maxChars: number): string {
  if (!text) return '';
  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 3))}...` : text;
}

/**
 * Pure TypeScript A4 PDF 1.4 generator producing a multi-page N.O.D.E. Order Spec Sheet.
 * Requires zero network access, zero authentication, and zero native modules.
 */
export function generateSpecSheetPdfBytes(payload: SpecSheetPayload): Uint8Array {
  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 30;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BOTTOM_LIMIT = 52;

  const pages: string[][] = [[]];
  let topY = 26;

  const cmds = () => pages[pages.length - 1];

  const ensureSpace = (neededHeight: number) => {
    if (topY + neededHeight > PAGE_H - BOTTOM_LIMIT) {
      pages.push([]);
      topY = 30;
    }
  };

  const drawRect = (x: number, yFromTop: number, w: number, h: number, fillHex?: string, strokeHex?: string, lineWidth = 0.5) => {
    const pdfY = PAGE_H - yFromTop - h;
    if (fillHex && strokeHex) {
      const [fr, fg, fb] = hexToRgbTuple(fillHex);
      const [sr, sg, sb] = hexToRgbTuple(strokeHex);
      cmds().push(
        `${fr.toFixed(3)} ${fg.toFixed(3)} ${fb.toFixed(3)} rg`,
        `${sr.toFixed(3)} ${sg.toFixed(3)} ${sb.toFixed(3)} RG`,
        `${lineWidth} w`,
        `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`
      );
    } else if (fillHex) {
      const [fr, fg, fb] = hexToRgbTuple(fillHex);
      cmds().push(
        `${fr.toFixed(3)} ${fg.toFixed(3)} ${fb.toFixed(3)} rg`,
        `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`
      );
    } else if (strokeHex) {
      const [sr, sg, sb] = hexToRgbTuple(strokeHex);
      cmds().push(
        `${sr.toFixed(3)} ${sg.toFixed(3)} ${sb.toFixed(3)} RG`,
        `${lineWidth} w`,
        `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`
      );
    }
  };

  const drawLine = (x1: number, y1Top: number, x2: number, y2Top: number, colorHex: string, width = 0.6) => {
    const [r, g, b] = hexToRgbTuple(colorHex);
    cmds().push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`,
      `${width} w`,
      `${x1.toFixed(2)} ${(PAGE_H - y1Top).toFixed(2)} m`,
      `${x2.toFixed(2)} ${(PAGE_H - y2Top).toFixed(2)} l S`
    );
  };

  const drawText = (
    raw: string,
    x: number,
    yFromTop: number,
    size: number,
    opts?: { bold?: boolean; color?: string; align?: 'left' | 'right' | 'center'; boxWidth?: number }
  ) => {
    const str = sanitisePdfText(raw);
    const fontKey = opts?.bold ? '/F2' : '/F1';
    const [r, g, b] = hexToRgbTuple(opts?.color || '#1A1A2E');
    const estCharWidth = size * (opts?.bold ? 0.56 : 0.51);
    const approxWidth = str.length * estCharWidth;
    let drawX = x;
    if (opts?.align === 'right' && opts.boxWidth) {
      drawX = x + opts.boxWidth - approxWidth;
    } else if (opts?.align === 'center' && opts.boxWidth) {
      drawX = x + Math.max(0, (opts.boxWidth - approxWidth) / 2);
    }
    const pdfY = PAGE_H - yFromTop;
    cmds().push(
      'BT',
      `${fontKey} ${size} Tf`,
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
      `1 0 0 1 ${drawX.toFixed(2)} ${pdfY.toFixed(2)} Tm`,
      `(${str}) Tj`,
      'ET'
    );
  };

  const issuedDate = new Date(payload.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });

  // 1. Dark Executive Header Banner
  drawRect(MARGIN, topY, CONTENT_W, 56, '#0D0D1A');
  drawRect(MARGIN + 14, topY + 18, 20, 20, '#00BFFF');
  drawText('N', MARGIN + 14, topY + 33, 13, { bold: true, color: '#0D0D1A', align: 'center', boxWidth: 20 });
  drawText('N.O.D.E.', MARGIN + 44, topY + 26, 17, { bold: true, color: '#FFFFFF' });
  drawText('NATIONAL ORDER & DISTRIBUTION EXCHANGE', MARGIN + 44, topY + 40, 7, { bold: true, color: '#8B949E' });
  drawText('[ OFFICIAL SPEC SHEET ]', MARGIN + CONTENT_W - 210, topY + 23, 8, {
    bold: true,
    color: '#00BFFF',
    align: 'right',
    boxWidth: 196,
  });
  drawText(`ISSUED: ${issuedDate.toUpperCase()}`, MARGIN + CONTENT_W - 210, topY + 36, 7, {
    bold: true,
    color: '#A1A1AA',
    align: 'right',
    boxWidth: 196,
  });
  topY += 56;

  // 2. Merchant Identity Bar
  drawRect(MARGIN, topY, CONTENT_W, 52, '#FAFAFA', '#E4E4E7', 0.6);
  const buyerName = (payload.buyer_user?.full_name || payload.business_name || 'WHOLESALE BUYER').toUpperCase();
  const bizLegal = payload.buyer_business?.legal_name || 'N.O.D.E. Wholesale Spec Sheet';
  const city = (payload.buyer_business?.city || payload.business_city || 'KAMPALA').toUpperCase();
  const address = payload.buyer_business?.physical_address || payload.business_address || 'Kampala Wholesale Hub';
  const phone = payload.buyer_business?.phone_number || payload.business_phone || 'Not Specified';

  drawText('ISSUED TO MERCHANT', MARGIN + 12, topY + 14, 6.5, { bold: true, color: '#71717A' });
  drawText(truncateText(buyerName, 26), MARGIN + 12, topY + 27, 8.5, { bold: true, color: '#1A1A2E' });
  drawText(truncateText(bizLegal, 28), MARGIN + 12, topY + 39, 7, { color: '#71717A' });

  drawText('LOGISTICS DESTINATION', MARGIN + CONTENT_W * 0.37, topY + 14, 6.5, { bold: true, color: '#71717A' });
  drawText(truncateText(city, 22), MARGIN + CONTENT_W * 0.37, topY + 27, 8.5, { bold: true, color: '#1A1A2E' });
  drawText(truncateText(address, 28), MARGIN + CONTENT_W * 0.37, topY + 39, 7, { color: '#71717A' });

  drawText('CONTACT REGISTRY', MARGIN + CONTENT_W * 0.72, topY + 14, 6.5, {
    bold: true,
    color: '#71717A',
    align: 'right',
    boxWidth: CONTENT_W * 0.25,
  });
  drawText(truncateText(phone, 20), MARGIN + CONTENT_W * 0.72, topY + 27, 8.5, {
    bold: true,
    color: '#1A1A2E',
    align: 'right',
    boxWidth: CONTENT_W * 0.25,
  });
  drawText('NODE PARTNER NETWORK', MARGIN + CONTENT_W * 0.72, topY + 39, 6.5, {
    bold: true,
    color: '#0099CC',
    align: 'right',
    boxWidth: CONTENT_W * 0.25,
  });
  topY += 66;

  // 3. Line Item Blocks
  let grandUnits = 0;
  let grandTotal = 0;

  for (const entry of payload.entries_json) {
    const groups: ColorGroup[] =
      entry.confirmedGroups && entry.confirmedGroups.length > 0
        ? entry.confirmedGroups
        : [
            {
              color: { label: entry.color || 'Standard', color: entry.colorHex || '#12BBF0' },
              sizeQtys: entry.size_quantities || {},
            },
          ];

    const sizeSet = new Set<string>();
    groups.forEach((g) => {
      Object.keys(g.sizeQtys || {}).forEach((sz) => sizeSet.add(sz));
    });
    const allSizes = sizeSet.size > 0 ? Array.from(sizeSet).sort() : ['STD'];

    const rowHeight = 20;
    const headerBlockH = 74;
    const sizeChunks: string[][] = [];
    for (let i = 0; i < allSizes.length; i += 7) {
      sizeChunks.push(allSizes.slice(i, i + 7));
    }
    const tableHeight = sizeChunks.length * (1 + groups.length) * rowHeight + 28;
    ensureSpace(headerBlockH + tableHeight);

    const entryUnits =
      entry.total_units ||
      entry.totalUnits ||
      groups.reduce((sum, g) => sum + Object.values(g.sizeQtys || {}).reduce((a, b) => a + (b || 0), 0), 0);
    const unitPrice = Number(entry.unit_price || entry.product?.srp || 0);
    const entrySubtotal = Number(entry.subtotal || entryUnits * unitPrice);
    grandUnits += entryUnits;
    grandTotal += entrySubtotal;

    // Product Header Banner
    drawRect(MARGIN, topY, CONTENT_W - 95, 38, '#0D0D1A');
    drawRect(MARGIN + CONTENT_W - 95, topY, 95, 38, '#00BFFF');
    drawText(truncateText((entry.product?.name || entry.name || 'WHOLESALE ITEM').toUpperCase(), 48), MARGIN + 12, topY + 16, 11, {
      bold: true,
      color: '#FFFFFF',
    });
    drawText(
      `${(entry.product?.brand || 'N.O.D.E.').toUpperCase()} | SKU: ${entry.product?.sku || 'SKU-N/A'}`,
      MARGIN + 12,
      topY + 29,
      7,
      { color: '#A1A1AA' }
    );
    drawText(`${entryUnits} UNITS`, MARGIN + CONTENT_W - 95, topY + 22, 9, {
      bold: true,
      color: '#FFFFFF',
      align: 'center',
      boxWidth: 95,
    });
    topY += 38;

    // Product Specs Sub-row
    drawRect(MARGIN, topY, CONTENT_W, 34, '#161B22');
    drawText('SUPPLIER', MARGIN + 12, topY + 12, 6, { bold: true, color: '#71717A' });
    drawText(
      truncateText((entry.product?.supplierName || payload.business_name || 'VERIFIED SUPPLIER').toUpperCase(), 24),
      MARGIN + 12,
      topY + 24,
      7.5,
      { bold: true, color: '#FFFFFF' }
    );
    drawText('AVAILABILITY', MARGIN + CONTENT_W * 0.36, topY + 12, 6, { bold: true, color: '#71717A' });
    drawText(`${entry.product?.stockQuantity ?? 'IN STOCK'}`, MARGIN + CONTENT_W * 0.36, topY + 24, 7.5, {
      bold: true,
      color: '#22C55E',
    });
    drawText('WHOLESALE RATE', MARGIN + CONTENT_W * 0.56, topY + 12, 6, { bold: true, color: '#71717A' });
    drawText(`${formatUgx(unitPrice)} / pc`, MARGIN + CONTENT_W * 0.56, topY + 24, 7.5, {
      bold: true,
      color: '#00BFFF',
    });
    drawText('MOQ', MARGIN + CONTENT_W * 0.82, topY + 12, 6, { bold: true, color: '#71717A' });
    drawText(`${entry.product?.moq || 1} UNITS`, MARGIN + CONTENT_W * 0.82, topY + 24, 7.5, {
      bold: true,
      color: '#FFFFFF',
    });
    topY += 36;

    // Matrix Tables (chunked cleanly for long size lists)
    for (const chunkSizes of sizeChunks) {
      const colorColW = 145;
      const totalColW = 62;
      const sizeColW = (CONTENT_W - colorColW - totalColW) / chunkSizes.length;

      // Table Header
      drawRect(MARGIN, topY, CONTENT_W, rowHeight, '#0D0D1A');
      drawText('COLOR', MARGIN + 8, topY + 13, 7, { bold: true, color: '#FFFFFF' });
      chunkSizes.forEach((sz, idx) => {
        drawText(truncateText(sz.toUpperCase(), 10), MARGIN + colorColW + idx * sizeColW, topY + 13, 7, {
          bold: true,
          color: '#FFFFFF',
          align: 'center',
          boxWidth: sizeColW,
        });
      });
      drawText('TOTAL', MARGIN + CONTENT_W - totalColW, topY + 13, 7, {
        bold: true,
        color: '#FFFFFF',
        align: 'center',
        boxWidth: totalColW,
      });
      topY += rowHeight;

      groups.forEach((g, rIdx) => {
        const bg = rIdx % 2 === 1 ? '#FAFAFA' : '#FFFFFF';
        drawRect(MARGIN, topY, CONTENT_W, rowHeight, bg, '#E4E4E7', 0.4);
        const sq = g.sizeQtys || {};
        const groupRowTotal = Object.values(sq).reduce((s, q) => s + (q || 0), 0);

        drawText(truncateText(g.color?.label || 'Standard', 22), MARGIN + 8, topY + 13, 7.5, {
          bold: true,
          color: '#1A1A2E',
        });

        chunkSizes.forEach((sz, idx) => {
          const qty = sq[sz] || 0;
          const cellX = MARGIN + colorColW + idx * sizeColW;
          drawLine(cellX, topY, cellX, topY + rowHeight, '#E4E4E7', 0.4);
          drawText(qty > 0 ? String(qty) : '-', cellX, topY + 13, 7.5, {
            color: qty > 0 ? '#1A1A2E' : '#A1A1AA',
            align: 'center',
            boxWidth: sizeColW,
          });
        });

        const totX = MARGIN + CONTENT_W - totalColW;
        drawLine(totX, topY, totX, topY + rowHeight, '#E4E4E7', 0.4);
        drawText(String(groupRowTotal), totX, topY + 13, 7.5, {
          bold: true,
          color: '#1A1A2E',
          align: 'center',
          boxWidth: totalColW,
        });

        topY += rowHeight;
      });
    }

    // Subtotal Strip
    drawText(
      `UNIT PRICE (TIERED): ${formatUgx(unitPrice)}     TOTAL ITEM VALUE: ${formatUgx(entrySubtotal)}`,
      MARGIN,
      topY + 15,
      8.5,
      { bold: true, color: '#0099CC', align: 'right', boxWidth: CONTENT_W }
    );
    topY += 28;
  }

  // 4. Grand Total Consolidation Summary
  ensureSpace(155);
  const displayGrandTotal = payload.total_amount || grandTotal;
  drawRect(MARGIN, topY, CONTENT_W, 46, '#F4F4F5');
  drawLine(MARGIN, topY, MARGIN + CONTENT_W, topY, '#00BFFF', 2);
  drawText('ORDER CONSOLIDATION SUMMARY', MARGIN + 14, topY + 16, 7, { bold: true, color: '#71717A' });
  drawText(`Total Consolidated Units: ${grandUnits}`, MARGIN + 14, topY + 32, 9, { bold: true, color: '#18181B' });
  drawText('GRAND TOTAL VALUE', MARGIN + CONTENT_W - 220, topY + 16, 7.5, {
    bold: true,
    color: '#18181B',
    align: 'right',
    boxWidth: 206,
  });
  drawText(formatUgx(displayGrandTotal), MARGIN + CONTENT_W - 220, topY + 34, 13.5, {
    bold: true,
    color: '#0099CC',
    align: 'right',
    boxWidth: 206,
  });
  topY += 60;

  // 5. Verification Clearance Block
  drawRect(MARGIN, topY, CONTENT_W, 68, '#0D0D1A');
  drawRect(MARGIN + 14, topY + 14, 40, 40, '#FFFFFF');
  // Stylized digital seal grid
  drawRect(MARGIN + 19, topY + 19, 10, 10, '#0D0D1A');
  drawRect(MARGIN + 39, topY + 19, 10, 10, '#0D0D1A');
  drawRect(MARGIN + 19, topY + 39, 10, 10, '#0D0D1A');
  drawRect(MARGIN + 31, topY + 31, 6, 6, '#00BFFF');
  drawRect(MARGIN + 41, topY + 41, 8, 8, '#0D0D1A');

  drawText('DELIVERY VERIFICATION CLEARANCE', MARGIN + 68, topY + 22, 8.5, { bold: true, color: '#00BFFF' });
  drawText(
    'Official N.O.D.E. Wholesale Spec Sheet. Use this sheet for bulk quotation, review,',
    MARGIN + 68,
    topY + 35,
    7.2,
    { color: '#E4E4E7' }
  );
  drawText(
    'and B2B fulfillment clearance via the N.O.D.E. Wholesale Marketplace.',
    MARGIN + 68,
    topY + 45,
    7.2,
    { color: '#E4E4E7' }
  );
  drawText(`TOKEN ID: ${payload.order_id}`, MARGIN + 68, topY + 58, 7, { bold: true, color: '#A1A1AA' });
  topY += 80;

  // 6. Footer
  drawLine(MARGIN, topY, MARGIN + CONTENT_W, topY, '#E4E4E7', 0.5);
  drawText(
    'Generated by N.O.D.E. Wholesale Platform in association with NEXUS - Official B2B Specification Record',
    MARGIN,
    topY + 13,
    6.5,
    { color: '#71717A' }
  );

  // Assemble PDF Objects & Accurate Byte-Offset XRef Table
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let bytePos = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    bytePos += b.length;
  };

  pushStr('%PDF-1.4\n');

  // Object layout:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1 Helvetica
  // 4: Font F2 Helvetica-Bold
  // 5.. : pairs of (Page obj, Content stream obj)
  const offsets: number[] = [];
  const startObj = (objNum: number) => {
    offsets[objNum] = bytePos;
    pushStr(`${objNum} 0 obj\n`);
  };

  const firstPageObjNum = 5;
  const pageObjRefs: string[] = pages.map((_, idx) => `${firstPageObjNum + idx * 2} 0 R`);

  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObj(2);
  pushStr(`<< /Type /Pages /Kids [${pageObjRefs.join(' ')}] /Count ${pages.length} >>\nendobj\n`);

  startObj(3);
  pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

  startObj(4);
  pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

  pages.forEach((pageCmds, idx) => {
    const pageObjNum = firstPageObjNum + idx * 2;
    const streamObjNum = pageObjNum + 1;
    const streamContent = `${pageCmds.join('\n')}\n`;
    const streamBytes = encoder.encode(streamContent).length;

    startObj(pageObjNum);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObjNum} 0 R >>\nendobj\n`
    );

    startObj(streamObjNum);
    pushStr(`<< /Length ${streamBytes} >>\nstream\n${streamContent}endstream\nendobj\n`);
  });

  const totalObjs = firstPageObjNum + pages.length * 2;
  const xrefOffset = bytePos;
  pushStr(`xref\n0 ${totalObjs}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i < totalObjs; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(bytePos);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

/**
 * Synchronously open a placeholder browser tab before awaiting network calls
 * so Chrome/Safari popup blockers never block the resulting PDF view.
 */
export function reserveWebPopupTab(): Window | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const win = window.open('', '_blank');
    if (win && win.document) {
      win.document.open();
      win.document.write(
        '<!doctype html><html><head><title>Compiling N.O.D.E. PDF...</title></head>' +
          '<body style="margin:0;background:#0D1117;color:#E6EDF3;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">' +
          '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#00BFFF;margin-bottom:8px;">N.O.D.E.</div>' +
          '<div style="font-size:14px;color:#8B949E;">Preparing your official PDF document...</div></div></body></html>'
      );
      win.document.close();
    }
    return win;
  } catch {
    return null;
  }
}

export function closePopupTab(win: Window | null) {
  if (win && !win.closed) {
    try {
      win.close();
    } catch {
      // ignore cross-origin or already-closed errors
    }
  }
}

async function openPdfBlob(
  blob: Blob,
  filename: string,
  options?: { title?: string; preopenedWindow?: Window | null }
): Promise<void> {
  if (Platform.OS === 'web') {
    const blobUrl = URL.createObjectURL(blob);
    const win = options?.preopenedWindow;
    if (win && !win.closed) {
      win.location.replace(blobUrl);
    } else if (typeof document !== 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.target = '_blank';
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return;
  }

  const buffer = await blob.arrayBuffer();
  await openPdfBytes(new Uint8Array(buffer), filename, options);
}

/**
 * Open or preview raw PDF bytes on Web, Android, or iOS.
 */
export async function openPdfBytes(
  bytes: Uint8Array,
  filename: string,
  options?: { title?: string; preopenedWindow?: Window | null }
): Promise<void> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (Platform.OS === 'web') {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    await openPdfBlob(blob, safeName, options);
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, safeName);
  file.create({ intermediates: true, overwrite: true });
  await file.write(bytes);

  const canPreview = await file.canPreview({ mimeType: 'application/pdf' });
  if (canPreview) {
    await file.preview({
      title: options?.title || safeName,
      mimeType: 'application/pdf',
    });
  } else {
    await Share.share({
      title: options?.title || safeName,
      url: file.uri,
      message: `${options?.title || 'N.O.D.E. Order Spec Sheet'} (${file.uri})`,
    });
  }
}

/**
 * Try backend public `/orders/pdf/preview` first (rich ReportLab + QR PDF) and seamlessly
 * fall back to local on-device PDF generation if backend is unreachable or not updated yet.
 * Works completely unauthenticated as well as authenticated.
 */
export async function makeAndOpenSpecSheetPdf(payload: SpecSheetPayload): Promise<'server' | 'local'> {
  const preopenedWindow = reserveWebPopupTab();
  const filename = `NODE_Spec_${payload.order_id}.pdf`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const previewUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/orders/pdf/preview`;
      const response = await fetch(previewUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (response.ok && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        if (blob.size > 100) {
          await openPdfBlob(blob, filename, {
            title: payload.title,
            preopenedWindow,
          });
          return 'server';
        }
      }
    } catch {
      clearTimeout(timer);
    }

    // Guaranteed local fallback (works offline, unauthenticated, and zero server dependency)
    const localBytes = generateSpecSheetPdfBytes(payload);
    await openPdfBytes(localBytes, filename, {
      title: payload.title,
      preopenedWindow,
    });
    return 'local';
  } catch (err) {
    closePopupTab(preopenedWindow);
    throw err;
  }
}

/**
 * Fetch a protected order PDF endpoint using the caller's Bearer JWT token and open it.
 * Prevents `window.open` / `Linking.openURL` from dropping the Authorization header.
 */
export async function fetchAuthorizedPdfAndOpen(params: {
  rawUrl: string;
  token: string | null;
  filename: string;
  title?: string;
}): Promise<void> {
  const fullUrl = params.rawUrl.startsWith('http')
    ? params.rawUrl
    : `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${
        params.rawUrl.startsWith('/') ? params.rawUrl : `/${params.rawUrl}`
      }`;

  const headers: Record<string, string> = {};
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }

  if (Platform.OS === 'web') {
    const preopenedWindow = reserveWebPopupTab();
    try {
      const response = await fetch(fullUrl, { headers });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok || contentType.includes('application/json')) {
        let message = `Could not download PDF (${response.status}).`;
        try {
          const errJson = await response.json();
          message = errJson?.error?.message || errJson?.detail || errJson?.message || message;
        } catch {
          // ignore non-json body
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      await openPdfBlob(blob, params.filename, {
        title: params.title,
        preopenedWindow,
      });
      return;
    } catch (err) {
      closePopupTab(preopenedWindow);
      throw err;
    }
  }

  // Native iOS / Android: download with Bearer token to cache & open system preview
  const { File, Paths } = await import('expo-file-system');
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destination = new File(Paths.cache, safeName);
  const downloaded = await File.downloadFileAsync(fullUrl, destination, {
    idempotent: true,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  const canPreview = await downloaded.canPreview({ mimeType: 'application/pdf' });
  if (canPreview) {
    await downloaded.preview({
      title: params.title || safeName,
      mimeType: 'application/pdf',
    });
  } else {
    await Share.share({
      title: params.title || safeName,
      url: downloaded.uri,
      message: `${params.title || 'N.O.D.E. Order PDF'} (${downloaded.uri})`,
    });
  }
}
