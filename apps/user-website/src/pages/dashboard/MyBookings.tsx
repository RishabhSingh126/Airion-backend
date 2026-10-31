import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Search, Filter, ChevronRight, FileText, Star,
    X, AlertTriangle, CheckCircle, RefreshCw, Phone, Clock
} from 'lucide-react';

import { fetchMyBookings } from '../../lib/api';
import ReviewModal from '../../components/ReviewModal';
import toast from 'react-hot-toast';

/* ─── Refund Modal ─── */
const RefundModal: React.FC<{
    booking: any;
    loading: boolean;
    onClose: () => void;
    onSubmit: (details: { bank: string; ifsc: string; account: string }) => void;
}> = ({ booking, loading, onClose, onSubmit }) => {
    const [bank, setBank] = React.useState('');
    const [ifsc, setIfsc] = React.useState('');
    const [account, setAccount] = React.useState('');
    const [agreed, setAgreed] = React.useState(false);
    const refundAmount = (parseFloat(booking.totalAmount) * 0.8).toLocaleString();

    return (
        <>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-purple-50 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                    <RefreshCw size={20} className="text-purple-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white">Request Refund</h3>
                    <p className="text-sm text-neutral-500">#{booking.bookingCode}</p>
                </div>
                <button onClick={onClose} className="ml-auto text-neutral-400 hover:text-neutral-700"><X size={20} /></button>
            </div>

            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 mb-5">
                <p className="text-sm text-purple-700 dark:text-purple-300 font-bold">Refund Amount</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">₹{refundAmount}</p>
                <p className="text-xs text-purple-500 mt-1">80% of ₹{parseFloat(booking.totalAmount).toLocaleString()} (20% cancellation fee applies)</p>
            </div>

            <div className="space-y-3 mb-5">
                {[
                    { label: 'Bank Name', value: bank, set: setBank, placeholder: 'e.g. State Bank of India' },
                    { label: 'Account Number', value: account, set: setAccount, placeholder: 'Enter account number' },
                    { label: 'IFSC Code', value: ifsc, set: setIfsc, placeholder: 'e.g. SBIN0001234' },
                ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">{label}</label>
                        <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                ))}
            </div>

            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    <strong>Terms & Conditions:</strong> Refunds are processed within 5–7 business days. The 20% cancellation fee is non-refundable. Ensure bank details are correct — Ease2Event is not liable for transfer errors due to incorrect details.
                </p>
            </div>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-purple-600 w-4 h-4" />
                <span className="text-xs text-neutral-600 dark:text-slate-400 font-medium">I agree to the refund terms and confirm the bank details provided are correct.</span>
            </label>

            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border-2 border-neutral-200 dark:border-slate-700 rounded-xl font-bold text-sm text-neutral-700 dark:text-slate-300">Cancel</button>
                <button
                    onClick={() => onSubmit({ bank, ifsc, account })}
                    disabled={!agreed || !bank || !account || !ifsc || loading}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Refund Request'}
                </button>
            </div>
        </>
    );
};


