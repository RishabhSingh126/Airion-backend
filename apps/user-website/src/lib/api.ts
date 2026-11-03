import type { Event } from '../types';
import axios from 'axios';

const mapServiceToEvent = (service: any): Event => {
    return {
        id: service.id,
        vendorId: service.vendorId,
        title: service.title,
        category: service.category?.name || 'Uncategorized',
        image: service.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
        images: service.images || [],
        rating: service.vendor?.rating || 4.5,
        location: service.availableLocations?.[0] || 'India',
        reviews: service.vendor?.totalReviews || 0,
        price: `${service.currency || 'INR'} ${parseFloat(service.basePrice).toLocaleString()}`,
        capacity: 'Contact Vendor',
        description: service.description || '',
        vendorName: service.vendor?.businessName || 'Ease2Event Partner',
        vendorImage: service.vendor?.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200',
        packages: service.packages && service.packages.length
            ? service.packages.map((pkg: any) => ({
                title: pkg.name || pkg.title || '',
                price: typeof pkg.price === 'number'
                    ? `₹${pkg.price.toLocaleString()}`
                    : (pkg.price ? (String(pkg.price).startsWith('₹') ? pkg.price : `₹${pkg.price}`) : 'Contact Vendor'),
                desc: pkg.description || pkg.desc || '',
                features: pkg.features || [],
            }))
            : undefined,
        isSponsored: !!(service.isSponsored || service.vendor?.isSponsored),
        isFeatured: !!(service.isFeatured || service.vendor?.isFeatured),
    };
};

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Auth Interceptor: Inject token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ease2event_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug logging for easier troubleshooting
    if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle 401 Unauthorized & Unwrap Success Wraps
api.interceptors.response.use(
    (response) => {
        // If the backend wrapped the result in { success: true, data: ... }, unwrap it for the callers
        if (response.data && response.data.success === true && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('ease2event_token');
        }
        return Promise.reject(error);
    }
);

export default api;

export const fetchEvents = async (filters: Record<string, any> = {}): Promise<Event[]> => {
    try {
        const params = new URLSearchParams();
        if (filters.category && filters.category.toLowerCase() !== 'all') {
            params.append('category', filters.category);
        }
        if (filters.location && filters.location.toLowerCase() !== 'all') {
            params.append('location', filters.location);
        }
        if (filters.search) {
            params.append('search', filters.search);
        }
        if (filters.priceMin) {
            params.append('priceMin', String(filters.priceMin));
        }
        if (filters.priceMax) {
            params.append('priceMax', String(filters.priceMax));
        }
        if (filters.rating) {
            params.append('rating', String(filters.rating));
        }
        const query = params.toString();
        const url = `/services${query ? `?${query}` : ''}`;

        const response: any = await api.get(url).catch(() => []);
        const data = Array.isArray(response) ? response : (response?.data || []);
        if (Array.isArray(data)) {
            return data.map(mapServiceToEvent);
        }
        return [];
    } catch (err) {
        console.error('Failed to fetch real vendor services:', err);
        return [];
    }
};

export const fetchVendorDiscovery = async (filters: Record<string, any> = {}): Promise<Event[]> => {
    try {
        const params = new URLSearchParams();
        if (filters.city) params.append('city', filters.city);
        if (filters.search) params.append('search', filters.search);
        if (filters.categoryId) params.append('categoryId', filters.categoryId);

        const query = params.toString();
        const url = `/vendors/discovery${query ? `?${query}` : ''}`;

        const response: any = await api.get(url).catch(() => ({ vendors: [] }));
        const data = response?.vendors || response?.data?.vendors || (Array.isArray(response) ? response : []);

        if (Array.isArray(data)) {
            return data.map((v: any) => ({
                id: v.id,
                vendorId: v.id,
                title: v.businessName || 'Unnamed Vendor',
                category: v.category?.name || v.category || 'Uncategorized',
                image: v.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
                images: v.portfolioImages || [],
                rating: v.rating || 4.5,
                location: v.businessAddress?.city || 'India',
                reviews: v.totalReviews || 0,
                price: 'Contact for Pricing',
                capacity: 'Contact Vendor',
                description: v.bio || '',
                vendorName: v.businessName || 'Unnamed Vendor',
                vendorImage: v.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200',
                isSponsored: !!v.isSponsored,
                isFeatured: !!v.isFeatured
            }));
        }

        return [];
    } catch (err) {
        console.error('Failed to fetch vendor discovery:', err);
        return [];
    }
};

export const fetchEventById = async (id: string): Promise<Event | undefined> => {
    try {
        const res: any = await api.get(`/services/${id}`);
        const service = res?.data || res;
        if (service && service.id) {
            return mapServiceToEvent(service);
        }
        return undefined;
    } catch (err) {
        console.error('Failed to fetch service by id:', err);
        return undefined;
    }
};

