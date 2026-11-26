export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGN_IN: '/auth/email/sign-in',
    SIGN_UP: '/auth/email/sign-up',
    GOOGLE: '/auth/google',
    OTP_VERIFY: '/auth/email/otp/verify',
    OTP_RESEND: '/auth/email/otp/resend',
    PASSWORD_RESET: '/auth/email/password-reset',
    PASSWORD_UPDATE: '/auth/email/password',
    ME: '/auth/me',
  },
  // Products
  PRODUCTS: {
    LIST: '/products',
    POPULAR: '/products/popular',
    CATEGORIES: '/products/categories',
    CATEGORIES_WITH_IMAGE: '/products/categories/with-image',
    CATEGORY_IMAGE: (id: string) => `/products/categories/${id}/image`,
    CREATE_CATEGORY: '/products/categories',
    SUPPLIERS: '/products/suppliers',
    DETAIL: (id: string) => `/products/${id}`,
    BY_SLUG: (slug: string) => `/products/slug/${slug}`,
    MY_PRODUCTS: '/products/my-products',
    UPLOAD_IMAGE: '/products/upload-image',
    UPLOAD_PRODUCT_IMAGE: (id: string) => `/products/${id}/image`,
  },
  // Profile
  PROFILE: {
    ME: '/profile',
    UPDATE: '/profile',
    UPDATE_BUSINESS: '/profile/business',
    APPLY_SUPPLIER: '/profile/apply-supplier',
    TRADING_TERMS: '/profile/trading-terms',
  },
  // Orders
  ORDERS: {
    LIST: '/orders/',
    CREATE: '/orders/',
    DETAIL: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    PDF: (orderId: string) => `/orders/${orderId}/pdf`,
    PDF_PREVIEW: '/orders/pdf/preview',
    DRAFTS: '/orders/drafts',
    DRAFT_BY_ID: (id: string) => `/orders/drafts/${id}`,
    SUPPLIER_INCOMING: '/orders/supplier/incoming',
  },
  // Saved Items
  SAVED: {
    LIST: '/saved-items',
    ADD: '/saved-items',
    REMOVE: (savedItemId: string) => `/saved-items/${savedItemId}`,
    CHECK: (productId: string) => `/saved-items/${productId}/check`,
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
    DEVICE_TOKEN: '/notifications/device-token',
  },
  // Admin
  ADMIN: {
    CREATE_CATEGORY: '/admin/categories',
  },
} as const;
