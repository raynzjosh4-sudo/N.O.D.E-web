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

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Bulk Price Drop: Logitech MX Master 3S',
    description: 'Tier-1 Supplier Apex Wholesale updated bulk pricing for 5+ and 20+ units.',
    time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    category: 'inventory',
    isUnread: true,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=80',
    priceTierChanges: [
      { minQuantity: 5, oldPrice: 380000, newPrice: 360000 },
      { minQuantity: 20, oldPrice: 350000, newPrice: 330000 },
    ],
  },
  {
    id: 'notif-2',
    title: 'Order Dispatched • ND-88204',
    description: 'Your pallet delivery of 50 units (Sony WH-1000XM5) is in transit to Bugolobi Hub.',
    time: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 1 hour ago
    category: 'logistics',
    isUnread: true,
  },
  {
    id: 'notif-3',
    title: 'Wholesale Invoice Approved',
    description: 'Payment of UGX 14,500,000 for Order #ORD-9912 verified via Stanbic Escrow.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    category: 'finance',
    isUnread: true,
  },
  {
    id: 'notif-4',
    title: 'Low Stock Alert: Apple iPad Air M2',
    description: 'Only 14 units remaining at Kampala Central Warehouse. Re-order recommended.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    category: 'inventory',
    isUnread: false,
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'notif-5',
    title: 'Reminder: Scheduled Delivery Tomorrow',
    description: 'Pallet drop-off scheduled for 10:00 AM at Industrial Area Section 4.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22 hours ago
    category: 'reminders',
    isUnread: false,
  },
  {
    id: 'notif-6',
    title: 'New Wholesale Supplier Added',
    description: 'Prime Import Hub is now a verified Gold Supplier with 120+ active product listings.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    category: 'system',
    isUnread: false,
  },
  {
    id: 'notif-7',
    title: 'Security Notice: New Session',
    description: 'Signed in from Chrome on Windows (IP 197.239.12.8 - Kampala, Uganda).',
    time: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
    category: 'security',
    isUnread: false,
  },
];
