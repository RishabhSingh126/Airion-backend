import { create } from 'zustand';
import { fetchBudget as apiFetchBudget, updateBudget as apiUpdateBudget } from '../lib/api';

export interface BudgetItem {
    id: string;
    category: string;
    allocated: number;
    spent: number;
    vendorId?: string;
    vendorName?: string;
    status: 'paid' | 'pending' | 'over-budget';
}

export interface Booking {
    id: string;
    vendorName: string;
    category: string;
    date: string;
    time: string;
    status: 'Upcoming' | 'Pending' | 'Completed' | 'Cancelled';
    price: number;
    paidAmount: number;
    imageUrl: string;
    location: string;
    emiAvailable: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'booking' | 'offer' | 'chat' | 'reminder';
    date: string;
    read: boolean;
}

export interface Message {
    id: string;
    sender: 'user' | 'vendor';
    text: string;
    timestamp: string;
}

export interface ChatThread {
    id: string;
    vendorName: string;
    vendorAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    messages: Message[];
}

interface DashboardState {
    // Budget
    totalBudget: number;
    budgetItems: BudgetItem[];

    // Bookings
    bookings: Booking[];

    // Notifications & Chats
    notifications: Notification[];
    chatThreads: ChatThread[];

    // Actions
    fetchBudget: () => Promise<void>;
    updateBudgetAllocation: (id: string, allocated: number) => void;
    addExpense: (id: string, amount: number) => void;
    setTotalBudget: (amount: number) => void;
    markNotificationRead: (id: string) => void;
    markAllRead: () => void;
    sendMessage: (threadId: string, text: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    totalBudget: 0,
    budgetItems: [],
    bookings: [],
    notifications: [],
    chatThreads: [],

    fetchBudget: async () => {
        try {
            const response = await apiFetchBudget() as any;
            const data = response.data || response;
            if (data) {
                set({ 
                    totalBudget: parseFloat(data.totalBudget), 
                    budgetItems: data.items 
                });
            }
        } catch (error) {
            console.error('Failed to fetch budget:', error);
        }
    },

    updateBudgetAllocation: async (id, allocated) => {
        set((state) => {
            const newItems = state.budgetItems.map(item => item.id === id ? { ...item, allocated } : item);
            // Async sync
            apiUpdateBudget({ items: newItems }).catch(console.error);
            return { budgetItems: newItems };
        });
    },

    setTotalBudget: (amount) => set({ totalBudget: amount }),
    addExpense: async (id, amount) => {
        set((state) => {
            const newItems = state.budgetItems.map(item => item.id === id ? { ...item, spent: item.spent + amount } : item);
             // Async sync
             apiUpdateBudget({ items: newItems }).catch(console.error);
            return { budgetItems: newItems };
        });
    },

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),

    sendMessage: (threadId, text) => set((state) => ({
        chatThreads: state.chatThreads.map(thread =>
            thread.id === threadId
                ? {
                    ...thread,
                    messages: [...thread.messages, { id: `m${Date.now()}`, sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
                    lastMessage: text,
                    timestamp: 'Just now'
                }
                : thread
        )
    }))
}));
