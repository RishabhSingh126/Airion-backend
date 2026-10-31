import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Search } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import FilterSidebar, { FilterValues } from '../components/FilterSidebar';
import SEO from '../components/SEO';
import { fetchEvents } from '../lib/api';
import type { Event } from '../types';

const TrendingWeddings: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<FilterValues | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const loadEvents = async () => {
            const allEvents = await fetchEvents();
            const trending = allEvents.filter(e =>
                e.category?.toLowerCase().includes('wedding') || e.isFeatured || (e.rating && Number(e.rating) >= 4.5)
            );
            setEvents(trending.length > 0 ? trending : allEvents);
            setLoading(false);
        };
        loadEvents();
    }, []);

    const handleApplyFilters = (filters: FilterValues) => {
        setAppliedFilters(filters);
        setShowMobileFilters(false);
    };

    const filteredEvents = useMemo(() => {
        if (!appliedFilters) return events;
        return events.filter(v => {
            if (appliedFilters.locationInput) {
                if (!v.location?.toLowerCase().includes(appliedFilters.locationInput.toLowerCase())) return false;
            }
            if (appliedFilters.priceRange) {
                const priceValue = typeof v.price === 'string' 
                    ? parseInt(v.price.replace(/\D/g, '') || '0') 
                    : v.price || 0;
                if (priceValue > 0 && priceValue > appliedFilters.priceRange) return false;
            }
            if (appliedFilters.selectedEventTypes.length > 0) {
                if (!appliedFilters.selectedEventTypes.some(t =>
                    v.category?.toLowerCase().includes(t.toLowerCase())
                )) return false;
            }
            if (appliedFilters.selectedCapacity) {
                const capacityValue = parseInt(v.capacity?.replace(/\D/g, '') || '0');
                if (v.capacity?.toLowerCase() === 'contact vendor') return true;
                if (appliedFilters.selectedCapacity === 'Small Intimate' && (capacityValue < 10 || capacityValue > 50)) return false;
                if (appliedFilters.selectedCapacity === 'Medium Gathering' && (capacityValue < 50 || capacityValue > 200)) return false;
                if (appliedFilters.selectedCapacity === 'Large Celebration' && capacityValue < 200) return false;
            }
            return true;
        });
    }, [events, appliedFilters]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <SEO title="Trending Weddings | Ease2event" description="Explore the most popular and trending wedding venues tailored for your special day." />

            {/* Hero Section */}
            <div className="relative h-[40vh] min-h-[350px] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1519225448526-0a0295155809?q=80&w=1000&auto=format&fit=crop"
                        alt="Trending Weddings"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-black/40 backdrop-blur-[1px]"></div>
                </div>
                <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-center text-white">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors w-fit group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} fill="currentColor" />
                            Curated Collection
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Trending Weddings</h1>
                    <p className="text-xl text-white/90 max-w-2xl font-light">
                        The most sought-after venues of the season. Handpicked for their exceptional beauty, service, and grandeur.
                    </p>
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="lg:hidden mt-8 flex items-center gap-2 px-8 py-3.5 bg-red-500 text-white rounded-full font-bold text-sm shadow-[0_10px_40px_rgba(239,68,68,0.3)] w-fit active:scale-95 transition-all"
                    >
                        <Search size={16} /> Filters
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className={`w-full lg:w-1/4 ${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
                        <div className="sticky top-24">
                            <FilterSidebar onApply={handleApplyFilters} />
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-red-500" />
                                Top Picks
                            </h2>
                            <span className="text-gray-500 dark:text-slate-400 text-sm">
                                {filteredEvents.length} Venues Found
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                            {filteredEvents.map((event) => (
                                <ListingCard key={event.id} {...event} />
                            ))}
                        </div>

                        {/* Additional CTA or Content */}
                        <div className="mt-16 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 text-center">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Don't see what you're looking for?</h3>
                            <p className="text-gray-600 dark:text-slate-400 mb-6">Explore our full collection of wedding venues tailored to every style and budget.</p>
                            <Link to="/category/weddings" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                                View All Weddings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendingWeddings;