export interface CreateBookingResponse {
    success: boolean;
    booking: {
        id: string;
        vendorId?: string;
        userId?: string;
        totalAmount?: number;
        status?: string;
        [key: string]: any;
    };
    message?: string;
}

export const createBooking = async (data: any): Promise<CreateBookingResponse> => {
    const res: any = await api.post('/bookings', data);
    return res;
};

export const fetchMyBookings = async () => {
    const res = await api.get('/bookings/mine');
    return Array.isArray(res) ? res : [];
};

export const createPaymentOrder = async (amount: number, bookingId: string): Promise<any> => {
    return (await api.post('/payments/create-order', { amount, bookingId })) as any;
};
export const verifyPayment = async (data: any, bookingId?: string): Promise<any> => {
    return (await api.post('/payments/verify', { ...data, bookingId })) as any;
};
export const toggleWishlist = async (vId: string) => await api.post(`/wishlists/toggle/${vId}`);
export const fetchMyWishlist = async () => await api.get('/wishlists/mine');
export const checkIsWishlisted = async (vId: string) => (await api.get(`/wishlists/check/${vId}`)) as any;
export const submitReview = async (data: { bookingId: string, rating: number, reviewText?: string }) => await api.post('/reviews', data);
export const fetchBudget = async () => await api.get('/budget');
export const updateBudget = async (d: any) => await api.patch('/budget/update', d);
export const fetchGuests = async () => await api.get('/guests');
export const createGuest = async (d: any) => await api.post('/guests', d);
export const updateGuest = async (id: string, d: any) => await api.patch(`/guests/${id}`, d);
export const deleteGuest = async (id: string) => await api.delete(`/guests/${id}`);
export const fetchConversations = async () => (await api.get('/chat/conversations')) as any[];
export const fetchMessages = async (id: string) => (await api.get(`/chat/messages/${id}`)) as any[];
export const startConversation = async (vId: string) => await api.post('/chat/start', { participantId: vId });
export const updateProfile = async (d: any) => await api.patch('/auth/profile', d);
export const changePassword = async (d: any) => await api.post('/auth/change-password', d);
export const updateVendorProfile = async (d: any) => await api.put('/vendors/me', d);
// --- VENDOR DASHBOARD & ANALYTICS (Step 6 Coordination) ---
export const fetchWalletOverview = async () => await api.get('/wallet/overview');
export const requestWithdrawal = async (amount: number, bankDetails?: any) => await api.post('/wallet/withdraw', { amount, bankDetails });
export const fetchVendorPerformance = async (vId: string, days: number = 7) => await api.get(`/analytics/vendor/${vId}/performance`, { params: { days } });
export const fetchVendorPerformanceDirect = async (vId: string, days: number = 7) => (await api.get(`/analytics/vendor/${vId}/performance`, { params: { days } }));
export const fetchVendorSchedule = async (vId: string) => await api.get(`/availability/vendor/${vId}`);
export const blockDate = async (date: string, reason?: string) => await api.post('/availability/block', { date, reason });
export const unblockDate = async (date: string) => await api.delete(`/availability/block/${date}`);
export const generateEasyReply = async (inquiry: string, voice?: string) => await api.post('/ai/easy-reply', { inquiry, voice });
export const checkAvailability = async (vId: string, date: string) => (await api.get('/availability/check', { params: { vendorId: vId, date } })) as any;
export const recordVendorProfileView = async (vId: string, guestVisitorId?: string) => await api.post(`/vendors/${vId}/profile-view`, { guestVisitorId });

export const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    try {
        return (await api.post('/uploads/image', fd)) as any;
    } catch (err: any) {
        if (file.size < 10 * 1024 * 1024) {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            return (await api.post('/uploads/image', { file: base64 })) as any;
        }
        throw err;
    }
};

export const askSupportAI = async (message: string) => {
    return (await api.post('/ai/support', { message })) as any;
};

// --- Merchandise / Event Store API Endpoints ---
export const fetchProducts = async () => {
    const res: any = await api.get('/merchandise');
    return res?.data ?? res;
};
export const fetchProductById = async (id: string) => {
    const res: any = await api.get(`/merchandise/${id}`);
    return res?.data ?? res;
};
export const checkoutMerchandise = async (orderData: any) => await api.post('/merchandise/checkout', orderData);
export const toggleProductWishlist = async (id: string): Promise<{ wishlisted: boolean }> => {
    const res: any = await api.post(`/merchandise/${id}/wishlist`);
    return res?.data ?? res;
};
export const fetchProductWishlist = async (): Promise<any[]> => {
    const res: any = await api.get('/merchandise/wishlist/mine');
    return res?.data ?? res;
};

