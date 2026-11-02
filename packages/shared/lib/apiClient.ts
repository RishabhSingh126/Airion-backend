import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error: string | null;
  statusCode?: number;
}

/**
 * Ease2event Shared API Client
 * Centralized instance for all portals with standard interceptors
 */
export class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL?: string) {
    let resolvedBaseURL = baseURL || (import.meta.env?.VITE_API_URL as string) || '/api';

    if (typeof window !== 'undefined') {
      // In browser environments (both local Vite dev server and production Vercel),
      // routing relative to '/api' uses the local Vite proxy or Vercel rewrites.
      // This guarantees zero CORS issues, no preflight delays, and consistent auth.
      if (!baseURL || resolvedBaseURL.includes('localhost') || resolvedBaseURL.includes('127.0.0.1')) {
        resolvedBaseURL = '/api';
      }
    }

    this.instance = axios.create({
      baseURL: resolvedBaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60s failsafe to accommodate cold-starts of remote serverless DBs
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Request Interceptor: Auth Token Injection & Multi-part Handling
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('ease2event_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // When sending FormData or multipart, delete Content-Type so Axios and the browser
        // can auto-generate the correct 'multipart/form-data; boundary=...' header
        if (config.headers) {
          const ct = (config.headers as any)['Content-Type'] || (config.headers as any)['content-type'];
          if (config.data instanceof FormData || ct === 'multipart/form-data') {
            delete (config.headers as any)['Content-Type'];
            delete (config.headers as any)['content-type'];
            if (typeof (config.headers as any).delete === 'function') {
              (config.headers as any).delete('Content-Type');
              (config.headers as any).delete('content-type');
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: Standardized Unwrapping & Error Handling
    this.instance.interceptors.response.use(
      (response) => {
        // Automatically unwrap NestJS standardization { success, data, error }
        if (response.data && response.data.success === true && response.data.data !== undefined) {
          return response.data.data;
        }
        return response.data;
      },
      (error: AxiosError<any>) => {
        const standardError: ApiResponse = {
          success: false,
          data: null,
          error: error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred',
          statusCode: error.response?.status
        };

        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
          localStorage.removeItem('ease2event_token');
          // Optional: Dispatch event or redirect if window is available
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
             // window.location.href = '/login'; // Let consumer handle if needed
          }
        }

        return Promise.reject(standardError);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }

  // Helper methods to simplify common operations
  public async get<T>(url: string, config?: any): Promise<T> {
    return this.instance.get<any, T>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.post<any, T>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.put<any, T>(url, data, config);
  }

  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.patch<any, T>(url, data, config);
  }

  public async delete<T>(url: string, config?: any): Promise<T> {
    return this.instance.delete<any, T>(url, config);
  }
}

// Global singleton instance
export const api = new ApiClient();
export default api;
