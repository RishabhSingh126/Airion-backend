import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { Star, ShieldCheck, Truck, RefreshCw, ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

import { fetchProductById } from '../lib/api';
import { useAuth } from '@ease2event/shared';
import { useWishlist } from '../context/WishlistContext';


const WishlistButton: React.FC<{ productId: string }> = ({ productId }) => {
    const { user } = useAuth();
    const { isInProductWishlist, toggleProductWishlist } = useWishlist();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const isSaved = isInProductWishlist(productId);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast('Please login or sign up for adding in wishlist.', {
                icon: '❤️',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }
        
        setIsProcessing(true);
        const success = await toggleProductWishlist(productId);
        setIsProcessing(false);
        if (success) {
            toast.success('Added to wishlist');
        } else {
            toast.success('Removed from wishlist');
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isProcessing}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart size={20} className={`transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-neutral-500 dark:text-neutral-300'}`} />
        </button>
    );
};

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { items, addToCart, updateQuantity } = useCart();
    const [product, setProduct] = useState<Product | undefined>(undefined);
    const cartItem = items.find(i => i.id === product?.id);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchProductById(id)
            .then((res: any) => {
                const data = res?.data || res;
                if (data && data.id) {
                    setProduct({
                        id: data.id,
                        title: data.title,
                        price: Number(data.price),
                        category: data.category,
                        image: data.image || 'https://images.unsplash.com/photo-1729919561898-f4a994c90b0c?w=600&auto=format&fit=crop&q=80'
                    });
                } else {
                    setProduct(undefined);
                }
            })
            .catch(() => {
                setProduct(undefined);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    if (loading && !product) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 bg-neutral-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4">Product Not Found</h2>
                <button onClick={() => navigate('/merchandise')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold">
                    Back to Shop
                </button>
            </div>
        );
    }

    const { user } = useAuth();

    const handleAddToCart = async () => {
        if (!user) {
            toast.error('Please login to add items to cart.');
            navigate('/login', { state: { returnTo: `/merchandise/${id}` } });
            return;
        }
        setIsAdding(true);
        try {
            await addToCart(product, quantity);
        } catch (e) {
            toast.error('Failed to add item to cart.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateQuantity = async (newQuantity: number) => {
        setIsUpdating(true);
        try {
            await updateQuantity(product!.id, newQuantity);
        } catch (e) {
            toast.error('Failed to update quantity.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-slate-950 pt-28 pb-16">
            <div className="max-w-6xl mx-auto px-4">
                <button
                    onClick={() => navigate('/merchandise')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold text-sm mb-8 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Store
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[32px] border border-neutral-200/60 dark:border-slate-800">

                    {/* Left: Image */}
                    <div className="aspect-square rounded-3xl overflow-hidden bg-neutral-100 dark:bg-slate-800 border border-neutral-200/50 dark:border-slate-800">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Right: Info */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-3.5 py-1.5 rounded-full">
                                {product.category}
                            </span>

                            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-4 leading-tight">
                                {product.title}
                            </h1>

                            <div className="flex items-center gap-3 mt-4">
                                <div className="flex items-center gap-1">
                                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                                    <span className="text-sm font-bold text-neutral-800 dark:text-white">4.8</span>
                                </div>
                                <span className="text-neutral-300 dark:text-slate-700">|</span>
                                <span className="text-sm text-neutral-500 font-medium">124 Reviews</span>
                            </div>

                            <p className="text-3xl font-black text-neutral-900 dark:text-white mt-6">
                                ₹{product.price.toLocaleString()}
                            </p>

                            <p className="text-neutral-500 dark:text-slate-400 mt-6 leading-relaxed text-sm">
                                Elevate your event with this high-quality product. Designed to match standard luxury wedding and party decor setups. Durable, beautiful, and easy to set up. Contact support for bulk pricing requirements.
                            </p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-slate-800">
                            {cartItem ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-slate-800 rounded-2xl p-2 border border-neutral-200 dark:border-slate-700">
                                        <button
                                            onClick={() => handleUpdateQuantity(cartItem.quantity - 1)}
                                            disabled={isUpdating}
                                            className="w-12 h-12 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        <div className="flex flex-col items-center">
                                            {isUpdating ? (
                                                <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 dark:border-slate-600 dark:border-t-white rounded-full animate-spin my-[2px]" />
                                            ) : (
                                                <span className="text-xl font-black text-neutral-950 dark:text-white">{cartItem.quantity}</span>
                                            )}
                                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">in cart</span>
                                        </div>
                                        <button
                                            onClick={() => handleUpdateQuantity(cartItem.quantity + 1)}
                                            disabled={isUpdating}
                                            className="w-12 h-12 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate('/cart')}
                                        className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-3"
                                    >
                                        <ShoppingCart size={18} /> Go to Cart
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Quantity Selector */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="text-sm font-bold text-neutral-700 dark:text-slate-300">Quantity:</span>
                                        <div className="flex items-center bg-neutral-50 dark:bg-slate-800 rounded-xl p-1 border border-neutral-200 dark:border-slate-700">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-8 h-8 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center font-bold text-neutral-950 dark:text-white">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(q => q + 1)}
                                                className="w-8 h-8 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* CTAs */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isAdding}
                                            className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            {isAdding ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <ShoppingCart size={18} />
                                            )}
                                            {isAdding ? 'Adding...' : 'Add to Cart'}
                                        </button>
                                        <WishlistButton productId={product.id} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-100 dark:border-slate-800">
                            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/50 border border-neutral-100 dark:border-slate-800">
                                <Truck size={20} className="text-neutral-600 dark:text-slate-400 mb-1" />
                                <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/50 border border-neutral-100 dark:border-slate-800">
                                <ShieldCheck size={20} className="text-neutral-600 dark:text-slate-400 mb-1" />
                                <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">Secure Payment</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/50 border border-neutral-100 dark:border-slate-800">
                                <RefreshCw size={20} className="text-neutral-600 dark:text-slate-400 mb-1" />
                                <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">7-Day Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProductDetails;
