import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, Search, Filter, Eye, CheckCircle, XCircle, RefreshCcw, ExternalLink, X, MapPin, User, Building2, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminBookings, useUpdateBookingStatus } from '../hooks/useBookings';
import { useAdminLocations } from '../hooks/useCategories';

interface Booking {
    id: string;
    bookingCode: string;
    userName: string;
    vendorName: string;
    eventDate: string;
    city: string;
    category: string;
    amount: string;
    status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Refunded' | string;
}

const BookingDetailPanel: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => (
    <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full  flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Details</h2>
                    <p className="text-sm text-indigo-600 font-mono font-bold mt-0.5">#{booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400   rounded-xl  ">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        booking.status === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        booking.status === 'Completed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                        'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                    }`}>
                        {booking.status}
                    </span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{booking.amount}</span>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Customer', value: booking.userName, icon: User },
                        { label: 'Vendor', value: booking.vendorName, icon: Building2 },
                        { label: 'Event Date', value: new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: Calendar },
                        { label: 'City', value: booking.city || 'N/A', icon: MapPin },
                        { label: 'Category', value: booking.category || 'General', icon: Building2 },
                        { label: 'Booking ID', value: `#${booking.id.substring(0, 8).toUpperCase()}`, icon: Clock },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon size={14} className="text-indigo-500" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Status Timeline</h3>
                    {['Pending', 'Confirmed', 'Completed'].map((step, i) => {
                        const steps = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Refunded'];
                        const currentIdx = steps.indexOf(booking.status);
                        const isDone = i <= currentIdx && !['Cancelled', 'Refunded'].includes(booking.status);
                        return (
                            <div key={step} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                                    {isDone ? '✓' : i + 1}
                                </div>
                                <span className={`text-sm font-medium ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-800 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-sm">
                    Close
                </button>
                <button
                    onClick={() => { toast.success('Invoice downloaded'); onClose(); }}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm  transition-colors"
                >
                    Download Invoice
                </button>
            </div>
        </div>
    </div>
);

const Bookings: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [cityFilter, setCityFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const { data: bookingsResponse, isLoading } = useAdminBookings(page, 50);
    const updateStatusMutation = useUpdateBookingStatus();

    const bookingsData: Booking[] = bookingsResponse?.data || [];
    const totalBookings = bookingsResponse?.total || 0;

    const { data: locations = [] } = useAdminLocations();
    const locationCities = (locations || []).map((l: any) => l.city).filter(Boolean);
    const bookingCities = bookingsData.map(b => b.city).filter(Boolean);
    const uniqueCities = Array.from(new Set([...locationCities, ...bookingCities])).sort();

    const totalRevenueSum = bookingsData
        .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
        .reduce((sum, b) => {
            const num = parseFloat((b.amount || '').replace(/[^0-9.-]+/g, '')) || 0;
            return sum + num;
        }, 0);
    const revenueFormatted = totalRevenueSum >= 100000 
        ? `₹${(totalRevenueSum / 100000).toFixed(1)}L` 
        : `₹${totalRevenueSum.toLocaleString('en-IN')}`;

    const stats = [
        { label: 'Total Bookings', value: totalBookings.toString(), icon: Calendar, color: 'blue' },
        { label: 'Confirmed', value: bookingsData.filter(b => b.status === 'Confirmed').length.toString(), icon: CheckCircle, color: 'emerald' },
        { label: 'Pending Approval', value: bookingsData.filter(b => b.status === 'Pending').length.toString(), icon: Clock, color: 'amber' },
        { label: 'Revenue Generated', value: revenueFormatted, icon: DollarSign, color: 'indigo' },
    ];

    const filteredBookings = bookingsData.filter(b => {
        const matchesSearch = b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              b.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              b.id?.includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
        const matchesCity = cityFilter === 'All' || b.city === cityFilter;
        return matchesSearch && matchesStatus && matchesCity;
    });

    const getStatusStyles = (status: Booking['status']) => {
        switch (status) {
            case 'Confirmed': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
            case 'Pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
            case 'Completed': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20';
            case 'Cancelled': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20';
            case 'Refunded': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20';
            default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700';
        }
    };

    const updateStatus = async (id: string, newStatus: Booking['status']) => {
        await updateStatusMutation.mutateAsync({ id, status: newStatus });
    };

    return (
        <div className="fade-in pb-12 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">Booking Management</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl  border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                            <stat.icon size={22} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl  border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search user, vendor or booking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* City Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm">
                        <Filter size={16} className="text-gray-400 shrink-0" />
                        <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="bg-transparent outline-none cursor-pointer font-bold text-gray-900 dark:text-white"
                        >
                            <option value="All" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">All Cities</option>
                            {uniqueCities.map(city => (
                                <option key={city} value={city} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter - fixed dark mode */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm">
                        <Filter size={16} className="text-gray-400 shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none cursor-pointer font-bold text-gray-900 dark:text-white"
                        >
                            <option value="All" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">All Status</option>
                            <option value="Pending" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Pending</option>
                            <option value="Confirmed" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Confirmed</option>
                            <option value="Completed" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Completed</option>
                            <option value="Cancelled" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Cancelled</option>
                            <option value="Refunded" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Refunded</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Responsive Booking Cards Grid for Mobile/Tablet & Table for Desktop */}
            <div className="space-y-4">
                {/* Mobile / Tablet Cards View (screen < lg) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 animate-pulse h-52 flex flex-col justify-between">
                                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
                                <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                                <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                            </div>
                        ))
                    ) : filteredBookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800  flex flex-col justify-between transition-all "
                        >
                            {/* Card Header (Fixed Row) */}
                            <div>
                                <div className="flex items-center justify-between gap-2 h-7 mb-3">
                                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                        #{booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold shrink-0 ${getStatusStyles(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="text-gray-400  shrink-0 p-1 rounded-lg  "
                                            title="View Details"
                                        >
                                            <ExternalLink size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Customer & Vendor Info */}
                                <div className="space-y-1 mb-3">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 h-6">
                                        {booking.userName}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium line-clamp-1 h-4">
                                        {booking.vendorName} • {booking.category || 'Event'}
                                    </p>
                                </div>

                                {/* Metadata Row (Fixed 2-Column Grid) */}
                                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl mb-4 border border-gray-100 dark:border-slate-800/80">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 h-5">
                                        <Calendar size={13} className="text-indigo-500 shrink-0" />
                                        <span className="truncate">{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 h-5">
                                        <MapPin size={13} className="text-indigo-500 shrink-0" />
                                        <span className="truncate">{booking.city || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer (Fixed Positioned Amount & Buttons) */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-slate-800 mt-auto min-h-[44px]">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Total</p>
                                    <p className="font-black text-gray-900 dark:text-white text-base leading-none">{booking.amount}</p>
                                </div>
                                <div className="flex items-center gap-1.5 justify-end ml-auto shrink-0">
                                    {booking.status === 'Pending' && (
                                        <button
                                            onClick={() => updateStatus(booking.id, 'Confirmed')}
                                            className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600  rounded-xl transition-colors shrink-0"
                                            title="Confirm"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                    )}
                                    {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                                        <button
                                            onClick={() => updateStatus(booking.id, 'Cancelled')}
                                            className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600  rounded-xl transition-colors shrink-0"
                                            title="Cancel"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                    {booking.status === 'Cancelled' && (
                                        <button
                                            onClick={() => updateStatus(booking.id, 'Refunded')}
                                            className="w-9 h-9 flex items-center justify-center bg-purple-50 text-purple-600  rounded-xl transition-colors shrink-0"
                                            title="Process Refund"
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                    )}
                                    {/* Fixed Details Button */}
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="px-4 py-2 bg-indigo-600  text-white rounded-xl text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View (screen >= lg) */}
                <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl  border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Booking</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vendor</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Event Date</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j} className="px-5 py-4">
                                                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="  transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">#{booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{booking.category}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 group cursor-pointer">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{booking.userName}</span>
                                                <ExternalLink size={12} className="text-gray-400 group-hover:text-indigo-600" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 group cursor-pointer">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{booking.vendorName}</span>
                                                <ExternalLink size={12} className="text-gray-400 group-hover:text-indigo-600" />
                                            </div>
                                            {booking.city && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{booking.city}</div>}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300 font-medium">
                                            {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-900 dark:text-white">{booking.amount}</span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusStyles(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {booking.status === 'Pending' && (
                                                    <button onClick={() => updateStatus(booking.id, 'Confirmed')} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600  rounded-lg transition-colors" title="Confirm">
                                                        <CheckCircle size={15} />
                                                    </button>
                                                )}
                                                {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                                                    <button onClick={() => updateStatus(booking.id, 'Cancelled')} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600  rounded-lg transition-colors" title="Cancel">
                                                        <XCircle size={15} />
                                                    </button>
                                                )}
                                                {booking.status === 'Cancelled' && (
                                                    <button onClick={() => updateStatus(booking.id, 'Refunded')} className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600  rounded-lg transition-colors" title="Process Refund">
                                                        <RefreshCcw size={15} />
                                                    </button>
                                                )}
                                                {/* Primary Details button anchored right */}
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10   rounded-lg text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors shrink-0"
                                                >
                                                    Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!isLoading && filteredBookings.length === 0 && (
                    <div className="p-12 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
                        No bookings match your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalBookings > 50 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-40">
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400">Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-bold">
                        Next
                    </button>
                </div>
            )}

            {/* Booking Detail Panel */}
            {selectedBooking && (
                <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}
        </div>
    );
};

export default Bookings;
