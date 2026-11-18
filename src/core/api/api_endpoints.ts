export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGN_IN: '/auth/email/sign-in',
    SIGN_UP: '/auth/email/sign-up',
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
    UPDATE_USER: '/profile/user',
    UPDATE_BUSINESS: '/profile/business',
    APPLY_SUPPLIER: '/profile/supplier-apply',
  },
  // Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    SUPPLIER_ORDERS: '/orders/supplier',
    BUYER_SUMMARY: '/orders/buyer/summary',
    SUPPLIER_SUMMARY: '/orders/supplier/summary',
  },
  // Saved Items
  SAVED: {
    LIST: '/saved',
    ADD: '/saved',
    REMOVE: (productId: string) => `/saved/${productId}`,
    CHECK: (productId: string) => `/saved/check/${productId}`,
  },
  // Admin
  ADMIN: {
    CREATE_CATEGORY: '/admin/categories',
  },
} as const;
