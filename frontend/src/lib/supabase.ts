import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

// Custom fetch: strips abort signals (prevents Chrome extension interference)
// and retries on transient failures. This fixes reads and auth operations.
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    // Strip abort signal to prevent premature cancellation by extensions
    const { signal, ...restOptions } = options || {};

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fetch(url, restOptions);
        } catch (err: any) {
            if (attempt < maxRetries && (
                err.name === 'AbortError' ||
                err.name === 'TypeError' ||
                err.message?.includes('Failed to fetch') ||
                err.message?.includes('abort')
            )) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                continue;
            }
            throw err;
        }
    }
    return fetch(url, restOptions);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    global: {
        fetch: fetchWithRetry,
    },
});

// Resilient auth token getter — tries supabase client first, falls back to localStorage
function getAuthToken(): string {
    try {
        // Try reading from localStorage directly (synchronous, no network call)
        const projectRef = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || '';
        const storageKey = `sb-${projectRef}-auth-token`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            const token = parsed?.access_token || parsed?.currentSession?.access_token;
            if (token) return token;
        }
    } catch {
        // Ignore parse errors
    }
    return supabaseAnonKey;
}

// Direct REST helper — bypasses Supabase JS client's internal AbortController
// which causes AbortError on some browsers/extensions even when the request succeeds.
export async function supabaseRestInsert(
    table: string,
    data: Record<string, any>
): Promise<{ data: any; error: any }> {
    const token = getAuthToken();

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok) {
                return { data: null, error: json };
            }

            // PostgREST returns an array for inserts
            const row = Array.isArray(json) ? json[0] : json;
            return { data: row, error: null };
        } catch (err: any) {
            if (attempt < maxRetries && (
                err.name === 'AbortError' || err.name === 'TypeError' ||
                err.message?.includes('Failed to fetch') || err.message?.includes('abort')
            )) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                continue;
            }
            return { data: null, error: { message: err.message, code: '' } };
        }
    }
    return { data: null, error: { message: 'Max retries exceeded', code: '' } };
}

// Direct storage upload — bypasses Supabase JS client's internal AbortController
export async function supabaseStorageUpload(
    bucket: string,
    path: string,
    file: File
): Promise<{ error: any }> {
    const token = getAuthToken();

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': file.type || 'application/octet-stream',
                },
                body: file,
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({ message: `Upload failed: ${res.status}` }));
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                    continue;
                }
                return { error: json };
            }
            return { error: null };
        } catch (err: any) {
            if (attempt < maxRetries && (
                err.name === 'AbortError' || err.name === 'TypeError' ||
                err.message?.includes('Failed to fetch') || err.message?.includes('abort')
            )) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                continue;
            }
            return { error: { message: err.message } };
        }
    }
    return { error: { message: 'Max retries exceeded' } };
}

// Get public URL for a storage object (no network call needed)
export function supabaseStoragePublicUrl(bucket: string, path: string): string {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Direct REST SELECT — bypasses Supabase JS client's internal AbortController.
// Supports PostgREST query params: select, filters, order, limit.
export async function supabaseRestSelect(
    table: string,
    options?: {
        select?: string;      // e.g. '*, listing_images(*)'
        filters?: Record<string, string>;  // e.g. { status: 'eq.active' }
        order?: string;       // e.g. 'created_at.desc'
        limit?: number;
    }
): Promise<{ data: any[]; error: any }> {
    const token = getAuthToken();

    const params = new URLSearchParams();
    if (options?.select) params.set('select', options.select);
    if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
            params.set(key, value);
        }
    }
    if (options?.order) params.set('order', options.order);
    if (options?.limit) params.set('limit', String(options.limit));

    const url = `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                },
            });

            const json = await res.json();

            if (!res.ok) {
                return { data: [], error: json };
            }

            return { data: Array.isArray(json) ? json : [json], error: null };
        } catch (err: any) {
            if (attempt < maxRetries && (
                err.name === 'AbortError' || err.name === 'TypeError' ||
                err.message?.includes('Failed to fetch') || err.message?.includes('abort')
            )) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                continue;
            }
            return { data: [], error: { message: err.message, code: '' } };
        }
    }
    return { data: [], error: { message: 'Max retries exceeded', code: '' } };
}

// Direct REST single row fetch
export async function supabaseRestSelectSingle(
    table: string,
    options?: {
        select?: string;
        filters?: Record<string, string>;
    }
): Promise<{ data: any; error: any }> {
    const result = await supabaseRestSelect(table, { ...options, limit: 1 });
    if (result.error) return { data: null, error: result.error };
    return { data: result.data[0] || null, error: null };
}

// Direct REST DELETE — bypasses Supabase JS client's internal AbortController
export async function supabaseRestDelete(
    table: string,
    filters: Record<string, string>
): Promise<{ error: any }> {
    const token = getAuthToken();

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        params.set(key, value);
    }

    const url = `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;

    try {
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({ message: `Delete failed: ${res.status}` }));
            return { error: json };
        }
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
}
