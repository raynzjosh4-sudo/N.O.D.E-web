import { API_CONFIG } from './api_config';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Optional token getter provider for auth integration
let authTokenGetter: (() => Promise<string | null> | string | null) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null> | string | null) {
  authTokenGetter = getter;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, timeoutMs = API_CONFIG.TIMEOUT_MS, headers, ...customConfig } = options;

  let url = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  let resolvedToken = token;
  if (!resolvedToken && authTokenGetter) {
    resolvedToken = await authTokenGetter();
  }

  const mergedHeaders: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(headers as Record<string, string>),
  };

  // When submitting FormData (e.g. image uploads), let fetch set multipart boundary
  if (customConfig.body instanceof FormData) {
    delete mergedHeaders['Content-Type'];
  }

  if (resolvedToken) {
    mergedHeaders['Authorization'] = `Bearer ${resolvedToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        (typeof data === 'object' && data !== null && (data as any).error?.message) ||
        (typeof data === 'object' && data !== null && (data as any).message) ||
        (typeof data === 'object' && data !== null && (data as any).detail) ||
        `HTTP Error ${response.status}`;
      const errorCode = typeof data === 'object' && data !== null ? (data as any).error?.code : undefined;
      throw new ApiError(errorMsg, response.status, errorCode, data);
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your network connection.', 408, 'timeout');
    }
    throw new ApiError((err as Error)?.message || 'An unexpected network error occurred.', 0, 'network_error');
  }
}
