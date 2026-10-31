import React, { useState } from 'react';
import { Search, Filter, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import FallingPetals from '../components/FallingPetals';
import toast from 'react-hot-toast';

const Inspiration: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [likedIds, setLikedIds] = useState<number[]>([]);

    const handleShare = async (item: any) => {
        const shareData = {
            title: item.title,
            text: `Check out this ${item.category} inspiration on Ease2event: ${item.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleLike = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const isLiked = likedIds.includes(id);
        if (isLiked) {
            setLikedIds(prev => prev.filter(item => item !== id));
            toast('Removed from wishlist', { icon: '🤍' });
        } else {
            setLikedIds(prev => [...prev, id]);
            toast.success('Added to wishlist!', { icon: '❤️' });
        }
    };

    const filters = ['All', 'Decor', 'Outfits', 'Venues', 'Food', 'Photography', 'Mehndi'];

    const images = [
        { id: 1, category: 'Decor', image: 'https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFuZGFwfGVufDB8fDB8fHww', title: 'Floral Mandap Setup' },
        { id: 2, category: 'Outfits', image: 'https://images.unsplash.com/photo-1724856604403-60304b28906c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGxlaGVuZ2F8ZW58MHx8MHx8fDA%3D', title: 'Bridal Lehenga' },
        { id: 3, category: 'Venues', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop', title: 'Heritage Palace Wedding' },
        { id: 4, category: 'Food', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200&auto=format&fit=crop', title: 'Gourmet Catering' },
        { id: 5, category: 'Photography', image: 'https://images.unsplash.com/photo-1668028772352-bdd4951048cf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fENvdXBsZSUyMFBvcnRyYWl0fGVufDB8fDB8fHww', title: 'Couple Portrait' },
        { id: 6, category: 'Mehndi', image: 'https://plus.unsplash.com/premium_photo-1661862397518-8e50332b6e97?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWVobmRpJTIwZGVzaWdufGVufDB8fDB8fHww', title: 'Intricate Mehndi Design' },
        { id: 7, category: 'Decor', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?q=80&w=1200&auto=format&fit=crop', title: 'Table Setting' },
        { id: 8, category: 'Outfits', image: 'https://images.unsplash.com/photo-1724856604249-ca73680262e8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3Jvb20lMjBkcmVzc3xlbnwwfHwwfHx8MA%3D%3D', title: 'Groom Sherwani' },
        { id: 9, category: 'Venues', image: 'https://images.unsplash.com/photo-1515232389446-a17ce9ca7434?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJlYWNoJTIwd2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D', title: 'Beach Wedding Setup' },
        { id: 10, category: 'Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop', title: 'Dessert Table' },
        { id: 11, category: 'Photography', image: 'https://images.unsplash.com/photo-1614566957872-9548817a3298?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDh8fGNhbmRpZHxlbnwwfHwwfHx8MA%3D%3D', title: 'Candid Moments' },
        { id: 12, category: 'Mehndi', image: 'https://images.unsplash.com/photo-1722872112546-936593441be8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnJpZGFsJTIwaGFuZHxlbnwwfHwwfHx8MA%3D%3D', title: 'Bridal Hands' },
    ];

    const filteredImages = images.filter(img =>
        (activeFilter === 'All' || img.category === activeFilter) &&
        img.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white dark:bg-transparent aurora-bg relative transition-colors duration-300 pt-20 pb-20 overflow-x-hidden">
            <FallingPetals />
            <SEO title="Inspiration Feed" description="Discover beautiful ideas for your next event." />

            {/* Header Section */}
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-neutral-200/50 dark:border-slate-800/80 sticky top-[72px] z-30 transition-colors">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8 pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">Event Inspiration</h1>
                            <p className="text-neutral-500 dark:text-slate-400 font-medium">Discover beautiful ideas curated just for you.</p>
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search 'Bridal Lehenga'..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border border-neutral-200 dark:border-slate-700 rounded-full bg-neutral-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-semibold text-neutral-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                        <button className="p-2.5 rounded-full border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 transition-colors shadow-sm">
                            <Filter size={18} />
                        </button>
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${activeFilter === filter
                                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                        : 'bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300  dark:'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Masonry Grid */}
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-16 pb-12">
                <motion.div layout className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 md:gap-6 space-y-4 md:space-y-6 block">
                    <AnimatePresence>
                        {filteredImages.map((item, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: (idx % 12) * 0.05 }}
                                key={item.id}
                                className="break-inside-avoid group relative rounded-3xl overflow-hidden bg-neutral-100 dark:bg-slate-800 shadow-sm border border-neutral-200/50 dark:border-slate-800/80 cursor-zoom-in"
                            >
                                <img src={item.image} alt={item.title} loading="lazy" className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <p className="text-white font-bold text-lg mb-3 tracking-wide">{item.title}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handleLike(item.id, e)}
                                                className={`p-2.5 backdrop-blur-md rounded-full transition-all cursor-pointer border ${likedIds.includes(item.id) ? 'bg-red-500 border-transparent text-white' : 'bg-white/20 text-white hover:bg-red-500  border-white/30'}`}
                                            >
                                                <Heart size={16} className={likedIds.includes(item.id) ? 'fill-current' : ''} />
                                            </button>
                                            <button 
                                                onClick={() => handleShare(item)}
                                                className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-neutral-900 border border-white/30 transition-all cursor-pointer"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                        <span className="text-[11px] font-bold text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 uppercase tracking-wider">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredImages.length === 0 && (
                    <div className="text-center py-32 bg-neutral-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-neutral-200 dark:border-slate-800">
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">No inspiration found</h3>
                        <p className="text-neutral-500">Try adjusting your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inspiration;
