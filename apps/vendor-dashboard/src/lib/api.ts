import { api } from '@ease2event/shared';

export { api };
export default api;

// AI & Chat
export const generateEasyReply = async (inquiry: string, voice?: string) =>
    await api.post('/ai/easy-reply', { inquiry, voice });

// Analytics & Performance
export const fetchVendorPerformance = async (vendorId: string, days: number = 7) => {
    try {
        return await api.get(`/analytics/vendor/${vendorId}/performance`, { params: { days } });
    } catch (error: any) {
        if (error?.response?.status === 403) return { data: [] };
        throw error;
    }
};

// Wallet & Financials
export const fetchWalletOverview = async () =>
    await api.get('/wallet/overview');

export const requestWithdrawal = async (amount: number, bankDetails?: any) =>
    await api.post('/wallet/withdraw', { amount, bankDetails });

export const updateWalletTarget = async (target: number) =>
    await api.post('/wallet/target', { target });

// Availability & Calendar
export const fetchVendorSchedule = async (vendorId: string) =>
    await api.get(`/availability/vendor/${vendorId}`);

export const blockDate = async (date: string, reason?: string) =>
    await api.post('/availability/block', { date, reason });

export const unblockDate = async (date: string) =>
    await api.delete(`/availability/block/${date}`);

// Profile & Public
export const updateProfile = async (data: any) =>
    await api.patch('/auth/profile', data);

export const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    
    try {
        return await api.post<any>('/uploads/image', fd);
    } catch (err: any) {
        // If multipart failed through reverse proxy/CDN, fallback to base64
        if (file.size < 10 * 1024 * 1024) {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            return await api.post<any>('/uploads/image', { file: base64 });
        }
        throw err;
    }
};

// Reviews
export const fetchVendorReviews = async (vendorId: string) =>
    await api.get(`/reviews/vendor/${vendorId}`);

export const replyToReview = async (reviewId: string, vendorId: string, replyText: string) =>
    await api.patch(`/reviews/${reviewId}/reply`, { vendorId, replyText });

