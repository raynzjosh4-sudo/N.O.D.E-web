import { apiClient } from '@/core/api/api_client';
import { API_ENDPOINTS } from '@/core/api/api_endpoints';
import {
  UserProfile,
  SavedProductItem,
  DraftOrder,
  WholesaleOrderItem,
  PdfDocumentItem,
  OrderStatusCode,
} from '../../domain/entities/profile_models';
import { ProductMapper } from '@/features/inventory/data/mappers/product_mapper';

export interface BackendProfileResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    profile_pic_url?: string | null;
  };
  business?: {
    user_id: string;
    legal_name: string;
    phone_number?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
    city?: string | null;
    physical_address?: string | null;
  } | null;
}

export interface BackendSavedItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selected_color?: string | null;
  selected_size?: string | null;
  product_snapshot?: any;
  created_at?: string;
}

export interface BackendOrderResponse {
  id?: string | null;
  order_id: string;
  user_id?: string | null;
  supplier_id?: string | null;
  business_name?: string | null;
  business_phone?: string | null;
  business_city?: string | null;
  business_address?: string | null;
  latitude?: number;
  longitude?: number;
  total_amount?: number;
  entries_json?: any[];
  pdf_id?: string | null;
  pdf_url?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export class ProfileApiService {
  /**
   * Fetch current user profile with business details
   */
  static async getProfile(): Promise<UserProfile> {
    const data = await apiClient<BackendProfileResponse>(API_ENDPOINTS.PROFILE.ME);
    const u = data.user;
    const b = data.business;

    const locationParts = [b?.physical_address, b?.city, b?.region].filter(Boolean);
    const warehouseAddress = locationParts.length > 0 ? locationParts.join(', ') : 'East Africa';

    return {
      id: u.id,
      fullName: u.full_name || 'Verified Member',
      legalBusinessName: b?.legal_name || u.full_name || 'Enterprise Wholesale',
      taxId: 'Verified Trade Account',
      email: u.email,
      phone: b?.phone_number || '',
      warehouseAddress,
      avatarUrl: u.profile_pic_url || undefined,
      isVerified: true,
    };
  }

  /**
   * Update user basic profile
   */
  static async updateUser(params: { fullName?: string; profilePicUrl?: string }): Promise<void> {
    await apiClient(API_ENDPOINTS.PROFILE.UPDATE, {
      method: 'PUT',
      body: JSON.stringify({
        full_name: params.fullName,
        profile_pic_url: params.profilePicUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Update business details
   */
  static async updateBusiness(params: {
    legalName: string;
    phoneNumber?: string;
    physicalAddress?: string;
    city?: string;
    region?: string;
  }): Promise<void> {
    await apiClient(API_ENDPOINTS.PROFILE.UPDATE_BUSINESS, {
      method: 'PUT',
      body: JSON.stringify({
        legal_name: params.legalName,
        phone_number: params.phoneNumber,
        physical_address: params.physicalAddress,
        city: params.city,
        region: params.region,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get user saved wishlist items
   */
  static async getSavedItems(): Promise<SavedProductItem[]> {
    const data = await apiClient<BackendSavedItem[]>(API_ENDPOINTS.SAVED.LIST);
    return data.map((item) => {
      const snap = item.product_snapshot || {};
      const product = snap.id
        ? ProductMapper.fromListItemDto({
            id: snap.id || item.product_id,
            name: snap.name || 'Saved Product',
            sku: snap.sku || '',
            brand: snap.brand || 'General',
            srp: snap.srp || 0,
            image_url: snap.imageUrl || snap.image_url || '',
            supplier_id: snap.supplierId,
            supplier_name: snap.supplierName,
          })
        : {
            id: item.product_id,
            name: 'Wholesale Product',
            brand: 'Verified',
            sku: '',
            srp: 0,
            imageUrl: '',
            aspectRatio: 1,
            supplierId: '',
            supplierName: 'Direct Supplier',
            warehouseLoc: 'Uganda',
            priceTiers: [{ minQuantity: 1, price: 0 }],
            status: 'active' as const,
            stockQuantity: 100,
            moq: 1,
            moqText: '1 min order',
          };

      return {
        id: item.id,
        product,
        quantity: item.quantity || 1,
        selectedColor: {
          label: item.selected_color || 'Standard',
          color: '#333333',
        },
        selectedSize: item.selected_size || 'Default',
        addedAt: item.created_at || new Date().toISOString(),
      };
    });
  }

  /**
   * Remove item from saved wishlist
   */
  static async removeSavedItem(savedItemId: string): Promise<void> {
    await apiClient(API_ENDPOINTS.SAVED.REMOVE(savedItemId), {
      method: 'DELETE',
    });
  }

  /**
   * Get saved order drafts
   */
  static async getDraftOrders(): Promise<DraftOrder[]> {
    const data = await apiClient<BackendOrderResponse[]>(API_ENDPOINTS.ORDERS.DRAFTS);
    return data.map((d) => {
      const entries = Array.isArray(d.entries_json) ? d.entries_json : [];
      const totalUnits = entries.reduce(
        (acc: number, cur: any) => acc + (Number(cur.quantity) || 1),
        0
      );

      return {
        id: d.id || d.order_id,
        title: `Draft Order • ${d.business_name || 'Wholesale Order'}`,
        itemsCount: entries.length,
        totalUnits: totalUnits || 1,
        estimatedTotal: d.total_amount || 0,
        updatedAt: d.updated_at || d.created_at || new Date().toISOString(),
        supplierName: d.business_name || 'Verified Supplier',
      };
    });
  }

  /**
   * Delete draft order
   */
  static async deleteDraftOrder(draftId: string): Promise<void> {
    await apiClient(API_ENDPOINTS.ORDERS.DRAFT_BY_ID(draftId), {
      method: 'DELETE',
    });
  }

  /**
   * Get sent orders placed by current user
   */
  static async getSentOrders(): Promise<{
    pending: WholesaleOrderItem[];
    sent: WholesaleOrderItem[];
    pdfs: PdfDocumentItem[];
  }> {
    const res = await apiClient<{ data: BackendOrderResponse[] }>(API_ENDPOINTS.ORDERS.LIST);
    const orders = res.data || [];

    const pending: WholesaleOrderItem[] = [];
    const sent: WholesaleOrderItem[] = [];
    const pdfs: PdfDocumentItem[] = [];

    orders.forEach((o) => {
      const statusLower = (o.status || 'pending').toLowerCase();
      let status: OrderStatusCode = 'pending';
      if (statusLower.includes('cancel')) status = 'cancelled';
      else if (statusLower.includes('dispatch') || statusLower.includes('ship')) status = 'dispatched';
      else if (statusLower.includes('complete')) status = 'completed';
      else if (statusLower.includes('process')) status = 'processing';

      const entries = Array.isArray(o.entries_json) ? o.entries_json : [];
      const totalUnits = entries.reduce(
        (acc: number, cur: any) => acc + (Number(cur.quantity) || 1),
        0
      );
      const firstEntry = entries[0] || {};
      const summaryText = firstEntry.name
        ? `${totalUnits}x ${firstEntry.name}${entries.length > 1 ? ` +${entries.length - 1} more` : ''}`
        : `Wholesale Batch #${o.order_id}`;

      const orderItem: WholesaleOrderItem = {
        id: o.id || o.order_id,
        orderNumber: o.order_id,
        date: o.created_at || new Date().toISOString(),
        supplierName: o.business_name || 'Direct Wholesale Supplier',
        status,
        totalUnits: totalUnits || 1,
        totalAmount: o.total_amount || 0,
        warehouseDestination: [o.business_address, o.business_city].filter(Boolean).join(', ') || 'Kampala Logistics Hub',
        pdfId: o.pdf_id || undefined,
        itemSummary: summaryText,
      };

      if (status === 'pending' || status === 'processing') {
        pending.push(orderItem);
      } else {
        sent.push(orderItem);
      }

      // If order has an official PDF attached or generated
      pdfs.push({
        id: o.order_id,
        title: `Commercial Spec & Invoice #${o.order_id}`,
        orderNumber: o.order_id,
        fileSize: '150 KB',
        updatedAt: o.updated_at || o.created_at || new Date().toISOString(),
        downloadUrl: API_ENDPOINTS.ORDERS.PDF(o.order_id),
      });
    });

    return { pending, sent, pdfs };
  }
}
