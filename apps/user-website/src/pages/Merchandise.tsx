import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart, Product } from '../context/CartContext';
import { Filter, ShoppingBag, Search, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../lib/api';
import { useAuth } from '@ease2event/shared';
import { toast } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

const CATEGORIES = ['All', 'Decor', 'Apparel', 'Signage', 'Gifts', 'Entertainment'];

const AddToCartWidget = ({ product, variant = 'text' }: { product: Product, variant?: 'text' | 'icon' }) => {
    const { items, addToCart, updateQuantity } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const cartItem = items.find(i => i.id === product.id);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login', { state: { returnTo: '/merchandise' } });
            return;
        }
        setIsAdding(true);
        try {
            await addToCart(product, 1);
        } catch (e) {
            toast.error('Failed to add item to cart.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateQuantity = async (newQuantity: number) => {
        setIsUpdating(true);
        try {
            await updateQuantity(product.id, newQuantity);
        } catch (e) {
            toast.error('Failed to update quantity.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (cartItem) {
        return (
            <div className={`flex items-center gap-1.5 bg-neutral-100 dark:bg-slate-800 rounded px-1 py-1 ${variant === 'icon' ? '' : 'h-[28px]'}`}>
                <button
                    onClick={(e) => { e.preventDefault(); handleUpdateQuantity(cartItem.quantity - 1); }}
                    disabled={isUpdating}
                    className="w-6 h-6 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    -
                </button>
                <div className="w-4 flex justify-center">
                    {isUpdating ? (
                        <div className="w-3 h-3 border-[1.5px] border-neutral-400 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
                    ) : (
                        <span className="text-xs font-bold text-neutral-950 dark:text-white">{cartItem.quantity}</span>
                    )}
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); handleUpdateQuantity(cartItem.quantity + 1); }}
                    disabled={isUpdating}
                    className="w-6 h-6 flex items-center justify-center font-bold text-neutral-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    +
                </button>
            </div>
        );
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
                disabled={isAdding}
                className="p-2 bg-neutral-100 hover:bg-neutral-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add to Cart"
            >
                {isAdding ? (
                    <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <ShoppingBag size={16} />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            disabled={isAdding}
            className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed h-[28px] min-w-[90px]"
        >
            {isAdding ? (
                <>
                    <div className="w-3 h-3 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                    Adding
                </>
            ) : (
                'Add to Cart'
            )}
        </button>
    );
};

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
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow backdrop-blur transition-all disabled:opacity-50 cursor-pointer"
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart size={14} className={`transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-neutral-500 dark:text-neutral-300'}`} />
        </button>
    );
};

