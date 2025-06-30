export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface FetchOptions extends RequestInit {
  method?: RequestMethod;
  data?: any;
  query?: Record<string, any>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown | null,
  ) {
    super(`API Error: ${status} ${statusText}`);
  }

  get isClient(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServer(): boolean {
    return this.status >= 500;
  }
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const {
    data: payload,
    method = 'GET',
    query,
    ...customOptions
  } = options;

  // Build URL
  const url = new URL(endpoint, API_URL);
  if (query && method === 'GET') {
    Object.entries(query).forEach(([key, value]) =>
      url.searchParams.append(key, String(value)),
    );
  }

  // Set headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customOptions.headers,
  };

  // Set fetch options
  const fetchOptions: RequestInit = {
    ...customOptions,
    method,
    headers,
    credentials: 'include',
  };

  // Set body
  if (payload && method !== 'GET') {
    fetchOptions.body = JSON.stringify(payload);
  }

  let data: T | null = null;
  let error: ApiError | null = null;

  try {
    const response = await fetch(url.toString(), fetchOptions);

    let body: unknown | null = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      error = new ApiError(response.status, response.statusText, body);
    } else {
      data = body as T;
    }
  } catch (networkErr: any) {
    // Fetch itself failed (timeout, DNS, CORS, etc.)
    error = new ApiError(-1, networkErr?.message ?? 'Network Error', null);
  }

  return { data, error };
}

export const api = {
  get: <T>(
    endpoint: string,
    query?: Record<string, any>,
    options?: Omit<FetchOptions, 'method' | 'query'>,
  ) => apiRequest<T>(endpoint, { ...options, query, method: 'GET' }),

  post: <T>(
    endpoint: string,
    data?: any,
    options?: Omit<FetchOptions, 'method' | 'data'>,
  ) => apiRequest<T>(endpoint, { ...options, data, method: 'POST' }),

  put: <T>(
    endpoint: string,
    data?: any,
    options?: Omit<FetchOptions, 'method' | 'data'>,
  ) => apiRequest<T>(endpoint, { ...options, data, method: 'PUT' }),

  delete: <T>(
    endpoint: string,
    options?: Omit<FetchOptions, 'method'>,
  ) => apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
