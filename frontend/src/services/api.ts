const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://central-payroll-backend-production.up.railway.app/api';

export const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    
    const token = localStorage.getItem('cdl_token');
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || errData.message || `HTTP ${res.status}` } as unknown as T;
    }
    return await res.json();
  } catch (error: any) {
    console.warn(`[API] Server request failed for ${endpoint}:`, error);
    const errorMessage = error?.name === 'AbortError' 
      ? 'Request timed out. Please try again.' 
      : (error?.message || 'Server connection failed');
    return { success: false, error: errorMessage } as unknown as T;
  }
};