const MyBookings: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [reviewModalBooking, setReviewModalBooking] = useState<any | null>(null);
    const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
    const [refundModalBooking, setRefundModalBooking] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const navigate = useNavigate();

    const tabs = ['All', 'Upcoming', 'Pending', 'Completed', 'Cancelled'];

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const data = await fetchMyBookings();
                setBookings(Array.isArray(data) ? data : []);
            } catch {
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        loadBookings();
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', label: 'Upcoming' };
            case 'pending': return { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending Payment' };
            case 'completed': return { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', label: 'Completed' };
            case 'cancelled': return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' };
            case 'refunded': return { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', label: 'Refunded' };
            default: return { bg: 'bg-neutral-100 dark:bg-slate-800', text: 'text-neutral-700 dark:text-slate-300', label: status };
        }
    };

    const handleDownloadInvoice = (booking: any) => {
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html><head><title>Invoice - ${booking.bookingCode}</title>
            <style>
                body{font-family:system-ui,sans-serif;padding:40px;color:#111}
                .logo{font-size:22px;font-weight:900;color:#dc2626}
                table{width:100%;border-collapse:collapse;margin:24px 0}
                th{background:#f9fafb;padding:12px;font-size:11px;text-align:left;color:#6b7280;text-transform:uppercase}
                td{padding:12px;border-bottom:1px solid #f3f4f6}
                .footer{margin-top:40px;color:#9ca3af;font-size:12px;text-align:center}
            </style></head>
            <body>
            <div style="display:flex;justify-content:space-between;border-bottom:2px solid #f3f4f6;padding-bottom:20px;margin-bottom:32px">
                <div class="logo">Ease2Event</div>
                <div><h1 style="margin:0;font-size:28px;font-weight:900">INVOICE</h1><p style="color:#6b7280;margin:4px 0">#${booking.bookingCode}</p></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px">
                <div><p style="font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase">Vendor</p><p style="font-weight:700">${booking.vendor?.businessName}</p><p style="color:#6b7280">${booking.vendor?.city}, India</p></div>
                <div><p style="font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase">Date</p><p style="font-weight:700">${new Date(booking.eventDate).toLocaleDateString()}</p><p style="color:#6b7280;text-transform:capitalize">${booking.status}</p></div>
            </div>
            <table><thead><tr><th>Description</th><th>Date</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody><tr><td>Reservation – ${booking.vendor?.businessName}</td><td>${new Date(booking.eventDate).toLocaleDateString()}</td><td style="text-transform:capitalize">${booking.status}</td><td style="text-align:right;font-weight:700">₹${parseFloat(booking.totalAmount).toLocaleString()}</td></tr></tbody></table>
            <div style="text-align:right"><p style="font-size:20px;font-weight:900;color:#dc2626">Total: ₹${parseFloat(booking.totalAmount).toLocaleString()}</p></div>
            <div class="footer"><p>Thank you for choosing Ease2Event.</p><p>This is a computer-generated invoice.</p></div>
            <script>window.onload=()=>window.print();</script>
            </body></html>
        `);
        win.document.close();
    };

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) { return; }
        setCancelLoading(true);
        try {
            // In production: await cancelBooking(cancelModalBooking.id, cancelReason);
            await new Promise(r => setTimeout(r, 1200));
            setBookings(prev => prev.map(b =>
                b.id === cancelModalBooking.id ? { ...b, status: 'cancelled', refundStatus: 'processing' } : b
            ));
            setCancelModalBooking(null);
            setCancelReason('');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleRefundRequest = async (accountDetails: { bank: string; ifsc: string; account: string }) => {
        setRefundLoading(true);
        try {
            await new Promise(r => setTimeout(r, 1200));
            setBookings(prev => prev.map(b =>
                b.id === refundModalBooking.id ? { ...b, refundStatus: 'processing' } : b
            ));
            setRefundModalBooking(null);
            toast.success('Refund request submitted! Will be processed in 5–7 business days.');
        } finally {
            setRefundLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesTab = activeTab === 'All' ? true :
            activeTab === 'Upcoming' ? b.status === 'confirmed' :
            b.status.toLowerCase() === activeTab.toLowerCase();
        const matchesSearch = !searchQuery || b.bookingCode?.toLowerCase().includes(searchQuery.toLowerCase()) || b.vendor?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">My Bookings</h1>
                    <p className="text-neutral-500 dark:text-slate-400 font-medium">Manage your event reservations and invoices.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by ID or vendor..."
                        className="w-full pl-11 pr-4 py-3 border border-neutral-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none text-sm font-semibold text-neutral-900 dark:text-white shadow-sm"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-neutral-200 dark:border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                            : 'bg-transparent text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Booking Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredBookings.length > 0 ? filteredBookings.map(booking => {
                        const style = getStatusStyles(booking.status);
                        const canCancel = ['confirmed', 'pending'].includes(booking.status);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                key={booking.id}
                                className="bg-white dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 shadow-sm border border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:gap-5 h-full min-h-[210px]"
                            >
                                {/* Left Side: Venue Image */}
                                <div className="sm:w-40 h-40 sm:h-auto rounded-2xl overflow-hidden shrink-0 relative cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                                    <img src={booking.vendor?.portfolioImages?.[0]} alt="Venue" className="w-full h-full object-cover" />
                                    <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg.split(' ')[0]} ${style.text.split(' ')[0]}`}>
                                        {style.label}
                                    </div>
                                </div>

                                {/* Right Side: Card Content */}
                                <div className="flex-1 py-0.5 flex flex-col justify-between overflow-hidden">
                                    <div>
                                        {/* Top Row: Code & Details Button */}
                                        <div className="flex justify-between items-center mb-1 gap-2 h-8">
                                            <p className="text-xs font-mono font-bold text-neutral-400 tracking-wider">#{booking.bookingCode}</p>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedBooking(booking); }}
                                                className="px-4 sm:px-5 h-8 flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-red-600 hover:text-white rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
                                            >
                                                Details
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mb-2 line-clamp-1">{booking.vendor?.businessName}</h3>

                                        {/* Date & Location Grid */}
                                        <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-slate-400 font-medium mb-3 h-5">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Calendar size={14} className="text-red-500" />
                                                <span>{new Date(booking.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <MapPin size={14} className="text-red-500 shrink-0" />
                                                <span className="truncate">{booking.vendor?.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Fixed Alignment Total & Buttons */}
                                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-slate-800/80 mt-auto min-h-[46px]">
                                        <div className="shrink-0">
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">TOTAL</p>
                                            <p className="font-black text-neutral-900 dark:text-white text-base sm:text-lg leading-none">₹{parseFloat(booking.totalAmount).toLocaleString()}</p>
                                        </div>

                                        {/* Fixed Action Container */}
                                        <div className="flex items-center gap-1.5 justify-end ml-auto shrink-0">
                                            {/* Download Invoice Icon */}
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDownloadInvoice(booking); }}
                                                title="Download Invoice"
                                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
                                            >
                                                <FileText size={15} />
                                            </button>

                                            {/* Cancel Icon */}
                                            {canCancel && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setCancelModalBooking(booking); }}
                                                    title="Cancel Booking"
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-red-200 dark:border-red-500/30 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}

                                            {/* Review Star Icon */}
                                            {booking.status === 'completed' && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setReviewModalBooking(booking); }}
                                                    title="Leave a Review"
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <Star size={15} className="fill-amber-400 text-amber-400" />
                                                </button>
                                            )}

                                            {/* Refund Icon Button */}
                                            {booking.status === 'cancelled' && !booking.refundStatus && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setRefundModalBooking(booking); }}
                                                    title="Request Refund"
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                            {booking.status === 'cancelled' && booking.refundStatus && (
                                                <div
                                                    title={booking.refundStatus === 'processing' ? 'Refund Processing' : 'Refunded'}
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"
                                                >
                                                    <RefreshCw size={14} />
                                                </div>
                                            )}


                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800/30 rounded-3xl border border-dashed border-neutral-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                                <Filter size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No {activeTab.toLowerCase()} bookings</h3>
                            <p className="text-neutral-500 font-medium">You don't have any bookings matching this status.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-200 dark:border-slate-800"
                        >
                            <div className="h-52 relative">
                                <img src={selectedBooking.vendor?.portfolioImages?.[0]} alt="Vendor" className="w-full h-full object-cover" />
                                <button onClick={() => setSelectedBooking(null)}
                                    className="absolute top-5 right-5 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                                    <h2 className="text-2xl font-black text-white">{selectedBooking.vendor?.businessName}</h2>
                                    <p className="text-white/70 font-medium flex items-center gap-2 mt-1"><MapPin size={14} className="text-red-400" />{selectedBooking.vendor?.city}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                                    {[
                                        { label: 'Booking ID', value: `#${selectedBooking.bookingCode}` },
                                        { label: 'Event Date', value: new Date(selectedBooking.eventDate).toLocaleDateString() },
                                        { label: 'Status', value: getStatusStyles(selectedBooking.status).label, color: getStatusStyles(selectedBooking.status).text },
                                        { label: 'Amount', value: `₹${parseFloat(selectedBooking.totalAmount).toLocaleString()}`, color: 'text-red-500' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="space-y-1">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
                                            <p className={`font-bold text-neutral-900 dark:text-white text-sm ${color || ''}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-5 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl border border-neutral-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Service Overview</p>
                                    <p className="text-sm text-neutral-600 dark:text-slate-400 leading-relaxed">
                                        You have a {selectedBooking.status} reservation with {selectedBooking.vendor?.businessName} for {new Date(selectedBooking.eventDate).toLocaleDateString()}.
                                        Our team will ensure all logistics are perfectly aligned for your event.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleDownloadInvoice(selectedBooking)}
                                        className="flex-1 py-4 bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18} /> Download Invoice
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBooking(null); navigate('/dashboard/inbox'); }}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-all shadow-xl shadow-red-500/20"
                                    >
                                        Contact Vendor
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cancel Modal */}
            <AnimatePresence>
                {cancelModalBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setCancelModalBooking(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-slate-800 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-white">Cancel Booking?</h3>
                                    <p className="text-sm text-neutral-500">#{cancelModalBooking.bookingCode}</p>
                                </div>
                                <button onClick={() => setCancelModalBooking(null)} className="ml-auto text-neutral-400 hover:text-neutral-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 mb-6">
                                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                    A refund of <span className="font-black">₹{(parseFloat(cancelModalBooking.totalAmount) * 0.8).toLocaleString()}</span> (80%) will be processed within 5–7 business days.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Reason for Cancellation *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    placeholder="Please share why you're cancelling..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setCancelModalBooking(null)}
                                    className="flex-1 py-3 border-2 border-neutral-200 dark:border-slate-700 rounded-xl font-bold text-sm text-neutral-700 dark:text-slate-300">
                                    Keep Booking
                                </button>
                                <button
                                    onClick={handleCancelBooking}
                                    disabled={!cancelReason.trim() || cancelLoading}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {reviewModalBooking && (
                <ReviewModal
                    isOpen={!!reviewModalBooking}
                    bookingId={reviewModalBooking.id}
                    vendorName={reviewModalBooking.vendor?.businessName || 'this vendor'}
                    onClose={() => setReviewModalBooking(null)}
                    onSuccess={() => setReviewModalBooking(null)}
                />
            )}

            {/* Refund Request Modal */}
            <AnimatePresence>
                {refundModalBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setRefundModalBooking(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 p-8"
                        >
                            <RefundModal
                                booking={refundModalBooking}
                                loading={refundLoading}
                                onClose={() => setRefundModalBooking(null)}
                                onSubmit={handleRefundRequest}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyBookings;
