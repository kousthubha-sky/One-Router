export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  body?: any;
}

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  headers?: Record<string, string | null>;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export class HttpError extends Error implements ApiError {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class HttpClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: ApiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.onerouter.com';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  async request<T>(
    endpoint: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Key': this.apiKey,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json() as T;
      const duration = Date.now() - startTime;

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: {
          'x-request-id': response.headers.get('x-request-id'),
          'x-response-time': response.headers.get('x-response-time'),
          'x-duration': String(duration)
        }
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('JSON.parse')) {
        throw new HttpError('Invalid JSON response from server', 500);
      }

      // Handle timeout
      if (error.name === 'AbortError' || error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new HttpError(`Request timeout after ${this.timeout}ms`, 504);
      }

      // Handle other fetch errors
      throw new HttpError(
        error.message || 'Network request failed',
        error.status || 500
      );
    }
  }

  async get<T>(endpoint: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  async put<T>(endpoint: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT' });
  }

  async patch<T>(endpoint: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH' });
  }

  async delete<T>(endpoint: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export interface ApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}