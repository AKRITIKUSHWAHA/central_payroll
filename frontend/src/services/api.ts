const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[API] Server request failed for ${endpoint}:`, error);
    return null;
  }
};