const Merchandise: React.FC = () => {
    const { addToCart, items } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingHero, setIsAddingHero] = useState(false);

    const handleAddToCart = async (product: Product) => {
        if (!user) {
            navigate('/login', { state: { returnTo: '/merchandise' } });
            return;
        }
        setIsAddingHero(true);
        try {
            await addToCart(product, 1);
        } catch (error) {
            toast.error('Failed to add item to cart.');
        } finally {
            setIsAddingHero(false);
        }
    };

    React.useEffect(() => {
        setLoading(true);
        fetchProducts()
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data || []);
                if (Array.isArray(list)) {
                    setProducts(list.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: Number(p.price),
                        category: p.category,
                        image: p.image || 'https://images.unsplash.com/photo-1729919561898-f4a994c90b0c?w=600&auto=format&fit=crop&q=80',
                        description: p.description
                    })));
                } else {
                    setProducts([]);
                }
            })
            .catch(() => {
                setProducts([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredProducts = products.filter(p => {
        const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    const spotlightProduct = products[0];

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-slate-950 pt-20 pb-16">
            {/* Simple Hero Banner (No Gradients, No Animations) */}
            <div className="bg-neutral-900 text-white py-12 sm:py-16 mb-12 border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Section */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="inline-block px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-widest rounded">
                            Airion Event Store
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white">
                            Elevate Your Event With Premium Goods
                        </h1>
                        <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
                            Discover handpicked luxury centerpieces, custom acrylic signage, matching squad apparel, and smart lighting setups. Delivered straight to your venue.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <a
                                href="#store-grid"
                                className="px-6 py-3 bg-red-650 text-white font-bold rounded-lg text-xs tracking-wider uppercase"
                            >
                                Browse Collection
                            </a>
                            {spotlightProduct && (
                                <button
                                    onClick={() => handleAddToCart(spotlightProduct)}
                                    disabled={isAddingHero}
                                    className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-700 text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isAddingHero ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                    Get {spotlightProduct.title} (₹{spotlightProduct.price.toLocaleString()})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Flat Spotlight Card (No Hover / Animation) */}
                    {spotlightProduct && (
                        <div className="lg:col-span-5">
                            <div className="p-6 bg-neutral-850 border border-neutral-850 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
                                <div className="w-28 h-28 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                                    <img
                                        src={spotlightProduct.image}
                                        alt={spotlightProduct.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="space-y-2 flex-1 text-center sm:text-left">
                                    <span className="px-2 py-0.5 bg-red-950 text-[9px] font-bold text-red-400 uppercase tracking-widest rounded">
                                        Featured Item
                                    </span>
                                    <h3 className="font-bold text-white text-sm line-clamp-1">
                                        {spotlightProduct.title}
                                    </h3>
                                    <p className="text-neutral-400 text-xs line-clamp-2">
                                        {(spotlightProduct as any).description || 'Premium merchandise for celebrations and events.'}
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="font-bold text-sm text-white">₹{spotlightProduct.price.toLocaleString()}</span>
                                        <AddToCartWidget product={spotlightProduct} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div id="store-grid" className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Search & Filter Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-neutral-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Our Collection</h2>
                        <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">{filteredProducts.length} items available in category "{selectedCategory}"</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-850 rounded-xl focus:ring-1 focus:ring-neutral-400 outline-none text-sm font-medium text-neutral-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Categories Tab Bar */}
                <div className="flex overflow-x-auto pb-4 mb-8 gap-2 custom-scrollbar">
                    {CATEGORIES.map(cat => {
                        const count = cat === 'All' ? products.length : products.filter(p => p.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer ${selectedCategory === cat
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-white dark:bg-slate-900 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-800'
                                    }`}
                            >
                                {cat}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategory === cat
                                    ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Products Grid (Standard Divs, No Framer Motion animations or scale hovers) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => {
                        const productStock = (product as any).stock || 10;
                        const productRating = (product as any).rating || 4.8;
                        const reviews = (product as any).reviewsCount || 100;
                        return (
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

                                        {/* Stock Badge */}
                                        <div className={`absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded ${productStock <= 15
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-emerald-500 text-white'
                                            }`}>
                                            {productStock <= 15 ? `Only ${productStock} left` : 'In Stock'}
                                        </div>
                                        <div className="absolute top-2 right-2 z-10">
                                            <WishlistButton productId={product.id} />
                                        </div>
                                    </Link>

                                    <div className="p-4 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Star className="text-yellow-400 fill-yellow-400" size={12} />
                                            <span className="text-xs font-bold text-neutral-800 dark:text-slate-300">{productRating}</span>
                                            <span className="text-[10px] text-neutral-450">({reviews})</span>
                                        </div>
                                        <Link to={`/merchandise/${product.id}`}>
                                            <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2 text-xs min-h-[36px] leading-tight">
                                                {product.title}
                                            </h3>
                                        </Link>
                                        <p className="text-[11px] text-neutral-500 dark:text-slate-450 line-clamp-2 min-h-[32px] leading-relaxed">
                                            {(product as any).description || 'Elevate your event with this high-quality product.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-slate-800 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-neutral-900 dark:text-white">₹{product.price.toLocaleString()}</span>
                                    </div>
                                    <AddToCartWidget product={product} variant="icon" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800">
                        <ShoppingBag className="mx-auto text-neutral-300 dark:text-slate-750 mb-3" size={40} />
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">No products found</h3>
                        <p className="text-neutral-500 text-xs">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Merchandise;
