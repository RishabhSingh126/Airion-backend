/**
 * Shared Authentication Utilities
 * Used across all frontend portals (vendor, admin, user)
 */

import { UserRole, TokenPayload } from './types';
import { JWT_CONFIG, OTP_CONFIG } from './constants';

/**
 * Decode JWT token without verification (client-side only)
 */
export const decodeToken = (token: string): TokenPayload | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
};

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
    return localStorage.getItem(JWT_CONFIG.TOKEN_KEY);
};

/**
 * Set token in localStorage
 */
export const setToken = (token: string): void => {
    localStorage.setItem(JWT_CONFIG.TOKEN_KEY, token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = (): void => {
    localStorage.removeItem(JWT_CONFIG.TOKEN_KEY);
    localStorage.removeItem(JWT_CONFIG.REFRESH_TOKEN_KEY);
};

/**
 * Check if user has a specific role
 */
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
    return userRole === requiredRole;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (userRole: UserRole, roles: UserRole[]): boolean => {
    return roles.includes(userRole);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if it's a valid Indian phone number (10 digits)
    return /^[6-9]\d{9}$/.test(cleanPhone);
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
        return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    }
    return phone;
};

/**
 * Validate password strength with enhanced security requirements
 */
export const validatePassword = (password: string): { valid: boolean; message: string; strength: 'weak' | 'medium' | 'strong' } => {
    const errors: string[] = [];

    // Minimum 12 characters (enhanced from 6)
    if (password.length < 12) {
        errors.push('at least 12 characters');
    }

    // Require uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push('one uppercase letter');
    }

    // Require lowercase
    if (!/[a-z]/.test(password)) {
        errors.push('one lowercase letter');
    }

    // Require number
    if (!/\d/.test(password)) {
        errors.push('one number');
    }

    // Require special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('one special character (!@#$%^&*)');
    }

    // Check against common passwords
    const commonPasswords = ['password123456', 'admin1234567', '123456789012', 'qwerty123456'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        errors.push('not be a common password');
    }

    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (errors.length === 0) {
        let score = 0;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (password.length >= 20) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        if (score <= 3) strength = 'weak';
        else if (score <= 5) strength = 'medium';
        else strength = 'strong';
    }

    if (errors.length > 0) {
        return {
            valid: false,
            message: `Password must contain ${errors.join(', ')}`,
            strength: 'weak'
        };
    }

    return {
        valid: true,
        message: `Password strength: ${strength}`,
        strength
    };
};

/**
 * Validate OTP format
 */
export const isValidOTP = (otp: string): boolean => {
    const cleanOTP = otp.replace(/\D/g, '');
    return cleanOTP.length === OTP_CONFIG.LENGTH && /^\d+$/.test(cleanOTP);
};

/**
 * Generate a random OTP (for development/testing only)
 * NEVER use this in production - OTP should be generated server-side
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format time remaining for OTP expiry
 */
export const formatOTPExpiry = (expiryTime: Date): string => {
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Get user initials from name
 */
export const getUserInitials = (name?: string): string => {
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired(token);
};

/**
 * Get current user role from token
 */
export const getCurrentUserRole = (): UserRole | null => {
    const token = getToken();
    if (!token) return null;

    const payload = decodeToken(token);
    return payload?.role || null;
};

/**
 * Environment helpers for multi-portal redirection
 */
export const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.')
);

export const getPortalUrl = (role: 'user' | 'vendor' | 'admin'): string => {
    if (typeof window === 'undefined') return '/';

    const env = (import.meta as any).env || {};
    
    if (role === 'vendor') {
        const vendorUrl = env.VITE_VENDOR_URL;
        if (vendorUrl) return vendorUrl;
        return isLocal 
            ? `http://${window.location.hostname}:5174/` 
            : `${window.location.origin}/vendor`;
    }
    
    if (role === 'admin' || (role as string) === 'super_admin') {
        const adminUrl = env.VITE_ADMIN_URL;
        if (adminUrl) return adminUrl;
        return isLocal 
            ? `http://${window.location.hostname}:5175/` 
            : `${window.location.origin}/admin`;
    }
    
    if (role === 'user') {
        const userUrl = env.VITE_USER_URL;
        if (userUrl) return userUrl;
        return isLocal 
            ? `http://${window.location.hostname}:5173/dashboard` 
            : `${window.location.origin}/dashboard`;
    }
    
    return '/';
};

