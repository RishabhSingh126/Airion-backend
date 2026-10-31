/// <reference path="./env.d.ts" />

/**
 * Shared Authentication API
 * Centralized API calls for authentication across all portals
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
    AuthResponse,
    LoginCredentials,
    SignupData,
    OTPRequest,
    OTPVerification,
    User,
    ApiError
} from './types';
import { AUTH_ENDPOINTS, AUTH_ERRORS } from './constants';
import { tokenService } from './tokenService';
import { isTokenExpired } from './utils';

/**
 * Create axios instance with base configuration
 */
export const createAuthApi = (baseURL?: string): AxiosInstance => {
    let resolvedBaseURL = baseURL || import.meta.env.VITE_API_URL || '/api';

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            if (resolvedBaseURL.includes('localhost') || resolvedBaseURL.includes('127.0.0.1')) {
                resolvedBaseURL = '/api';
            }
        }
    }

    const api = axios.create({
        baseURL: resolvedBaseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - Add auth token
    api.interceptors.request.use(
        (config) => {
            const token = tokenService.getAccessToken();
            if (token && !isTokenExpired(token)) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (import.meta.env.DEV) {
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - Handle errors and token refresh
    api.interceptors.response.use(
        (response) => {
            // Automatically unwrap NestJS standardization { success, data, message }
            if (response.data && response.data.success === true && response.data.data !== undefined) {
                return { ...response, data: response.data.data };
            }
            return response;
        },
        async (error: AxiosError<ApiError>) => {

            const originalRequest = error.config as any;

            // Handle 401 Unauthorized
            if (error.response?.status === 401) {
                // Prevent infinite loop
                if (originalRequest._retry || originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH_TOKEN)) {
                    tokenService.clearTokens();
                    // Let the consumer handle redirects
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                // Try to refresh token
                try {
                    const refreshToken = tokenService.getRefreshToken();
                    if (refreshToken) {
                        const response = await api.post<AuthResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
                            refresh_token: refreshToken
                        });

                        if (response.data.access_token) {
                            tokenService.setAccessToken(response.data.access_token);
                            
                            // Retry original request
                            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                            return api(originalRequest);
                        }
                    }
                } catch (refreshError) {
                    tokenService.clearTokens();
                    return Promise.reject(refreshError);
                }
            }

            // Handle other errors
            if (import.meta.env.DEV) {
                const apiMsg = error.response?.data?.message || error.response?.data || error.message;
                console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, apiMsg);
            }

            return Promise.reject(error);
        }
    );

    return api;
};

// Default API instance
export const authApi = createAuthApi();

/**
 * User Authentication APIs
 */
export const userAuth = {
    /**
     * User login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.USER_LOGIN, credentials);
        return response.data;
    },

    /**
     * User signup
     */
    signup: async (data: SignupData): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.USER_SIGNUP, data);
        return response.data;
    },
};

/**
 * User Dashboard APIs
 */
export const userDashboard = {
    /**
     * Get user dashboard overview data
     */
    getOverview: async (): Promise<any> => {
        try {
            const response = await authApi.get(AUTH_ENDPOINTS.USER_DASHBOARD_OVERVIEW);
            const data = response.data?.data || response.data;
            if (data) {
                return data;
            }
            return {
                stats: { upcomingEvents: 0, budgetSpent: 0, pendingTasks: 0 },
                recentBookings: [],
                trendingVendors: [],
                deals: []
            };
        } catch (err) {
            console.error('[userDashboard] Failed to fetch live overview:', err);
            return {
                stats: { upcomingEvents: 0, budgetSpent: 0, pendingTasks: 0 },
                recentBookings: [],
                trendingVendors: [],
                deals: []
            };
        }
    },
};

/**
 * OTP-based Authentication APIs (Common for Users & Vendors)
 */
