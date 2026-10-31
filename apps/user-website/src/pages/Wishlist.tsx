import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Star } from 'lucide-react';
import { fetchProducts } from '../lib/api';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '@ease2event/shared';
import { Product } from '../context/CartContext';
import ListingCard from "../components/ListingCard";
const WishlistPage: React.FC = () => {
    const { user } = useAuth();
    const { productWishlistIds, toggleProductWishlist, wishlist } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts()
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data || []);
                if (Array.isArray(list) && list.length > 0) {
                    setProducts(list.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: Number(p.price),
                        category: p.category,
                        image: p.image || 'https://images.unsplash.com/photo-1729919561898-f4a994c90b0c?w=600&auto=format&fit=crop&q=80'
                    })));
                } else {
                    setProducts([]);
                }
            })
            .catch(err => {
                console.error(err);
                setProducts([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const wishlistedProducts = products.filter(p => productWishlistIds.includes(p.id));
    const totalWishlistItems = wishlistedProducts.length + wishlist.length;

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-neutral-50 dark:bg-slate-950">
                <Heart size={48} className="text-neutral-300 mb-4" />
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Please log in</h2>
                <p className="text-neutral-500 mb-6">You need to be logged in to view your wishlist.</p>
                <Link to="/login" className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold">
                    Login / Sign up
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 bg-neutral-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-slate-950 pt-28 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/merchandise" className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold text-sm mb-4 transition-colors">
                            <ArrowLeft size={16} /> Continue Shopping
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                            <Heart className="fill-red-500 text-red-500" size={32} /> My Wishlist
                        </h1>
                        <p className="text-neutral-500 dark:text-slate-400 mt-2 font-medium">
                            {totalWishlistItems} {totalWishlistItems === 1 ? 'item' : 'items'} saved
                        </p>
                    </div>
                </div>

                {totalWishlistItems === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <Heart size={64} className="text-neutral-200 dark:text-slate-800 mb-6" />
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">Your wishlist is empty</h2>
                        <p className="text-neutral-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                            Looks like you haven't saved any items yet. Explore our venues and products to find what you love!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to="/merchandise" className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20">
                                Explore Products
                            </Link>
                            <Link to="/" className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-neutral-200 dark:border-slate-700 hover:border-red-500 text-neutral-900 dark:text-white rounded-xl font-bold transition-all">
                                Explore Venues
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Venues & Events Wishlist */}
                        {wishlist.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6">Saved Venues & Events</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wishlist.map((vendor) => (
                                        <ListingCard
                                            key={vendor.id}
                                            {...vendor}
                                            tags={[]}
                                            highlights={[]}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Merchandise Wishlist */}
                        {wishlistedProducts.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6">Saved Products</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {wishlistedProducts.map((product) => (
                                        <div
                                            key={product.id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
                            >
                                <div>
                                    <Link to={`/merchandise/${product.id}`} className="block relative aspect-square overflow-hidden bg-neutral-100 dark:bg-slate-800">
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 left-2 bg-neutral-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                            {product.category}
                                        </div>
                                        <div className="absolute top-2 right-2 z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleProductWishlist(product.id);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow backdrop-blur transition-all"
                                                title="Remove from Wishlist"
                                            >
                                                <Heart size={14} className="transition-colors fill-red-500 text-red-500" />
                                            </button>
                                        </div>
                                    </Link>

                                    <div className="p-4 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Star className="text-yellow-400 fill-yellow-400" size={12} />
                                            <span className="text-xs font-bold text-neutral-800 dark:text-slate-300">4.8</span>
                                        </div>
                                        <Link to={`/merchandise/${product.id}`}>
                                            <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2 text-xs min-h-[36px] leading-tight">
                                                {product.title}
                                            </h3>
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-4 pt-0 mt-auto">
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-slate-800">
                                        <span className="font-black text-sm text-neutral-900 dark:text-white">
                                            ₹{product.price.toLocaleString()}
                                        </span>
                                        <Link to={`/merchandise/${product.id}`} className="p-2 bg-neutral-100 hover:bg-neutral-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-200 rounded cursor-pointer" title="View Details">
                                            <ShoppingBag size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                                </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};

export default WishlistPage;
