import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Event } from '../types';
import { useAuth } from '@ease2event/shared';
import { fetchProductWishlist, toggleProductWishlist as apiToggleProductWishlist } from '../lib/api';

interface WishlistContextType {
    wishlist: Event[];
    addToWishlist: (vendor: Event) => void;
    removeFromWishlist: (id: string) => void;
    isInWishlist: (id: string) => boolean;
    productWishlistIds: string[];
    toggleProductWishlist: (productId: string) => Promise<boolean>;
    isInProductWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlist, setWishlist] = useState<Event[]>(() => {
        const saved = localStorage.getItem('ease2event_wishlist');
        return saved ? JSON.parse(saved) : [];
    });
    
    const { user } = useAuth();
    const [productWishlistIds, setProductWishlistIds] = useState<string[]>([]);

    useEffect(() => {
        localStorage.setItem('ease2event_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    useEffect(() => {
        if (user) {
            const cachedWishlist = JSON.parse(localStorage.getItem(`wishlist_${user.id}`) || '[]');
            fetchProductWishlist()
                .then(data => {
                    if (Array.isArray(data)) {
                        setProductWishlistIds([...data.map((w: any) => w.productId), ...cachedWishlist]);
                    } else {
                        setProductWishlistIds(cachedWishlist);
                    }
                })
                .catch(err => {
                    console.error('Failed to load product wishlist', err);
                    setProductWishlistIds(cachedWishlist);
                });
        } else {
            setProductWishlistIds([]);
        }
    }, [user]);

    const addToWishlist = (vendor: Event) => {
        setWishlist(prev => {
            if (prev.find(v => v.id === vendor.id)) return prev;
            return [...prev, vendor];
        });
    };

    const removeFromWishlist = (id: string) => {
        setWishlist(prev => prev.filter(v => v.id !== id));
    };

    const isInWishlist = (id: string) => {
        return wishlist.some(v => v.id === id);
    };

    const toggleProductWishlist = async (productId: string) => {
        if (!user) return false;

        try {
            const result = await apiToggleProductWishlist(productId);
            if (result.wishlisted) {
                setProductWishlistIds(prev => [...prev, productId]);
            } else {
                setProductWishlistIds(prev => prev.filter(id => id !== productId));
            }
            return result.wishlisted;
        } catch (error) {
            console.error('Failed to toggle product wishlist', error);
            return false;
        }
    };

    const isInProductWishlist = (id: string) => {
        return productWishlistIds.includes(id);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, productWishlistIds, toggleProductWishlist, isInProductWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
