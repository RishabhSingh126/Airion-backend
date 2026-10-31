import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, Clock, MapPin, Users, MoreVertical, PlusCircle, Target, Activity } from 'lucide-react';
import { Button, Badge, Skeleton, Modal, notify } from '@ease2event/ui';
import { useAuth } from '@ease2event/shared';
import { bookingService } from '@ease2event/shared/lib/services/bookingService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVendorSchedule, blockDate, unblockDate } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🗓 Calendar
 * Modernized with theme-aware tokens, large typography, and premium glassmorphism.
 */
const CalendarPage: React.FC = () => {
 const { user } = useAuth();
 const vendorId = user?.vendor?.id || user?.id || '';
 const [currentDate, setCurrentDate] = useState(new Date());
 const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
 const [activeView, setActiveView] = useState('portal');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [blockReason, setBlockReason] = useState('');
 const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
 
 useEffect(() => {
 const closeMenu = () => setActiveMenuId(null);
 document.addEventListener('click', closeMenu);
 return () => document.removeEventListener('click', closeMenu);
 }, []);

 const queryClient = useQueryClient();

 const { data: bookings, isLoading: bookingsLoading } = useQuery({
 queryKey: ['vendor-bookings-calendar', vendorId],
 queryFn: () => vendorId ? bookingService.getVendorBookings().catch(() => null) : Promise.resolve(null),
 enabled: !!vendorId
 });

 const { data: availabilityBlocks, isLoading: availabilityLoading } = useQuery({
 queryKey: ['vendor-availability', vendorId],
 queryFn: () => vendorId ? fetchVendorSchedule(vendorId) : Promise.resolve(null),
 enabled: !!vendorId
 });

  const displayBookings = (bookings && bookings.length > 0) ? bookings : [];

  const displayBlocks = (Array.isArray(availabilityBlocks) && availabilityBlocks.length > 0) ? availabilityBlocks : [];

 const isLoading = bookingsLoading || availabilityLoading;

 const blockMutation = useMutation({
 mutationFn: (d: {date: string, reason: string}) => blockDate(d.date, d.reason),
 onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['vendor-availability'] });
   setIsModalOpen(false);
   notify.success('Calendar updated successfully!');
 },
 onError: (err) => {
 console.error(err);
 notify.error('Failed to update calendar. Please try again.');
 }
 });

 const unblockMutation = useMutation({
 mutationFn: (date: string) => unblockDate(date),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['vendor-availability'] });
 notify.success('Event deleted successfully!');
 },
 onError: (err) => {
 console.error(err);
 notify.error('Failed to delete event.');
 }
 });

 const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
 const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

 const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

 const getStatusColorClass = (status: string) => {
 const s = status?.toLowerCase();
 if (s === 'confirmed' || s === 'completed') {
 return 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20';
 }
 if (s === 'canceled' || s === 'cancelled') {
 return 'bg-rose-500/5 text-rose-500 border-rose-500/20';
 }
 if (s === 'blocked') {
 return 'bg-slate-500/5 text-slate-500 border-slate-500/20';
 }
 return 'bg-amber-500/5 text-amber-500 border-amber-500/20'; // pending
 };

 const getSidebarBadgeClass = (status: string) => {
 const s = status?.toLowerCase();
 if (s === 'confirmed' || s === 'completed') {
 return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
 }
 if (s === 'canceled' || s === 'cancelled') {
 return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
 }
 if (s === 'blocked') {
 return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
 }
 return 'bg-amber-500/10 text-amber-500 border-amber-500/20'; // pending
 };

 const bookingsOnDays = useMemo(() => {
 const map: { [key: number]: any[] } = {};

 if (displayBookings && Array.isArray(displayBookings)) {
 displayBookings.forEach(b => {
 if (!b.eventDate) return;
 // Parse date string carefully. Support both YYYY-MM-DD, ISO formats, and Date objects.
 let date: Date;
 if ((b.eventDate as any) instanceof Date) {
 date = (b.eventDate as any);
 } else if (typeof b.eventDate === 'string') {
 if (b.eventDate.includes('T')) {
 date = new Date(b.eventDate);
 } else {
 const [y, m, d] = b.eventDate.split('-').map(Number);
 date = new Date(y, m - 1, d);
 }
 } else {
 date = new Date(b.eventDate);
 }

 if (isNaN(date.getTime())) return;

 if (date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()) {
 const day = date.getDate();
 if (!map[day]) map[day] = [];
 map[day].push({
 id: b.id,
 title: (b as any).service?.title || b.listingName || 'Service Booking',
 time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
 client: (b as any).user?.name || b.userName || 'Customer',
 status: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1)) : 'Pending',
 type: 'booking',
 dateStr: b.eventDate || ''
 });
 }
 });
 }

 if (displayBlocks && Array.isArray(displayBlocks)) {
 displayBlocks.forEach((ab: any) => {
 if (!ab.date || typeof ab.date !== 'string') return;
 // Parse date string carefully to avoid timezone shifts (YYYY-MM-DD -> Local)
 const [year, month, day] = ab.date.split('-').map(Number);
 const date = new Date(year, month - 1, day);

 if (isNaN(date.getTime())) return;

 if (date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()) {
 const dayNum = date.getDate();
 if (!map[dayNum]) map[dayNum] = [];
 if (ab.status === 'blocked') {
 map[dayNum].push({
 id: ab.id,
 title: ab.reason || 'Personal Block',
 time: 'Full Day',
 status: 'Blocked',
 type: 'block',
 dateStr: ab.date
 });
 }
 }
 });
 }

 return map;
 }, [displayBookings, displayBlocks, currentDate]);

 const renderCalendar = () => {
 const month = currentDate.getMonth();
 const year = currentDate.getFullYear();
 const totalDays = daysInMonth(month, year);
 const startOffset = firstDayOfMonth(month, year);
 const days = [];

 for (let i = 0; i < startOffset; i++) {
 days.push(<div key={`prev-${i}`} className="h-28 border-b border-r border-[var(--ease2event-border-subtle)] bg-[var(--ease2event-bg-elevated)]/30"></div>);
 }

 for (let d = 1; d <= totalDays; d++) {
 const hasBooking = bookingsOnDays[d];
 const isSelected = selectedDate === d;
 const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

 days.push(
 <div
 key={d}
 onClick={() => setSelectedDate(d)}
 className={`h-28 border-b border-r border-[var(--ease2event-border-subtle)] p-4 transition-all cursor-pointer hover:bg-[var(--ease2event-brand-primary)]/5 group relative ${isSelected ? 'bg-[var(--ease2event-bg-elevated)]' : ''}`}
 >
 <div className="flex justify-between items-start">
 <span className={`w-10 h-10 flex items-center justify-center rounded-2xl text-base font-bold ${isToday ? 'bg-[var(--ease2event-brand-primary)] text-white shadow-blue-500/20' :
 isSelected ? 'text-[var(--ease2event-brand-primary)] bg-blue-500/10 border border-blue-500/20' : 'text-[var(--ease2event-text-primary)]'
 }`}>
 {d}
 </span>
 {hasBooking && (
 <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
 )}
 </div>

 <div className="mt-4 space-y-2">
 {hasBooking?.slice(0, 2).map((b: any, bIdx: number) => (
 <div key={b.id || bIdx} className={`px-4 py-1 rounded-lg text-sm font-bold truncate border transition-all ${getStatusColorClass(b.status)}`}>
 {b.time} - {b.title}
 </div>
 ))}
 {hasBooking && hasBooking.length > 2 && (
 <div className="text-sm text-[var(--ease2event-text-secondary)] font-bold ml-2">+{hasBooking.length - 2} More</div>
 )}
 </div>
 </div>
 );
 }

 return days;
 };

 const selectedEvents = selectedDate ? bookingsOnDays[selectedDate] || [] : [];

 return (
 <div className="space-y-5 pb-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[var(--ease2event-border-subtle)] pb-6">
 <div className="space-y-4">
 <h1 className="text-xl font-bold tracking-tight text-[var(--ease2event-text-primary)]">Scheduling Calendar</h1>
 <p className="text-base font-semibold text-[var(--ease2event-text-secondary)] normal-case tracking-normal">
 Monitor your bookings, availability, and upcoming events.
 </p>
 </div>
 <div className="flex items-center gap-5">
 <Button
 variant="secondary"
 className="h-10 px-5 rounded-2xl font-bold text-xs tracking-widest  active:scale-95 transition-all"
 leftIcon={<Filter size={16} />}
 onClick={() => notify.error('Filter system coming soon!')}
 >
 Filter Events
 </Button>
 <Button
 className="h-10 px-6 rounded-2xl font-bold text-xs tracking-widest bg-[var(--ease2event-brand-primary)] text-white shadow-indigo-500/20  active:scale-95 transition-all"
 leftIcon={<PlusCircle size={16} />}
 onClick={() => {
 if (selectedDate) {
 setBlockReason('');
 setIsModalOpen(true);
 } else {
 notify.error('Please select a date on the calendar first to add an event.');
 }
 }}
 >
 Add Event
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
 {/* Main Calendar Card */}
 <div className="xl:col-span-3 card-minimal !p-0 overflow-hidden flex flex-col rounded-xl border-[var(--ease2event-border-base)] bg-[var(--ease2event-bg-surface)]">
 {/* Calendar Header */}
 <div className="p-4 md:p-5 bg-[var(--ease2event-bg-surface)] border-b border-[var(--ease2event-border-subtle)]">
 <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5 bg-[var(--ease2event-bg-elevated)]/50 p-2 md:p-4 rounded-xl border-2 border-[var(--ease2event-border-subtle)] transition-all ">
 <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
 <div className="flex bg-[var(--ease2event-bg-elevated)]/40 rounded-full p-1.5 border border-[var(--ease2event-border-subtle)] shrink-0">
 <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--ease2event-bg-surface)] rounded-full text-[var(--ease2event-text-primary)] hover:text-[var(--ease2event-brand-primary)] transition-all border border-[var(--ease2event-border-subtle)] ">
 <ChevronLeft size={18} />
 </button>
 <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--ease2event-bg-surface)] rounded-full text-[var(--ease2event-text-primary)] hover:text-[var(--ease2event-brand-primary)] transition-all border border-[var(--ease2event-border-subtle)] ml-1 ">
 <ChevronRight size={18} />
 </button>
 </div>
 <h2 className="text-xl md:text-xl font-bold text-[var(--ease2event-text-primary)] tracking-tighter truncate min-w-0">
 {monthNames[currentDate.getMonth()]}
 <select
 value={currentDate.getFullYear()}
 onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
 className="bg-transparent text-[var(--ease2event-brand-primary)] font-bold ml-2 md:ml-4 tracking-wide text-lg md:text-lg outline-none cursor-pointer appearance-none border-none focus:ring-0"
 >
 {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
 <option key={year} value={year}>{year}</option>
 ))}
 </select>
 </h2>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto scrollbar-hide">
 <div className="min-w-[800px] flex flex-col">
 <div className="grid grid-cols-7 border-b border-[var(--ease2event-border-subtle)] bg-[var(--ease2event-bg-elevated)]/50">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
 <div key={day} className="py-4 text-center text-sm font-bold tracking-widest text-[var(--ease2event-text-secondary)]">{day}</div>
 ))}
 </div>
 <div className="grid grid-cols-7 flex-1">
 {isLoading ? (
 <div className="col-span-7 h-[400px] p-6 space-y-4">
 <Skeleton className="w-full h-full rounded-2xl" />
 </div>
 ) : renderCalendar()}
 </div>
 </div>
 </div>
 </div>

 {/* Selected Date Details Sidebar */}
 <div className="xl:col-span-1 space-y-5">
 <div className="card-minimal p-5 rounded-xl border-[var(--ease2event-border-base)] space-y-5 h-fit bg-[var(--ease2event-bg-surface)]">
 <div className="flex justify-between items-center bg-[var(--ease2event-bg-elevated)] p-5 rounded-xl border border-[var(--ease2event-border-subtle)] ">
 <div className="space-y-1">
 <h2 className="font-bold text-lg text-[var(--ease2event-text-primary)] tracking-tight">Schedule</h2>
 <p className="text-[15px] text-[var(--ease2event-brand-primary)] font-bold tracking-widest">{selectedDate} {monthNames[currentDate.getMonth()]}</p>
 </div>
 <div className="w-12 h-12 bg-[var(--ease2event-brand-primary)]/10 rounded-[1.25rem] flex items-center justify-center border border-[var(--ease2event-brand-primary)]/20 text-[var(--ease2event-brand-primary)]">
 <CalendarIcon size={16} />
 </div>
 </div>

 {selectedEvents.length > 0 ? (
 <div className="space-y-6">
 {selectedEvents.map((ev: any, i: number) => (
 <div key={ev.id || i} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-[var(--ease2event-brand-primary)] before:rounded-full group hover:bg-[var(--ease2event-bg-elevated)]/50 p-5 rounded-lg transition-all cursor-pointer border border-[var(--ease2event-border-subtle)] ">
 <div className="flex justify-between items-start mb-3">
 <h4 className="font-bold text-md text-[var(--ease2event-text-primary)] group-hover:text-[var(--ease2event-brand-primary)] transition-colors leading-tight">{ev.title}</h4>
 <div className="relative">
 <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === ev.id ? null : ev.id); }} className="text-[var(--ease2event-text-secondary)] hover:text-[var(--ease2event-text-primary)] transition-colors p-1"><MoreVertical size={16} /></button>
 <AnimatePresence>
 {activeMenuId === ev.id && (
 <motion.div
 initial={{ opacity: 0, y: -5, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -5, scale: 0.95 }}
 className="absolute right-0 top-full mt-1 w-36 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-xl shadow-xl z-50 py-1 overflow-hidden"
 >
 <button
 onClick={(e) => { 
 e.stopPropagation(); 
 setActiveMenuId(null); 
 if (ev.type === 'block') {
 setBlockReason(ev.title);
 const day = parseInt(ev.dateStr.split('-')[2], 10);
 if (!isNaN(day)) setSelectedDate(day);
 setIsModalOpen(true);
 } else {
 notify.info('Bookings must be managed from the Bookings page.');
 }
 }}
 className="w-full text-left px-4 py-3 text-xs font-bold text-[var(--ease2event-text-primary)] hover:bg-[var(--ease2event-brand-primary)]/10 hover:text-[var(--ease2event-brand-primary)] transition-colors border-b border-[var(--ease2event-border-subtle)]"
 >
 Edit Event
 </button>
 <button
 onClick={(e) => { 
 e.stopPropagation(); 
 setActiveMenuId(null); 
 if (ev.type === 'block') {
 unblockMutation.mutate(ev.id); 
 } else {
 notify.info('Cannot delete bookings directly from calendar');
 }
 }}
 className="w-full text-left px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
 >
 Delete Event
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 <div className="space-y-3">
 <div className="flex items-center gap-3 text-sm text-[var(--ease2event-text-secondary)] font-bold tracking-widest">
 <Clock size={14} className="text-[var(--ease2event-brand-primary)]" />
 {ev.time}
 </div>
 <div className="flex items-center gap-3 text-sm text-[var(--ease2event-text-secondary)] font-bold tracking-widest">
 <Users size={14} className="text-[var(--ease2event-brand-primary)]" />
 {ev.client}
 </div>
 <Badge className={`px-3 h-7 rounded-lg font-bold text-[8px] tracking-widest border ${getSidebarBadgeClass(ev.status)}`}>
 {ev.status}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-20 text-center bg-[var(--ease2event-bg-elevated)]/30 rounded-xl border-2 border-dashed border-[var(--ease2event-border-base)] space-y-6">
 <div className="w-20 h-20 bg-[var(--ease2event-bg-surface)] rounded-xl flex items-center justify-center mx-auto border border-[var(--ease2event-border-subtle)] relative overflow-hidden group">
 <div className="absolute inset-0 bg-[var(--ease2event-brand-primary)]/5 group-hover:scale-150 transition-transform " />
 <Target size={16} className="text-[var(--ease2event-text-muted)] relative z-10 opacity-40" />
 </div>
 <div className="px-6 space-y-2">
 <p className="text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest">No Events Found</p>
 <button
 onClick={() => {
 if (selectedDate) {
 setBlockReason('');
 setIsModalOpen(true);
 }
 }}
 className="text-sm font-bold text-[var(--ease2event-brand-primary)] hover:text-[var(--ease2event-brand-secondary)] tracking-widest transition-all underline decoration-2 underline-offset-8"
 >
 BLOCK DATE
 </button>
 </div>
 </div>
 )}

 <Button
 className="w-full !h-12 text-xs font-bold tracking-widest rounded-lg bg-[var(--ease2event-brand-primary)] text-white shadow-indigo-500/20 active:scale-95 transition-all"
 onClick={() => {
 if (!vendorId) {
 notify.error('Vendor profile not found. Please complete onboarding.');
 return;
 }
 if (selectedDate) {
 setBlockReason('');
 setIsModalOpen(true);
 } else {
 notify.error('Please select a date first.');
 }
 }}
 >
 Add New Entry
 </Button>
 </div>
 </div>
 </div>

 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Calendar Event">
 <div className="space-y-4 p-2">
 <p className="text-sm text-[var(--ease2event-text-secondary)]">
 Block this date in your calendar to prevent new bookings or set a personal reminder.
 </p>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date Selected</label>
 <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-200">
 {selectedDate ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}` : 'None'}
 </div>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reason / Title</label>
 <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all text-slate-900 dark:text-white" placeholder="e.g. Personal Holiday, Maintenance" />
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button onClick={() => {
 if (!selectedDate) return;
 const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
 blockMutation.mutate({date: dateStr, reason: blockReason});
 }} disabled={blockMutation.isPending}>
 {blockMutation.isPending ? 'Saving...' : 'Save Event'}
 </Button>
 </div>
 </div>
 </Modal>
 </div>
 );
};

export default CalendarPage;
