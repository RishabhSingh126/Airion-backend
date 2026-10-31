import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Skeleton, SkeletonText } from '@ease2event/ui';
import { useAdminDashboard } from '../hooks/useDashboard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { data: dashboardData, isLoading: statsLoading } = useAdminDashboard();
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

    const stats = [
        { label: 'Total Revenue', value: `₹${((dashboardData?.revenue || 0) / 100000).toFixed(2)}L`, change: '+12%', icon: 'IndianRupee', color: 'emerald' },
        { label: 'Active Vendors', value: dashboardData?.vendors || 0, change: '+8%', icon: 'Store', color: 'blue' },
        { label: 'Total Users', value: dashboardData?.users || 0, change: '+24%', icon: 'Users', color: 'purple' },
        { label: 'Total Bookings', value: dashboardData?.bookings || 0, change: '+2%', icon: 'Calendar', color: 'rose' },
    ];
    
    const currentUsers = dashboardData?.users || 0;
    const currentVendors = dashboardData?.vendors || 0;
    const growthData = [
        { name: 'Jan', users: 0, vendors: 0 },
        { name: 'Feb', users: 0, vendors: 0 },
        { name: 'Mar', users: 0, vendors: 0 },
        { name: 'Apr', users: 0, vendors: 0 },
        { name: 'May', users: 0, vendors: 0 },
        { name: 'Jun', users: Math.round(currentUsers * 0.7), vendors: Math.round(currentVendors * 0.7) },
        { name: 'Current', users: currentUsers, vendors: currentVendors },
    ];
    
    const categoryData = currentVendors > 0 ? [
        { name: 'Venues', value: Math.max(1, Math.round(currentVendors * 0.4)) },
        { name: 'Catering', value: Math.max(1, Math.round(currentVendors * 0.3)) },
        { name: 'Decor', value: Math.max(1, Math.round(currentVendors * 0.2)) },
        { name: 'Photography', value: Math.max(1, Math.round(currentVendors * 0.1)) },
    ] : [];
    
    const revenueData = dashboardData?.charts?.revenue || [];

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className=" fade-in  pb-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">Dashboard</h1>
                <div className="text-xs font-medium text-[var(--ease2event-text-secondary)] bg-[var(--ease2event-bg-elevated)] px-3 py-1.5 rounded-lg border border-[var(--ease2event-border-subtle)]">Live Updates</div>
            </div>

            {/* Warning Banner for Suspicious Activity */}
            {Boolean(dashboardData?.suspiciousLogins?.length) && (
                <div className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between ">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-orange-800">Suspicious Activity Detected</h4>
                            <p className="text-xs font-medium text-orange-600 mt-0.5">{dashboardData?.suspiciousLogins?.length} security event(s) flagged.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsLogsModalOpen(true)}
                        className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        Review Logs
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card-premium h-[160px] flex flex-col justify-center gap-4">
                            <Skeleton variant="circle" width={48} height={48} />
                            <SkeletonText lines={2} />
                        </div>
                    ))
                ) : stats?.map((stat: any, idx: number) => {
                    const Icon = (Icons as any)[stat.icon] || Icons.TrendingUp;
                    return (
                        <div key={idx} className="card-premium">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                                    <Icon size={24} />
                                </div>
                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                {stat.change} <Icons.ArrowUpRight size={14} />
                            </span>
                        </div>
                        <p className="text-[var(--ease2event-text-secondary)] text-sm font-medium mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-[var(--ease2event-text-primary)] tracking-tight">{stat.value}</h3>
                    </div>
                );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 card-premium">
                    <h3 className="text-lg font-bold text-[var(--ease2event-text-primary)] mb-6">User & vendor growth</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="vendors" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-premium flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-[var(--ease2event-text-primary)] mb-6">Categories</h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {categoryData.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {categoryData.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-xs font-bold text-[var(--ease2event-text-secondary)]">
                                <div className="w-2.5 h-2.5 rounded-full " style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card-premium mb-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-[var(--ease2event-text-primary)]">Revenue overview</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Volume</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Commission</div>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(val) => `₹${val / 100000}L`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                                formatter={(val: number) => `₹${val.toLocaleString()}`}
                            />
                            <Bar dataKey="revenue" name="Total Volume" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
                            <Bar dataKey="commission" name="Commission" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-premium">
                    <h2 className="text-lg font-bold text-[var(--ease2event-text-primary)] mb-6">Pending vendors</h2>
                    <div className="space-y-4">
                        {dashboardData?.pendingApprovals?.length ? (
                            dashboardData.pendingApprovals.map((vendor, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-2xl   ">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">
                                            {vendor.businessName?.[0] || 'V'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--ease2event-text-primary)]">{vendor.businessName || 'Unnamed Vendor'}</p>
                                            <p className="text-xs text-[var(--ease2event-text-secondary)] font-medium">Pending Approval</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => navigate(`/vendors?vendorId=${vendor.id}`)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">Review</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-[var(--ease2event-text-secondary)]">No pending vendors found.</p>
                        )}
                    </div>
                </div>

                <div className="card-premium">
                    <h2 className="text-lg font-bold text-[var(--ease2event-text-primary)] mb-6">Recent activity</h2>
                    <div className="space-y-6">
                        {dashboardData?.pendingApprovals?.length ? (
                            dashboardData.pendingApprovals.slice(0, 3).map((item: any, i: number) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-indigo-50"></div>
                                        {i < 2 && <div className="w-0.5 h-full bg-[var(--ease2event-border-subtle)] my-1"></div>}
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--ease2event-text-secondary)]">
                                            <span className="font-bold text-[var(--ease2event-text-primary)]">{item.businessName || 'New Vendor'}</span> submitted verification documents
                                        </p>
                                        <p className="text-[10px] font-medium text-[var(--ease2event-text-secondary)] mt-1">Pending review</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-[var(--ease2event-text-secondary)] py-4">No recent activity logged.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="card-premium border border-orange-100 dark:border-orange-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[var(--ease2event-text-primary)] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            Suspicious Users
                        </h2>
                        <button onClick={() => navigate('/users?tab=suspicious')} className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer">View All</button>
                    </div>
                    <div className="space-y-3">
                        {dashboardData?.suspiciousLogins?.length ? (
                            dashboardData.suspiciousLogins.map((user: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl transition-colors border border-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--ease2event-text-primary)]">{user.name || user.email || 'Unknown User'}</p>
                                            <p className="text-[10px] text-[var(--ease2event-text-secondary)] font-medium">{user.reason || 'Flagged activity'} • {user.ip || 'Unknown IP'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold transition-colors">Block</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-[var(--ease2event-text-secondary)] py-4">No suspicious users detected. System status is healthy.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Logs Modal */}
            {isLogsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-200 dark:border-slate-800 w-full max-w-2xl relative p-8">
                        <button 
                            type="button" 
                            onClick={() => setIsLogsModalOpen(false)} 
                            className="absolute top-6 right-6 text-gray-400 cursor-pointer"
                        >
                            <Icons.X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Suspicious Security Logs</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Review detailed system login events flagged by intrusion detection.</p>
                        
                        <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-800">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">User</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Event</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">IP Address</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Time</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase text-right">Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {dashboardData?.suspiciousLogins?.length ? (
                                        dashboardData.suspiciousLogins.map((log: any, i: number) => (
                                            <tr key={i} className="transition-colors">
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{log.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{log.event || 'Security Notice'}</td>
                                                <td className="px-4 py-3 text-xs font-mono text-gray-700 dark:text-slate-350">{log.ip || '-'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{log.time || 'Recent'}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.riskColor || 'text-red-650 bg-red-50'}`}>
                                                        {log.risk || 'Low'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 font-medium">
                                                No suspicious security logs recorded.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setIsLogsModalOpen(false)} 
                                className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold transition-colors cursor-pointer"
                            >
                                Close Logs
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
