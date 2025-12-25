// frontend/src/lib/csrf.ts
/**
 * CSRF Token Management Module
 * 
 * Handles fetching and managing CSRF tokens for state-changing operations.
 * CSRF tokens prevent cross-site request forgery attacks by validating that
 * POST/PUT/DELETE requests originate from the same domain.
 */

let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

/**
 * Fetch a fresh CSRF token from the backend
 * Uses caching and promise deduplication to avoid multiple concurrent requests
 */
export async function fetchCsrfToken(): Promise<string> {
  // If we already have a cached token, return it
  if (cachedToken) {
    return cachedToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Initiate new fetch
  tokenFetchPromise = (async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data = await response.json() as { csrf_token: string };
      cachedToken = data.csrf_token;
      return cachedToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      // Clear the promise so next call will retry
      tokenFetchPromise = null;
      throw error;
    }
  })();

  return tokenFetchPromise;
}

/**
 * Invalidate the cached CSRF token
 * Call this after a failed request to force a fresh token fetch
 */
export function invalidateCsrfToken(): void {
  cachedToken = null;
  tokenFetchPromise = null;
}

/**
 * Get CSRF token with automatic refresh on 403 Forbidden
 * This wraps a fetch call to handle CSRF token expiration
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit & { method?: string }
): Promise<Response> {
  const method = options.method || 'GET';

  // Only GET requests don't need CSRF tokens
  if (method === 'GET') {
    return fetch(url, { ...options, credentials: 'include' });
  }

  // Get CSRF token for state-changing operations
  const token = await fetchCsrfToken();

  const headers = new Headers(options.headers);
  headers.set('X-CSRF-Token', token);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  // If we get a 403, the token might have expired, invalidate and retry once
  if (response.status === 403) {
    console.warn('CSRF token validation failed, attempting refresh...');
    invalidateCsrfToken();
    
    const newToken = await fetchCsrfToken();
    const newHeaders = new Headers(options.headers);
    newHeaders.set('X-CSRF-Token', newToken);
    if (!newHeaders.has('Content-Type')) {
      newHeaders.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: newHeaders,
    });
  }

  return response;
}

/**
 * Hook to load CSRF token in useEffect
 * Usage: useEffect(() => { loadCsrfToken(); }, []);
 */
export async function loadCsrfToken(): Promise<void> {
  try {
    await fetchCsrfToken();
  } catch (error) {
    console.error('Failed to preload CSRF token:', error);
    // Non-fatal, token will be fetched on first state-changing operation
  }
}
