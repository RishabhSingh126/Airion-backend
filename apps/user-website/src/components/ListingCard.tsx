import React, { useState } from 'react';
import { Star, MapPin, Heart, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Plus, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@ease2event/shared';
import { toast } from 'react-hot-toast';

interface ListingCardProps {
    id: string;
    images?: string[];
    image?: string;
    title: string;
    rating: number;
    reviews: number;
    location: string;
    price: string;
    description: string;
    category?: string;
    tags?: string[];
    highlights?: string[];
    isTrending?: boolean;
    marketplaceStatus?: 'AVAILABLE' | 'FILLING_FAST' | 'SOLD_OUT' | 'COMING_SOON';
    spotsLeft?: number;
}

import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';

const ListingCard: React.FC<ListingCardProps> = ({
    id, images, image, title, rating, reviews, location, price, category,
    tags = [],
    highlights = [],
    isTrending = false,
    marketplaceStatus,
    spotsLeft,
    description = ''
}) => {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCompare, removeFromCompare, isInCompare } = useCompare();
    
    const isWishlisted = isInWishlist(id);
    const isCompared = isInCompare(id);
    
    const { user } = useAuth();
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const navigate = useNavigate();

    const imageList = images && images.length > 0
        ? images
        : [image || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80'];

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    const vendorObj = {
        id, title, rating, reviews, location, price, category: category || '', image: imageList[0], description, capacity: ''
    };

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast('Please login or sign up for adding in wishlist.', {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }
        if (isWishlisted) {
            removeFromWishlist(id);
            toast.success('Removed from wishlist');
        } else {
            addToWishlist(vendorObj);
            toast.success('Added to wishlist');
        }
    };

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCompared) {
            removeFromCompare(id);
        } else {
            addToCompare(vendorObj);
        }
    };

    const handleBookNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (marketplaceStatus === 'SOLD_OUT') return;
        navigate(`/event/${id}?booking=true`);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'SOLD_OUT': return { label: 'Sold Out', color: 'bg-red-500 text-white shadow-red-500/20' };
            case 'FILLING_FAST': return { label: 'Filling Fast', color: 'bg-amber-500 text-white shadow-amber-500/20' };
            case 'COMING_SOON': return { label: 'Coming Soon', color: 'bg-indigo-500 text-white shadow-indigo-500/20' };
            case 'TOP_RATED': return { label: 'Top Rated', color: 'bg-cyan-500 text-white shadow-cyan-500/20' };
            case 'NEW': return { label: 'New', color: 'bg-blue-500 text-white shadow-blue-500/20' };
            case 'AVAILABLE': default: return { label: 'Available', color: 'bg-emerald-500 text-white shadow-emerald-500/20' };
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate(`/event/${id}`)}
            className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-neutral-100 dark:border-slate-800 shadow-sm transition-all duration-300 relative"
        >
            {/* Image Section */}
            <Link to={`/event/${id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 group/image">
                <AnimatePresence initial={false}>
                    <motion.img
                        key={currentImageIndex}
                        src={imageList[currentImageIndex]}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* Verified / Trading Badges */}
                <div className="absolute top-3 left-3 right-12 z-10 flex flex-wrap gap-1.5 items-start">
                    {tags.map((tag) => (
                        <span key={tag} className={`${tag === 'Verified' ? 'bg-emerald-500/90 shadow-emerald-500/20' : 'bg-black/60 shadow-black/20'} backdrop-blur-md text-white text-[9px] md:text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg border border-white/10 transition-transform  pointer-events-auto`}>
                            {tag === 'Verified' && <ShieldCheck size={11} className="text-white" />}
                            {tag}
                        </span>
                    ))}
                    {marketplaceStatus && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-md ${getStatusConfig(marketplaceStatus).color}`}>
                            {marketplaceStatus === 'AVAILABLE' ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> : null}
                            {getStatusConfig(marketplaceStatus).label}
                        </span>
                    )}
                    {isTrending && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm shadow-red-500/10">
                            <Sparkles size={11} /> Trending
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={toggleWishlist}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm dark:bg-slate-900/80 rounded-full shadow-sm cursor-pointer"
                    aria-label="Add to wishlist"
                >
                    <Heart
                        size={18}
                        className={`transition-all duration-300 ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-neutral-500 '}`}
                    />
                </button>


                {/* Carousel Arrows */}
                {imageList.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity  hover:bg-white z-10"
                        >
                            <ChevronLeft size={18} className="text-gray-900" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity  hover:bg-white z-10"
                        >
                            <ChevronRight size={18} className="text-gray-900" />
                        </button>
                    </>
                )}

                {/* Dot Indicators */}
                {imageList.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {imageList.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/60'}`}
                            />
                        ))}
                    </div>
                )}
            </Link>

            {/* Content Section */}
            <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <Link to={`/event/${id}`}>
                            <h3 className="font-bold text-sm md:text-base leading-snug text-neutral-900 dark:text-neutral-100 hover:text-red-500 transition-colors truncate">
                                {title}
                            </h3>
                        </Link>
                        {category && <p className="text-[10px] md:text-xs text-neutral-400 mt-0.5 font-medium">{category}</p>}
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-500 shrink-0">
                        <Star size={12} className="fill-amber-500 text-amber-500" />
                        {Number(rating || 0).toFixed(1)} {reviews > 0 && <span className="text-amber-600/60 font-medium font-sans">({reviews})</span>}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div className="text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={12} className="text-neutral-400" />
                        <span className="truncate max-w-[120px]">{location}</span>
                    </div>
                    {spotsLeft !== undefined && marketplaceStatus !== 'SOLD_OUT' && (
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-right">
                            👥 {spotsLeft} spots left
                        </div>
                    )}
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                    {highlights.map((hlt) => (
                        <span key={hlt} className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-neutral-600 dark:text-slate-300 bg-neutral-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Zap size={10} className="text-amber-500" /> {hlt}
                        </span>
                    ))}
                </div>

                {/* Pricing & Actions */}
                <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-neutral-400">Starts from</p>
                        <p className="text-sm font-black text-neutral-900 dark:text-white leading-tight">
                            {typeof price === 'string' ? price.replace(/\+/g, '') : price}
                        </p>
                    </div>
                    <button
                        onClick={handleBookNow}
                        disabled={marketplaceStatus === 'SOLD_OUT'}
                        className={`${marketplaceStatus === 'SOLD_OUT' ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10 '} text-[10px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition flex items-center gap-1`}
                    >
                        {marketplaceStatus === 'SOLD_OUT' ? 'Waitlist' : 'Book Now'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ListingCard;
