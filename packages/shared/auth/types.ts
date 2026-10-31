/**
 * Shared Authentication Types
 * Used across all frontend portals (vendor, admin, user)
 */

export enum UserRole {
    USER = 'user',
    VENDOR = 'vendor',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface User {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    avatar?: string;
    location?: string;
    language?: string;
    phoneNumber?: string;
    vendor?: { id: string; [key: string]: any };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AuthResponse {
    access_token?: string;
    refresh_token?: string;
    user?: User;
    expiresIn?: number;
    require2fa?: boolean;
    tempToken?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    twoFactorCode?: string;
}

export interface SignupData {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role: UserRole;
}

export interface OTPRequest {
    phone?: string;
    email?: string;
    role?: UserRole;
}

export interface OTPVerification {
    phone?: string;
    email?: string;
    otp: string;
    name?: string;
    role?: UserRole;
}

export interface TokenPayload {
    sub: string; // user id
    email: string;
    role: UserRole;
    iat: number; // issued at
    exp: number; // expiration
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    backendAvailable: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithToken: (token: string) => Promise<void>;
    loginWithResponse: (response: AuthResponse) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}