export const otpAuth = {
    /**
     * Send OTP for login
     */
    sendLoginOTP: async (request: OTPRequest): Promise<{ message: string; otp?: string; devOtp?: string; data?: any }> => {
        const response = await authApi.post(AUTH_ENDPOINTS.VENDOR_SEND_OTP, request);
        return response.data;
    },

    /**
     * Verify OTP for login
     */
    verifyLoginOTP: async (verification: OTPVerification): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.VENDOR_VERIFY_OTP, verification);
        return response.data;
    },

    /**
     * Send OTP for signup
     */
    sendSignupOTP: async (request: OTPRequest): Promise<{ message: string; otp?: string; devOtp?: string; data?: any }> => {
        const response = await authApi.post(AUTH_ENDPOINTS.VENDOR_SIGNUP_SEND_OTP, request);
        return response.data;
    },

    /**
     * Verify OTP and complete signup
     */
    verifySignupOTP: async (verification: OTPVerification): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.VENDOR_SIGNUP_VERIFY_OTP, verification);
        return response.data;
    },

    /**
     * Verify Firebase phone token on backend
     */
    verifyFirebaseToken: async (idToken: string, role: string): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.FIREBASE_VERIFY_TOKEN, { idToken, role });
        return response.data;
    },
};

/**
 * Admin Authentication APIs
 */
export const adminAuth = {
    /**
     * Admin login with email, password, and optional 2FA
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.ADMIN_LOGIN, credentials);
        return response.data;
    },

    /**
     * Create new admin account (restricted)
     */
    signup: async (data: SignupData): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.ADMIN_SIGNUP, data);
        return response.data;
    },

    /**
     * Send OTP to admin email
     */
    sendOtp: async (email: string): Promise<{ message: string; _dev_otp?: string }> => {
        const response = await authApi.post(AUTH_ENDPOINTS.ADMIN_SEND_OTP, { email });
        return response.data;
    },

    /**
     * Verify OTP and get access token
     */
    verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.ADMIN_VERIFY_OTP, { email, otp });
        return response.data;
    },
};

/**
 * Common Authentication APIs
 */
export const commonAuth = {
    /**
     * Check current authentication status
     */
    checkAuth: async (): Promise<User> => {
        const response = await authApi.get<User>(AUTH_ENDPOINTS.CHECK_AUTH);
        return response.data;
    },

    /**
     * Common login with email and password
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.USER_LOGIN, { email, password });
        return response.data;
    },

    /**
     * Logout current user
     */
    logout: async (): Promise<void> => {
        try {
            await authApi.post(AUTH_ENDPOINTS.LOGOUT);
        } finally {
            tokenService.clearTokens();
        }
    },

    /**
     * Check backend health
     */
    healthCheck: async (): Promise<boolean> => {
        try {
            await authApi.get(AUTH_ENDPOINTS.HEALTH_CHECK);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await authApi.post<AuthResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
            refresh_token: refreshToken
        });
        return response.data;
    },
};

/**
 * Social Authentication APIs
 */
export const socialAuth = {
    /**
     * Initiate Google OAuth flow
     */
    googleLogin: (): void => {
        window.location.href = `${authApi.defaults.baseURL}${AUTH_ENDPOINTS.GOOGLE_AUTH}`;
    },

    /**
     * Initiate GitHub OAuth flow
     */
    githubLogin: (): void => {
        window.location.href = `${authApi.defaults.baseURL}${AUTH_ENDPOINTS.GITHUB_AUTH}`;
    },
};

/**
 * Error handler utility
 */
export const handleAuthError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;
        return apiError?.message || AUTH_ERRORS.SERVER_ERROR;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return AUTH_ERRORS.NETWORK_ERROR;
};

/**
 * Generic API Hooks for external usage (e.g. React Query)
 */
export const fetcher = async (url: string, params?: Record<string, any>) => {
    const response = await authApi.get(url, { params });
    return response.data;
};

export const poster = async (url: string, data?: Record<string, any>) => {
    const response = await authApi.post(url, data);
    return response.data;
};

/**
 * Vendor Analytics APIs
 */
export const vendorAnalyticsApi = {
    /**
     * Record a profile view for a vendor
     */
    recordProfileView: async (vendorId: string, guestVisitorId?: string): Promise<{ success: boolean; counted: boolean }> => {
        const response = await authApi.post(`/vendors/${vendorId}/profile-view`, { guestVisitorId });
        return response.data;
    },

    /**
     * Get profile view analytics for the currently authenticated vendor
     */
    getMyProfileViews: async (): Promise<{
        totalUniqueViews: number;
        todayUniqueViews: number;
        weekUniqueViews: number;
        monthUniqueViews: number;
    }> => {
        const response = await authApi.get('/vendors/me/profile-views');
        return response.data;
    },
};
