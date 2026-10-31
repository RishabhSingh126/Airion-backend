import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Calendar, Star, Shield, Heart, ArrowRight, Sparkles, LayoutDashboard, Clock, CheckCircle2, Wallet, Phone, DollarSign, Plus, X } from 'lucide-react';
import Hero from '../components/Hero';
import CategorySlider from '../components/CategorySlider';
import CategorySection from '../components/CategorySection';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import ListingCard from '../components/ListingCard';
import { useAuth, getPortalUrl } from '@ease2event/shared/auth';
import FallingPetals from '../components/FallingPetals';
import FallingLeaves from '../components/FallingLeaves';

import { fetchEvents } from '../lib/api';
import api from '../lib/api';
import type { Event } from '../types';

const DEFAULT_FAQS = [
    {
        question: "How quickly can I get venue proposals after submitting a brief?",
        answer: "Most clients receive 3–5 personalised venue proposals within 2 hours of submitting their brief during business hours. For urgent requests, use the Priority Planning option and we'll respond within 30 minutes."
    },
    {
        question: "Is there a fee to use Ease2event's planning service?",
        answer: "Browsing, shortlisting, and getting proposals is completely free. We charge a planning service fee only when you confirm a booking — and this is clearly quoted upfront with zero hidden charges."
    },
    {
        question: "Can I cancel or reschedule after booking?",
        answer: "Yes. Full refunds are available within 48 hours of booking. For cancellations 7+ days before the event, we offer a 70% refund. Our concierge will also help you find alternate dates with the same venue at no extra cost."
    },
    {
        question: "Do you cover events outside major cities?",
        answer: "Yes! Ease2event currently operates in 42 cities including Tier 2 cities like Indore, Coimbatore, Surat, and Lucknow. For destination events in remote locations, our travel event specialists personally handle all logistics."
    },
    {
        question: "Can I list my venue or vendor business on Ease2event?",
        answer: "Absolutely. We accept applications from venues, caterers, photographers, decorators, and entertainment providers. All listings undergo a verification process. Apply via our \"List Your Business\" page — we typically respond within 5 business days."
    },
    {
        question: "What if something goes wrong on the event day?",
        answer: "Every Ease2event booking includes an on-ground coordinator present throughout the event. In the rare case of vendor issues, our emergency response team can arrange replacements within 2–4 hours. You'll never be left stranded."
    }
];

