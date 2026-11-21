import { apiClient } from '@/core/api/api_client';
import { API_ENDPOINTS } from '@/core/api/api_endpoints';
import { NotificationItem, NotificationCategory } from '../models/notification_model';

export class NotificationApiService {
  /**
   * Fetch paginated notifications with optional category filter
   */
  static async getNotifications(params: {
    limit?: number;
    offset?: number;
    category?: NotificationCategory;
  } = {}): Promise<{
    items: NotificationItem[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams: Record<string, any> = {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
    };
    if (params.category && params.category !== 'all') {
      queryParams.category = params.category;
    }

    const res = await apiClient<any>(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      params: queryParams,
    });

    const rows = res.data || (Array.isArray(res) ? res : []);
    const items: NotificationItem[] = rows.map((row: any) => ({
      id: String(row.id),
      title: row.title || 'Notification',
      description: row.message || row.description || '',
      time: row.created_at || new Date().toISOString(),
      category: (row.category || 'system').toLowerCase() as NotificationCategory,
      isUnread: row.is_read !== undefined ? !row.is_read : true,
      imageUrl: row.image_url,
      priceTierChanges: row.price_tier_changes || row.metadata?.price_tier_changes,
    }));

    return {
      items,
      total: res.total ?? items.length,
      hasMore: res.has_more ?? false,
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    await apiClient(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
      method: 'PATCH',
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    await apiClient(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
      method: 'PATCH',
    });
  }

  /**
   * Delete notification by ID
   */
  static async deleteNotification(id: string): Promise<void> {
    await apiClient(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
      method: 'DELETE',
    });
  }
}
