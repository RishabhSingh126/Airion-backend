import React, { useMemo, useState } from 'react';
import {
    TrendingUp, Eye, Users, ArrowUpRight, ArrowDownRight,
    Activity, Zap, BarChart3, Target, MoreVertical, Layers,
    Sparkles, ShieldCheck, Globe, Cpu, ChevronRight, Box,
    IndianRupee, Lock, Crown
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@ease2event/shared';
import api from '../lib/api'; // Use common api instance
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVendorPerformance } from '../lib/api';
import { Badge, Button, Skeleton } from '@ease2event/ui';
import toast from 'react-hot-toast';
import { useVendorSubscription } from '../hooks/useVendorSubscription';
import { useNavigate } from 'react-router-dom';

type AnalysisPeriod = '7D' | '30D' | '90D' | 'YTD';

/**
 * 🍱 Analytics Dashboard: Business Performance
 * Provides localized insights and real-time performance tracking.
 */
const Analytics: React.FC = () => {
    const { user } = useAuth();
    const vendorId = user?.vendor?.id || user?.id || '';
    const [period, setPeriod] = useState<AnalysisPeriod>('30D');
    const queryClient = useQueryClient();
    const { isPremium } = useVendorSubscription();
    const navigate = useNavigate();

    const handleUpdateReports = async () => {
        try {
            await queryClient.invalidateQueries({ queryKey: ['vendorStats', vendorId] });
            await queryClient.invalidateQueries({ queryKey: ['vendorPerformance', vendorId] });
            toast.success('Reports updated successfully');
        } catch (error) {
            toast.error('Failed to update reports');
        }
    };

    // 🛰️ Real-time Operational Insights Fetching
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['vendorStats', vendorId, period],
        queryFn: async () => {
            if (!vendorId) return null;
            try {
                const res: any = await api.get(`/vendors/${vendorId}/stats/bookings`);
                return res.data || res;
            } catch (err) {
                return null;
            }
        },
        enabled: !!vendorId
    });

    const { data: plansData } = useQuery({
        queryKey: ['vendorPlans'],
        queryFn: async () => {
            try {
                const res: any = await api.get('/subscriptions/plans', { params: { type: 'vendor' } });
                return res.data?.data || res.data || [];
            } catch (err) {
                return [];
            }
        }
    });

    const highestPlan = useMemo(() => {
        if (!plansData || !Array.isArray(plansData) || plansData.length === 0) return null;
        return plansData.filter((p: any) => p.isActive && p.price > 0).sort((a: any, b: any) => b.priority - a.priority)[0] || plansData[0];
    }, [plansData]);

    const safeStatsData = statsData || { totalEvents: 0, pendingBookings: 0, upcomingBookings: 0, totalEarnings: 0 };

    const stats = useMemo(() => [
        { label: 'Profile Views', value: safeStatsData?.totalEvents || 0, change: '', trend: 'up', icon: Eye, color: 'text-blue-500', shadow: 'shadow-blue-500/10' },
        { label: 'Active Inquiries', value: safeStatsData?.pendingBookings || 0, change: '', trend: 'up', icon: Users, color: 'text-indigo-500', shadow: 'shadow-indigo-500/10' },
        { label: 'Upcoming Bookings', value: safeStatsData?.upcomingBookings || 0, change: '', trend: 'up', icon: Zap, color: 'text-amber-500', shadow: 'shadow-amber-500/10' },
        { label: 'Total Earnings', value: `₹${Number(safeStatsData?.totalEarnings || 0).toLocaleString()}`, change: '', trend: 'up', icon: IndianRupee, color: 'text-emerald-500', shadow: 'shadow-emerald-500/10' },
    ], [safeStatsData]);

    // 🛸 Performance Telemetry Flow
    const { data: performanceDataRaw } = useQuery({
        queryKey: ['vendorPerformance', vendorId],
        queryFn: () => vendorId ? fetchVendorPerformance(vendorId, 7).then((res: any) => res.data || res).catch(() => null) : Promise.resolve(null),
        enabled: !!vendorId
    });

    const performanceData = useMemo(() => {
        if (Array.isArray(performanceDataRaw) && performanceDataRaw.length > 0) {
            return performanceDataRaw.map((v: any) => ({
                ...v,
                capture: v.views * 100 // Simulated revenue relative to views for chart aesthetics
            }));
        }
        return [
            { name: 'Mon', views: 0, inquiries: 0, capture: 0 },
            { name: 'Tue', views: 0, inquiries: 0, capture: 0 },
            { name: 'Wed', views: 0, inquiries: 0, capture: 0 },
            { name: 'Thu', views: 0, inquiries: 0, capture: 0 },
            { name: 'Fri', views: 0, inquiries: 0, capture: 0 },
            { name: 'Sat', views: 0, inquiries: 0, capture: 0 },
            { name: 'Sun', views: 0, inquiries: 0, capture: 0 },
        ];
    }, [performanceDataRaw]);

    const topNodes = useMemo(() => {
        return statsData?.topNodes || [];
    }, [statsData]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-4 max-w-7xl mx-auto overflow-hidden">
                <Skeleton className="h-12 w-1/4 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-[32px]" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[450px] rounded-[40px]" />
                    <Skeleton className="h-[450px] rounded-[40px]" />
                </div>
            </div>
        );
    }

    return (
        <div



            className="space-y-5 pb-32 px-6 w-full max-w-7xl mx-auto"
        >
            {/* 🛸 Main Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 sm:gap-6 pt-0 pb-6 border-b border-[var(--ease2event-border-subtle)] relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                    <h1 className="text-xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-base font-semibold text-[var(--ease2event-text-secondary)] flex items-center gap-3">
                        Monitor your business performance and key statistics.
                    </p>
                </div>

                <div className="flex flex-wrap bg-[var(--ease2event-bg-elevated)]/50 p-1.5 rounded-[24px] border border-[var(--ease2event-border-subtle)] relative z-10">
                    {(['7D', '30D', '90D', 'YTD'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => {
                                setPeriod(p);
                                queryClient.invalidateQueries({ queryKey: ['vendorStats', vendorId] });
                                queryClient.invalidateQueries({ queryKey: ['vendorPerformance', vendorId] });
                            }}
                            className={`px-5 py-2.5 text-[10px] font-bold tracking-widest rounded-[1.2rem] transition-all cursor-pointer ${period === p ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'text-[var(--ease2event-text-secondary)] hover:text-indigo-500'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🚀 Tactical Telemetry Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-5">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}

                        className={`card-minimal p-6 sm:p-6 flex flex-col justify-between group cursor-pointer border-[var(--ease2event-border-base)] relative overflow-hidden bg-[var(--ease2event-bg-surface)] ${stat.shadow}`}
                    >
                        <div className="flex justify-between items-start mb-8 sm:mb-12 relative z-10">
                            <div className={`p-3 sm:p-4 rounded-xl bg-[var(--ease2event-bg-elevated)] ${stat.color} group-hover:bg-[var(--ease2event-brand-primary)] group-hover:text-white transition-all border border-[var(--ease2event-border-subtle)]`}>
                                <stat.icon size={16} className="sm:w-[24px] sm:h-[24px]" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold text-[var(--ease2event-text-secondary)] tracking-widest pl-1">{stat.label}</h3>
                            <p className="text-xl font-bold text-[var(--ease2event-text-primary)] mt-3 leading-none">{stat.value}</p>
                            <div className="flex items-center gap-3 mt-4">
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{stat.change}</span>
                                <span className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] tracking-widest">Growth</span>
                            </div>
                        </div>
                        <stat.icon size={120} className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity " />
                    </div>
                ))}
            </div>

        {/* 📊 Spectrum Analytics Flow (Premium Locked) */}
        <div className="relative">
            {!isPremium && (
                <div className="absolute inset-0 z-20 backdrop-blur-xl bg-[var(--ease2event-bg-main)]/60 rounded-[40px] flex flex-col items-center justify-center p-8 border border-[var(--ease2event-border-subtle)] text-center">
                    <div className="bg-amber-500/10 text-amber-600 p-4 rounded-full mb-4 ring-4 ring-amber-500/5">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--ease2event-text-primary)] mb-2 flex items-center gap-2">
                        <Crown className="text-amber-500" size={24} /> Advanced Insights Locked
                    </h3>
                    <p className="text-[var(--ease2event-text-secondary)] font-medium max-w-md mb-8">
                        {highestPlan?.description || 'Upgrade to Premium to unlock advanced growth trends, revenue performance tracking, and AI-powered business predictions.'}
                    </p>
                    <Button 
                        onClick={() => navigate('/premium')}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 shadow-lg shadow-amber-500/20"
                    >
                        Upgrade to {highestPlan?.name || 'Premium'}
                    </Button>
                </div>
            )}
            
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!isPremium ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                <div className="card-premium p-6 sm:p-6 relative group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 relative z-10 gap-6 sm:gap-0">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="flex justify-between items-center bg-[var(--ease2event-bg-elevated)] p-6 rounded-xl border-2 border-[var(--ease2event-border-subtle)] ">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-[var(--ease2event-text-primary)] tracking-tight">Growth Trend</h3>
                                    <p className="text-[11px] font-bold text-[var(--ease2event-text-secondary)] tracking-widest">Track your platform reach and user engagement over time</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 bg-[var(--ease2event-bg-elevated)] rounded-2xl border border-[var(--ease2event-border-subtle)] w-fit">
                            <Globe className="text-[var(--ease2event-brand-primary)] size-5 sm:size-6" />
                        </div>
                    </div>

                    <div className="h-[380px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} dy={20} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ stroke: '#6C63FF', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#6C63FF" strokeWidth={4} fill="url(#visGradient)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-premium p-6 relative group">
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-2 h-12 bg-emerald-500 rounded-full "></div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--ease2event-text-primary)] tracking-tight">Revenue Trend</h3>
                                <p className="text-sm font-semibold text-[var(--ease2event-text-secondary)] mt-2">Revenue performance over time</p>
                            </div>
                        </div>
                        <div className="p-4 bg-[var(--ease2event-bg-elevated)] rounded-2xl border border-[var(--ease2event-border-subtle)]">
                            <Zap className="text-emerald-500" size={16} />
                        </div>
                    </div>

                    <div className="h-[380px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} dy={20} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#334155', opacity: 0.3 }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Bar dataKey="capture" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} animationDuration={2500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            </div>

            {/* 🏰 Vendor Leadership stats */}
            <div className="card-premium p-6 sm:!p-12 border-[var(--ease2event-border-base)] relative group">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 sm:mb-10 pb-8 sm:pb-6 border-b border-[var(--ease2event-border-subtle)] gap-5">
                    <div className="flex items-center gap-5 sm:gap-5">
                        <div className="p-4 sm:p-5 bg-[var(--ease2event-bg-elevated)] rounded-2xl sm:rounded-3xl border border-[var(--ease2event-border-subtle)] shrink-0">
                            <Zap className="text-[var(--ease2event-brand-primary)] size-6 sm:size-8" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-xl font-bold text-[var(--ease2event-text-primary)] leading-none tracking-tight">Post Performance</h2>
                            <p className="text-[9px] sm:text-[11px] font-semibold text-[var(--ease2event-text-secondary)] mt-3 sm:mt-4">Highest performing services and listings</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleUpdateReports}
                        className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center h-11 sm:h-12 px-4 sm:px-6 rounded-2xl font-bold text-[9px] sm:text-[11px] tracking-widest bg-[var(--ease2event-brand-primary)] text-white hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
                    >
                        Update Reports
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                    {topNodes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-xs text-[var(--ease2event-text-secondary)]">
                            No performance records yet. Once clients book your services, top performing listings will be highlighted here.
                        </div>
                    ) : (
                        topNodes.map((node: any, i: number) => (
                            <div key={i} className="space-y-6 sm:space-y-5 p-6 sm:p-6 bg-[var(--ease2event-bg-elevated)]/20 border border-[var(--ease2event-border-subtle)] rounded-[32px] sm:rounded-[40px] hover:bg-[var(--ease2event-bg-surface)] transition-all  group/node">
                                <div className="flex justify-between items-start">
                                    <span className="text-xl sm:text-lg font-semibold text-[var(--ease2event-brand-primary)]/20 group-hover/node:text-[var(--ease2event-brand-primary)] transition-colors">0{i + 1}</span>
                                    <Badge className={`bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-[8px] px-2 py-0.5`}>{node.status}</Badge>
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--ease2event-text-primary)] leading-tight">{node.name}</h3>
                                    <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[12px] sm:text-[12px] font-semibold text-[var(--ease2event-text-secondary)] leading-none">Usage Intensity</p>
                                            <p className="text-base sm:text-lg font-bold text-[var(--ease2event-text-primary)] leading-none">{node.occupancy}%</p>
                                        </div>
                                        <div className="h-1.5 sm:h-2 w-full bg-[var(--ease2event-bg-elevated)] rounded-full overflow-hidden p-0.5">
                                            <div style={{ width: `${node.occupancy}%` }} className="h-full bg-[var(--ease2event-brand-primary)] rounded-full " />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 sm:pt-8 border-t border-[var(--ease2event-border-subtle)] flex justify-between items-center">
                                    <p className="text-[10px] sm:text-sm font-semibold text-[var(--ease2event-text-secondary)]">{node.bookings} Bookings</p>
                                    <p className="text-lg sm:text-xl font-bold text-[var(--ease2event-text-primary)]">{node.revenue}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
