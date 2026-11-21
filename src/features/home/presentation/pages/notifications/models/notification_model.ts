export type NotificationCategory =
  | 'all'
  | 'orders'
  | 'inventory'
  | 'logistics'
  | 'security'
  | 'finance'
  | 'system'
  | 'reminders'
  | 'messages';

export interface PriceTierChange {
  minQuantity: number;
  oldPrice: number;
  newPrice: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string; // ISO string
  category: NotificationCategory;
  isUnread: boolean;
  imageUrl?: string;
  priceTierChanges?: PriceTierChange[];
}

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'finance', label: 'Finance' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'security', label: 'Security' },
  { id: 'system', label: 'System' },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [];