const FAQItem = ({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#C25844]/20"
            >
                <span className="font-bold text-[#1A1A1A] dark:text-white text-[15px] pr-4">{question}</span>
                <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-[#C25844] text-white transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[#C25844]/80' : ''}`}>
                    {isOpen ? <X size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                </div>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-5 md:px-6 pb-6 text-[13px] md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-slate-700 pt-4">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const DEFAULT_GRID_CATEGORIES = [
    { name: 'Weddings & Ceremonies', slug: 'weddings', image: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=2000&auto=format&fit=crop&q=80', gridClass: 'col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2 h-64 lg:h-auto' },
    { name: 'Milestone Birthdays', slug: 'birthdays', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Corporate Galas', slug: 'corporate', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Soirées & Parties', slug: 'parties', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 sm:col-span-2 lg:col-span-2 h-64' },
    { name: 'Photography', slug: 'photography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Curated Dining', slug: 'catering', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Artistic Decor', slug: 'decor', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Music & DJs', slug: 'music', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
    { name: 'Premium Venues', slug: 'venues', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 sm:col-span-2 lg:col-span-2 h-64' },
    { name: 'Bridal Makeup', slug: 'makeup', image: 'https://plus.unsplash.com/premium_photo-1677526496597-aa0f49053ce2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFrZXVwJTIwcHJvZHVjdHN8ZW58MHx8MHx8fDA%3D', gridClass: 'col-span-1 h-64' },
    { name: 'Full Planning', slug: 'planning', image: 'https://images.unsplash.com/photo-1586936893354-362ad6ae47ba?q=80&w=2000&auto=format&fit=crop', gridClass: 'col-span-1 h-64' },
];

const Home: React.FC = () => {
    const { showToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const activeCategory = searchParams.get('category') || 'all';

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marketplaceTab, setMarketplaceTab] = useState('All');
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
    const [activeAds, setActiveAds] = useState<any[]>([]);

    const [gridCategories, setGridCategories] = useState(DEFAULT_GRID_CATEGORIES);
    const [faqs, setFaqs] = useState(DEFAULT_FAQS);

    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [subscribeError, setSubscribeError] = useState('');



    useEffect(() => {
        fetchEvents()
            .then(data => {
                setEvents(data);
            })
            .catch(err => {
                console.error('Failed to load events', err);
            })
            .finally(() => {
                setLoading(false);
            });

        api.get('/ads/active').then((res: any) => {
            const data = Array.isArray(res) ? res : res.data;
            if (Array.isArray(data)) {
                setActiveAds(data.filter((ad: any) => ad.adType === 'banner' || ad.adType === 'featured'));
            }
        }).catch(err => console.error('Failed to load ads', err));

        api.get('/cms').then((res: any) => {
            if (res.data?.landing_page_categories && res.data.landing_page_categories.length > 0) {
                setGridCategories(res.data.landing_page_categories);
            }
            if (res.data?.landing_page_faqs && res.data.landing_page_faqs.length > 0) {
                setFaqs(res.data.landing_page_faqs);
            }
        }).catch(err => console.error('Failed to load CMS', err));
    }, []);

    const filteredEvents = useMemo(() => {
        if (activeCategory === 'all') return events;

        const cat = activeCategory.toLowerCase();

        if (cat === 'services') {
            const serviceTypes = ['photography', 'catering', 'decor', 'makeup', 'planning', 'music'];
            return events.filter(e => serviceTypes.includes(e.category.toLowerCase()));
        }

        if (cat === 'experiences') {
            const experienceTypes = ['weddings', 'birthdays', 'parties', 'corporate'];
            return events.filter(e => experienceTypes.includes(e.category.toLowerCase()));
        }

        return events.filter(e => e.category.toLowerCase() === cat);
    }, [events, activeCategory]);

    const weddingVenues = useMemo(() => events.filter(e => e.category?.toLowerCase().includes('wedding')), [events]);
    const birthdayVenues = useMemo(() => events.filter(e => e.category?.toLowerCase().includes('birthday') || e.category?.toLowerCase().includes('party')), [events]);
    const corporateVenues = useMemo(() => events.filter(e => e.category?.toLowerCase().includes('corporate')), [events]);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        const email = subscribeEmail.trim();
        if (!email) {
            setSubscribeError('Please enter an email address');
            return;
        }
        if (email.length < 6) {
            setSubscribeError('Please enter at least 6 characters');
            return;
        }
        setSubscribeError('');
        setSubscribeEmail('');
        showToast('Successfully subscribed to newsletter!', 'success');
    };



    return (
        <main className="min-h-screen bg-white dark:bg-transparent aurora-bg relative transition-colors duration-300 overflow-x-hidden">
            <FallingPetals />
            <SEO title="Home" description="Find and book the perfect venue for your wedding, birthday, or corporate event with Ease2event." />
            <Hero />


            <CategorySlider />

            {activeAds.length > 0 && (
                <section className="max-w-[1536px] mx-auto px-4 md:px-8 py-8">
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                        <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                            {activeAds.map(ad => (
                                <div key={ad.id} className="min-w-full flex-shrink-0 snap-center p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6" onClick={() => api.post(`/ads/${ad.id}/click`).catch()}>
                                    <div className="space-y-4">
                                        <div className="inline-block px-3 py-1 bg-red-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                                            Sponsored
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">{ad.campaignName}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 font-medium">Discover premium exclusive offers tailored just for you.</p>
                                    </div>
                                    <Link to={`/marketplace?vendorId=${ad.vendorId}`} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg whitespace-nowrap">
                                        View Details
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            {activeCategory === 'all' ? (
                <>
                    {/* Explore Marketplace Categories */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16"
                    >
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                Whatever You're Celebrating, We Have the Perfect Space
                            </h2>
                            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-base">
                                Discover everything you need to make your next event truly unforgettable.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:grid-flow-row-dense">
                            {gridCategories.map((cat, idx) => (
                                <Link key={idx} to={`/marketplace?category=${cat.slug || cat.name.toLowerCase()}`} className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all duration-300 border border-neutral-100 dark:border-slate-800 ${cat.gridClass || 'col-span-1 h-52 sm:h-64'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-70 group-hover:opacity-90 transition-opacity"></div>
                                    <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                                        <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                                            {cat.slug ? cat.slug.toUpperCase() : 'CATEGORY'}
                                        </p>
                                        <h3 className="text-white text-lg sm:text-xl font-bold">{cat.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>

                    {/* Featured Events This Month */}
                    <section className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 gap-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Top Booked Venues This Season</h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold tracking-wide opacity-80">
                                    Real-time availability — book before someone else does.
                                </p>
                            </div>
                            <Link to="/marketplace" className="text-red-500 dark:text-white hover:text-red-600 dark:hover:text-red-400 font-black flex items-center gap-2 group text-xs sm:text-sm tracking-widest bg-red-50 dark:bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 transition-all shrink-0">
                                See More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {weddingVenues.slice(0, 3).map((item, index) => (
                                <ListingCard
                                    key={index}
                                    {...item}
                                    marketplaceStatus="AVAILABLE"
                                />
                            ))}
                        </div>
                    </section>

                    {/* Marketplace Section (KEY Tabbed Layout) */}
                    <section className="bg-white/5 backdrop-blur-lg dark:bg-slate-900/20 py-10 sm:py-16">
                        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8">

                            {/* 🔹 Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 gap-4 sm:gap-6">

                                <div className="space-y-1">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                        Plan Your Event Without Stress
                                    </h2>

                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold tracking-wide opacity-80">
                                        Real-time status tracking
                                    </p>
                                </div>

                                {/* 🔹 Tabs (FIXED) */}
                                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 max-w-full">
                                    {['All', 'Available', 'Filling', 'New'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setMarketplaceTab(tab)}
                                            className={`group relative py-2 px-3 sm:px-4 transition-all duration-300 hover:scale-105 ${marketplaceTab === tab
                                                ? 'text-gray-900 dark:text-white font-black'
                                                : 'text-gray-500 font-semibold'
                                                }`}
                                        >
                                            <span className="text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap">
                                                {tab}
                                            </span>
                                            {marketplaceTab === tab && (
                                                <motion.div
                                                    layoutId="homeMarketUnderline"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 🔹 Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {events.slice(0, 6).map((item, index) => {
                                    const status = 'AVAILABLE';
                                    const spots = undefined;

                                    return (
                                        <div
                                            key={item.id || index}
                                            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <ListingCard
                                                {...item}
                                                marketplaceStatus={status}
                                                spotsLeft={spots}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </section>

                    {/* The Process */}
                    <motion.section
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-[#FAF8F5] dark:bg-slate-900 py-16 sm:py-24 relative z-10 overflow-hidden"
                    >
                        {/* Confined Falling Leaf Effect */}
                        <div className="absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-10">
                            <FallingLeaves />
                        </div>
                        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 relative">
                            <div className="text-center mb-12 sm:mb-20 relative">
                                <p className="text-xs sm:text-sm font-bold text-[#C25844] tracking-[0.25em] mb-2 sm:mb-4 uppercase">The Process</p>
                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] dark:text-white mb-4 sm:mb-6 font-serif tracking-tight leading-[1.15]">
                                    From Idea to Celebration in 4 Simple Steps
                                </h2>
                                <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-base">
                                    Most clients go from first search to confirmed booking in under 48 hours.
                                </p>
                            </div>

                            <div className="relative max-w-[1400px] xl:max-w-[1536px] mx-auto">
                                {/* Connecting Line */}
                                <div className="hidden md:block absolute top-[40px] left-[12%] right-[12%] h-[1px] bg-[#C25844]/40 -z-10" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 relative z-10">
                                    {[
                                        {
                                            num: '01',
                                            title: 'Tell Us Your Vision',
                                            desc: 'Fill a 2-minute brief — occasion, city, guest count, budget. No sign-up required to get started.'
                                        },
                                        {
                                            num: '02',
                                            title: 'Get Curated Matches',
                                            desc: 'Our team sends you 3-5 handpicked venue and vendor proposals within 2 hours, tailored to your brief.'
                                        },
                                        {
                                            num: '03',
                                            title: 'Customise & Confirm',
                                            desc: 'Negotiate, tweak packages, do site visits — your dedicated concierge handles all back-and-forth.'
                                        },
                                        {
                                            num: '04',
                                            title: 'Celebrate Stress-Free',
                                            desc: 'On the day, our on-ground coordinator ensures everything runs perfectly. You just enjoy every moment.'
                                        }
                                    ].map((step, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.15, duration: 0.6 }}
                                            className="flex flex-col items-center text-center group"
                                        >
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF8F5] dark:bg-slate-900 border-[1.5px] border-[#C25844] rounded-full flex items-center justify-center mb-4 sm:mb-6 transition-transform duration-300 group-hover:bg-[#C25844] group-hover:text-white">
                                                <span className="text-lg sm:text-xl font-bold text-[#C25844] font-serif group-hover:text-white transition-colors">{step.num}</span>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white mb-2 sm:mb-3 font-serif transition-colors">{step.title}</h3>
                                            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed px-1 sm:px-2">
                                                {step.desc}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Comparison Table */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent my-2 opacity-50"></div>
                    <section className="bg-white dark:bg-slate-950 py-16 sm:py-24 relative z-10">
                        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 text-center mb-10 sm:mb-16">
                            <p className="text-xs sm:text-sm font-bold text-[#C25844] tracking-[0.25em] mb-2 sm:mb-4 uppercase">Why Ease2event Wins</p>
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] dark:text-white mb-4 sm:mb-6 font-serif tracking-tight">
                                How We Stack Up Against Planning on Your Own
                            </h2>
                            <p className="text-gray-600 dark:text-slate-300 text-xs sm:text-base max-w-2xl mx-auto">
                                See why 10,000+ hosts chose Ease2event over DIY or traditional planners.
                            </p>
                        </div>

                        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8">
                            <div className="overflow-x-auto rounded-2xl shadow-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-gray-200 dark:border-slate-700 custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th className="bg-[#1A1A1A] text-gray-200 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] p-4 sm:p-6 w-[35%] rounded-tl-2xl">Feature</th>
                                            <th className="bg-[#1A1A1A] text-gray-200 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] p-4 sm:p-6 text-center w-[20%]">DIY Planning</th>
                                            <th className="bg-[#1A1A1A] text-gray-200 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] p-4 sm:p-6 text-center w-[20%]">Traditional Planner</th>
                                            <th className="bg-[#C25844] text-white text-xs sm:text-sm font-bold uppercase tracking-[0.15em] p-4 sm:p-6 text-center w-[25%] rounded-tr-2xl">Ease2event ✓</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs sm:text-sm md:text-[15px] text-gray-800 dark:text-gray-200">
                                        {[
                                            { feature: 'Verified venue database', diy: 'X', trad: 'Partial', ease: '✓ 1,200+ venues' },
                                            { feature: 'Transparent pricing', diy: 'X', trad: 'X Hidden commissions', ease: '✓ All-inclusive quotes' },
                                            { feature: 'Response time', diy: 'Days of calling', trad: '1-3 business days', ease: '✓ Within 2 hours' },
                                            { feature: 'Dedicated coordinator', diy: 'X', trad: 'Sometimes', ease: '✓ Every booking' },
                                            { feature: 'Day-of on-ground support', diy: 'X', trad: 'Extra cost', ease: '✓ Included' },
                                            { feature: 'Best price guarantee', diy: 'X', trad: 'X', ease: '✓ Price-matched' },
                                        ].map((row, i) => {
                                            const renderCell = (val: string) => {
                                                if (val === 'X') return <span className="text-gray-400 dark:text-slate-500 font-bold">X</span>;
                                                if (val.startsWith('X ')) return <><span className="text-gray-400 dark:text-slate-500 font-bold mr-1">X</span> <span className="text-gray-700 dark:text-gray-300 font-semibold">{val.slice(2)}</span></>;
                                                if (val.startsWith('✓ ')) return <><span className="text-green-600 dark:text-green-500 font-bold mr-1">✓</span> <span className="text-[#C25844] dark:text-[#E07A66] font-bold">{val.slice(2)}</span></>;
                                                return <span className="text-gray-700 dark:text-slate-300 font-semibold">{val}</span>;
                                            };
                                            return (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-[#FAF8F5] dark:bg-slate-900/30' : 'bg-white dark:bg-slate-800'}>
                                                    <td className="p-4 sm:p-6 font-bold text-[#1A1A1A] dark:text-white border-b border-gray-200 dark:border-slate-700/50">{row.feature}</td>
                                                    <td className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-slate-700/50">{renderCell(row.diy)}</td>
                                                    <td className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-slate-700/50">{renderCell(row.trad)}</td>
                                                    <td className="p-4 sm:p-6 text-center bg-[#C25844]/5 border-b border-[#C25844]/10">{renderCell(row.ease)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <section id="marketplace-results" className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12">
                    <div className="mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold capitalize text-gray-900 dark:text-white">{activeCategory} </h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Discover premium listings specifically tailored for your choice.</p>
                    </div>
                    {filteredEvents.length > 0 ? (
                        <CategorySection title="" items={filteredEvents} />
                    ) : (
                        <div className="text-center py-20">
                            <Sparkles size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No listings found</h3>
                            <p className="text-gray-500 text-sm">Stay tuned! Our vendors are populating this category soon.</p>
                        </div>
                    )}
                </section>
            )}

            {/* Our Promise To You */}
            <section className="bg-white dark:bg-slate-950 py-16 sm:py-24 relative z-10 overflow-hidden border-t border-gray-100 dark:border-slate-800/50">
                {/* Confined Falling Leaf Effect */}
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-10">
                    <FallingLeaves />
                </div>
                <div className="max-w-[1700px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
                        {/* Left Side: Image with Badges */}
                        <div className="relative">
                            <div className="relative h-[360px] sm:h-[480px] lg:h-[580px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop"
                                    alt="Event Planning"
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Top Left Badge */}
                            <div className="absolute top-4 left-4 sm:top-8 sm:left-6 bg-[#C25844] text-white px-4 py-3 sm:px-6 sm:py-5 rounded-xl sm:rounded-2xl shadow-2xl z-20">
                                <div className="text-2xl sm:text-4xl font-serif font-bold mb-1 leading-none">₹0</div>
                                <div className="text-[9px] sm:text-[10px] tracking-wider uppercase opacity-90 font-medium mt-1">Hidden Fees. Ever.</div>
                            </div>

                            {/* Bottom Right Badge */}
                            <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-6 bg-white dark:bg-slate-800 px-5 py-4 sm:px-8 sm:py-6 rounded-xl sm:rounded-2xl shadow-2xl z-20 text-center border border-gray-100 dark:border-slate-700">
                                <div className="text-2xl sm:text-4xl font-serif font-bold text-[#C25844] mb-1 sm:mb-2 leading-none">98%</div>
                                <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Client Satisfaction Score</div>
                            </div>
                        </div>

                        {/* Right Side: Content */}
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-[#C25844] tracking-[0.20em] mb-2 sm:mb-4 uppercase">Our Promise To You</p>
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] dark:text-white mb-4 sm:mb-6 font-serif tracking-tight leading-[1.15]">
                                5 Reasons 10,000+ Hosts Choose Ease2event
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 mb-8 sm:mb-12 text-xs sm:text-base">
                                We're not just a venues platform. We're your personal event team.
                            </p>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="flex gap-4 sm:gap-5 group">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F5F0E6] dark:bg-slate-800 text-[#C25844] rounded-xl flex items-center justify-center flex-shrink-0 transition-transform">
                                        <CheckCircle2 size={20} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white mb-1 font-serif">Every Vendor is Personally Verified</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            We physically inspect every venue. Only 1 in 4 applicants make it onto Ease2event.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 sm:gap-5 group">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F5F0E6] dark:bg-slate-800 text-[#C25844] rounded-xl flex items-center justify-center flex-shrink-0 transition-transform">
                                        <DollarSign size={20} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white mb-1 font-serif">Price Match Guarantee</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            Found the same venue cheaper? We'll match it — no arguments, no conditions.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 sm:gap-5 group relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F5F0E6] dark:bg-slate-800 text-[#C25844] rounded-xl flex items-center justify-center flex-shrink-0 transition-transform">
                                        <Phone size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="lg:pr-12">
                                        <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white mb-1 font-serif">Concierge Available 24/7</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            Call, WhatsApp, or email — your dedicated coordinator responds within the hour.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 sm:gap-5 group">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F5F0E6] dark:bg-slate-800 text-[#C25844] rounded-xl flex items-center justify-center flex-shrink-0 transition-transform">
                                        <Shield size={20} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white mb-1 font-serif">Secure Payments & Cancellation Cover</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            All bookings are protected. 100% refund within 48 hours. Partial refunds up to 7 days before.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-[#FAF8F5] dark:bg-slate-900 py-16 sm:py-24 relative z-10 border-t border-gray-200 dark:border-slate-800">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 text-center mb-10 sm:mb-16">
                    <p className="text-xs sm:text-sm font-bold text-[#C25844] mb-2 sm:mb-4 uppercase">Got Questions?</p>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] dark:text-white mb-4 sm:mb-6 font-serif tracking-tight">
                        Everything You Need to Know Before Booking
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-base">
                        Still unsure? Chat with our team — available right now.
                    </p>
                </div>

                <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-start">
                        {faqs.map((faq, idx) => (
                            <FAQItem
                                key={idx}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFaqIdx === idx}
                                onToggle={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-[#1A1A1A] to-black overflow-hidden z-10">
                {/* Raining / Falling Flower Effect confined to this section */}
                <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60 -z-10">
                    <FallingPetals />
                </div>

                <div className="max-w-[1536px] mx-auto text-center relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-xs sm:text-sm font-bold text-[#C25844] tracking-[0.25em] mb-3 sm:mb-4 uppercase">Stay in the loop</p>
                        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white font-serif tracking-tight mb-6 sm:mb-8 leading-snug px-2">
                            Exclusive Venues. Early Access. Every Week.
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-10 mb-8 sm:mb-12">
                            <span className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm md:text-base"><Star size={16} className="text-[#D2A04A]" fill="currentColor" /> New venue alerts</span>
                            <span className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm md:text-base"><Star size={16} className="text-[#D2A04A]" fill="currentColor" /> Subscriber-only discounts</span>
                            <span className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm md:text-base"><Star size={16} className="text-[#D2A04A]" fill="currentColor" /> Expert planning tips</span>
                        </div>

                        <form className="flex flex-col md:flex-row max-w-3xl mx-auto relative mb-6 shadow-2xl gap-3 md:gap-0" onSubmit={handleSubscribe} noValidate>
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    value={subscribeEmail}
                                    onChange={(e) => {
                                        setSubscribeEmail(e.target.value);
                                        if (e.target.value) setSubscribeError('');
                                    }}
                                    required
                                    placeholder="Enter your email address"
                                    className={`w-full px-6 sm:px-8 py-4 sm:py-5 rounded-2xl md:rounded-l-2xl md:rounded-r-none border-0 bg-white/10 backdrop-blur-md text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C25844] text-sm sm:text-base transition-all`}
                                />
                                {subscribeError && (
                                    <p className="text-xs text-red-400 font-bold text-left mt-2 md:absolute md:-bottom-6 md:left-6 md:mt-0">{subscribeError}</p>
                                )}
                            </div>
                            <button className="bg-[#C25844] hover:bg-[#d86650] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl md:rounded-r-2xl md:rounded-l-none font-bold transition-colors whitespace-nowrap tracking-wide uppercase text-xs sm:text-sm flex-shrink-0 min-h-[48px] cursor-pointer">
                                JOIN 12,000+ HOSTS
                            </button>
                        </form>

                        <p className="text-gray-500 text-xs sm:text-sm tracking-wide mt-6 sm:mt-10">
                            No spam. Unsubscribe anytime. We respect your privacy.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
