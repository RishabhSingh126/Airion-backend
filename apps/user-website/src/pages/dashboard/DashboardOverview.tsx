import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { userDashboard } from '@shared/auth/api';
import { Calendar, Clock, CreditCard, ArrowRight, Plus, MapPin, Heart, Star, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@shared/auth';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="h-16 w-1/3 bg-neutral-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-neutral-200 dark:bg-slate-800 rounded-[2rem]" />)}
        </div>
        <div className="h-44 w-full bg-neutral-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-neutral-200 dark:bg-slate-800 rounded-[2rem]" />
            <div className="h-96 bg-neutral-200 dark:bg-slate-800 rounded-2xl" />
        </div>
    </div>
);

const DashboardOverview: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [savedVendors, setSavedVendors] = useState<string[]>([]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['user-dashboard-overview'],
        queryFn: () => userDashboard.getOverview(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    useEffect(() => {
        if (data?.deals?.length) {
            const interval = setInterval(() => setCurrentBanner(b => (b + 1) % data.deals.length), 5000);
            return () => clearInterval(interval);
        }
    }, [data?.deals]);

    if (isLoading) return <DashboardSkeleton />;
    if (error) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full text-red-500">
                <Zap size={32} />
            </div>
            <h2 className="text-xl font-bold">Failed to synchronize dashboard</h2>
            <p className="text-neutral-500">Please check your connection and try again.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold">Retry Sync</button>
        </div>
    );

    const { stats, recentBookings, trendingVendors, deals } = data;
    const firstName = user?.name?.split(' ')[0] || 'Member';

    // Budget allocation: spent vs remaining target
    const chartData = [
        { name: 'Spent', value: stats.budgetSpent },
        { name: 'Available', value: Math.max(500000 - stats.budgetSpent, 0) }
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* ⚡ High-Fidelity Header */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-2 sm:pt-4 pb-2 sm:pb-4 border-b border-[var(--ease2event-border-subtle)]/50 sm:border-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div><span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black tracking-widest rounded-full border border-red-500/20">Dashboard v2.0</span> </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Welcome to Ease2event, {firstName}
                        </h1>
                        <p className="text-s sm:text-base text-neutral-500 dark:text-slate-400 font-medium tracking-tight">Managing your events in real time</p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-3 px-6 py-4 bg-red-500 text-white rounded-2xl shadow-2xl shadow-red-500/40 font-black text-sm hover:bg-black transition-all group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Explore more
                    </Link>
                </motion.div>
            </header>

            {/* 💎 Global Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, bg: 'bg-blue-500/10', text: 'text-blue-500', link: '/dashboard/bookings' },
                    { title: 'Total Spent', value: `₹${stats.budgetSpent.toLocaleString()}`, icon: CreditCard, bg: 'bg-emerald-500/10', text: 'text-emerald-500', link: '/dashboard/budget' },
                    { title: 'Notifications', value: stats.pendingTasks, icon: TrendingUp, bg: 'bg-amber-500/10', text: 'text-amber-500', link: '/dashboard/bookings' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link
                            to={stat.link}
                            className="p-8 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-between group  hover:scale-[1.02] transition-all border-b-4 border-b-transparent  overflow-hidden relative"
                        >
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-neutral-600 dark:text-slate-500 mb-2">{stat.title}</p>
                                <h3 className="text-4xl font-black text-neutral-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:rotate-12 ${stat.bg} ${stat.text}`}>
                                <stat.icon size={32} />
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* 🎪 Real-Time Deals Slider */}
            {deals.length > 0 && (
                <section className="relative h-56 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <img src={deals[currentBanner].image} alt={deals[currentBanner].title} className="w-full h-full object-cover grayscale-[0.2] dark:grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/20 to-transparent dark:from-neutral-950 dark:via-neutral-950/40 dark:to-transparent" />
                            <div className="absolute inset-0 p-10 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-red-400 text-[10px] font-black tracking-widest mb-2">
                                    <Zap size={14} fill="currentColor" />
                                    {deals[currentBanner].subtitle}
                                </div>
                                <h3 className="text-neutral-900 dark:text-white text-3xl font-black max-w-[400px] leading-tight mb-6">{deals[currentBanner].title}</h3>
                                <Link to={deals[currentBanner].link} className="w-fit bg-red-500 text-white hover:bg-black dark:hover:bg-white dark:hover:text-black text-xs font-black px-8 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-xl">
                                    VIEW MORE <ChevronRight size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    <div className="absolute bottom-6 right-8 flex gap-2">
                        {deals.map((_, i) => (
                            <button key={i} onClick={() => setCurrentBanner(i)} className={`h-2 rounded-full transition-all duration-500 ${i === currentBanner ? 'w-10 bg-red-500' : 'w-2 bg-white/30'}`} />
                        ))}
                    </div>
                </section>
            )}

            {/* 📊 Main Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Booking Nodes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Active Bookings</h2>
                        <Link to="/dashboard/bookings" className="text-xs font-black text-red-500 hover:tracking-widest transition-all flex items-center gap-2">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentBookings.length > 0 ? recentBookings.map((booking: any) => (
                            <motion.div
                                key={booking.id}
                                className="bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-800 rounded-[2.5rem] p-6 flex flex-col sm:flex-row gap-8 transition-all group relative overflow-hidden"
                            >
                                <div className="w-full sm:w-40 sm:h-40 aspect-square rounded-[2rem] overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-slate-800 shadow-xl relative">
                                    <img src={booking.imageUrl} alt={booking.vendorName} className="w-full h-full object-cover transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/10 transition-colors" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-2">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <span className="text-[10px] font-black text-red-500 tracking-[0.2em] bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">{booking.category}</span>
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white rounded-full font-black text-[9px] tracking-widest border border-neutral-200 dark:border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {booking.status}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-neutral-900 dark:text-white truncate tracking-tighter">{booking.vendorName}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-slate-500">
                                            <MapPin size={16} className="text-red-500" />
                                            <span>{booking.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-dashed border-neutral-200 dark:border-slate-800 pt-6 mt-6">
                                        <div className="flex items-center gap-4 text-xs font-black text-neutral-600 dark:text-slate-400 tracking-tight">
                                            <div className="flex items-center gap-2"><Calendar size={16} className="text-red-500" /> {booking.date}</div>
                                            <div className="w-1 h-1 bg-neutral-300 rounded-full" />
                                            <div className="flex items-center gap-2"><Clock size={16} className="text-red-500" /> {booking.time}</div>
                                        </div>
                                        <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">₹{booking.price.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
                            </motion.div>
                        )) : (
                            <div className="bg-neutral-50 dark:bg-slate-900/50 border-2 border-dashed border-neutral-200 dark:border-slate-800 p-12 rounded-[2.5rem] text-center space-y-6">
                                <div className="w-20 h-20 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                    <Zap size={32} className="text-neutral-300 dark:text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-neutral-900 dark:text-white">No active deployments found.</p>
                                    <p className="text-neutral-500 font-medium">Your event registry is currently empty.</p>
                                </div>
                                <Link to="/marketplace" className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-2xl font-black text-xs hover:bg-black shadow-xl transition-all">
                                    Browse Services
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Economic Matrix (Budget) */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Budget Overview</h2>
                    <div className="bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center relative overflow-hidden group shadow-xl">
                        <div className="h-56 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="none" paddingAngle={5}>
                                        {chartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f1f5f9'} className="dark:fill-slate-800" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-neutral-400 tracking-widest">Utilized</span>
                                <span className="text-3xl font-black text-neutral-900 dark:text-white">{Math.round((stats.budgetSpent / 500000) * 100)}%</span>
                            </div>
                        </div>
                        <div className="text-center mt-6 space-y-1 z-10">
                            <p className="text-[10px] font-black text-neutral-600 dark:text-slate-500 tracking-widest">Capital Reserved</p>
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-white">₹{(500000 - stats.budgetSpent).toLocaleString()}</h3>
                            <p className="text-xs text-neutral-500 font-bold tracking-tighter">of ₹5,00,000 threshold</p>
                        </div>
                        <Link to="/dashboard/budget" className="w-full py-4 mt-6 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-black text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-widest relative z-10">
                            Budget Analytics <ArrowRight size={16} />
                        </Link>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>

            {/* 🔥 High-Value Recommendations */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">More Options 🔥</h2>
                    <Link to="/marketplace" className="text-xs font-black text-red-500 hover:tracking-widest transition-all flex items-center gap-2">
                        Expand Results <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 -mx-2 px-2">
                    {trendingVendors.map((vendor: any) => (
                        <motion.div
                            key={vendor.id}
                            className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-neutral-300 dark:border-slate-800 shadow-xl group cursor-pointer"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 transition-opacity" />
                                <div className="absolute top-5 left-5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-1.5 rounded-full text-[9px] font-black text-neutral-900 dark:text-white tracking-widest shadow-xl border border-white/20">
                                    {vendor.category}
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); setSavedVendors(prev => prev.includes(vendor.id) ? prev.filter(v => v !== vendor.id) : [...prev, vendor.id]); }}
                                    className="absolute top-5 right-5 w-10 h-10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-xl border border-white/20"
                                >
                                    <Heart size={18} className={savedVendors.includes(vendor.id) ? 'fill-red-500 text-red-500' : 'text-neutral-400'} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-neutral-900 dark:text-white text-lg truncate flex-1 pr-3 tracking-tight">{vendor.name}</h3>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-400/10 text-amber-500 rounded-lg border border-amber-400/20">
                                            <Star size={12} fill="currentColor" />
                                            <span className="text-[10px] font-black">{vendor.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 flex items-center gap-2">
                                        <MapPin size={14} className="text-red-500" />{vendor.location}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <span className="block text-[9px] font-black text-neutral-600 tracking-widest">Base Rate</span>
                                        <span className="text-xl font-black text-neutral-900 dark:text-white">{vendor.price}</span>
                                    </div>
                                    <Link to={`/event/${vendor.id}`} className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-red-500 hover:text-white text-[10px] font-black px-6 py-3 rounded-xl transition-all shadow-xl tracking-widest">
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 💳 Capital Elasticity (EMI) */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-300 dark:border-none rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
            >
                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/40">
                            <CreditCard size={24} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter ">Flexible Payment System</h3>
                    </div>
                    <p className="text-neutral-400 font-medium max-w-md">Manage event payments easily with flexible monthly plans and no upfront payment for verified users.</p>
                </div>
                <Link
                    to="/dashboard/budget"
                    className="relative z-10 whitespace-nowrap text-sm font-black tracking-[0.1em] text-red-500 dark:text-white hover:text-red-600 dark:hover:text-red-500 border-b-2 border-transparent  transition-all pb-1"
                >
                    Verify Eligibility
                </Link>
                {theme === 'dark' && (
                    <>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500 opacity-[0.03] blur-[120px] -mr-40 -mt-20 pointer-events-none" />
                        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-blue-500 opacity-[0.02] blur-[100px] -ml-20 -mb-20 pointer-events-none" />
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default DashboardOverview;

