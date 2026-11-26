import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_DRAFTS_KEY = '@node_guest_bulk_drafts';

export interface GuestDraftOrder {
  id: string;
  order_id: string;
  title: string;
  name?: string;
  supplier_id?: string;
  business_name?: string;
  business_phone?: string;
  business_city?: string;
  business_address?: string;
  total_amount: number;
  status: string;
  created_at: string;
  entries: any[];
  entries_json: any[];
}

export async function getGuestDrafts(): Promise<GuestDraftOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read guest drafts:', e);
    return [];
  }
}

export async function saveGuestDraft(draft: Partial<GuestDraftOrder> & { title: string; entries_json: any[] }): Promise<GuestDraftOrder> {
  const existing = await getGuestDrafts();
  const draftId = draft.order_id || draft.id || `GUEST-${Date.now().toString(36).toUpperCase()}`;

  const completeDraft: GuestDraftOrder = {
    id: draftId,
    order_id: draftId,
    title: draft.title,
    name: draft.title,
    supplier_id: draft.supplier_id || '',
    business_name: draft.business_name || 'Guest Wholesale Merchant',
    business_phone: draft.business_phone || 'Guest Inquiry',
    business_city: draft.business_city || 'Kampala',
    business_address: draft.business_address || 'Kampala Wholesale Hub',
    total_amount: draft.total_amount || 0,
    status: 'draft',
    created_at: draft.created_at || new Date().toISOString(),
    entries: draft.entries_json,
    entries_json: draft.entries_json,
  };

  const filtered = existing.filter((d) => d.id !== draftId && d.order_id !== draftId);
  filtered.unshift(completeDraft);
  await AsyncStorage.setItem(GUEST_DRAFTS_KEY, JSON.stringify(filtered.slice(0, 50)));
  return completeDraft;
}

export async function deleteGuestDraft(draftId: string): Promise<void> {
  const existing = await getGuestDrafts();
  const filtered = existing.filter((d) => d.id !== draftId && d.order_id !== draftId);
  await AsyncStorage.setItem(GUEST_DRAFTS_KEY, JSON.stringify(filtered));
}
