import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Star, Edit2, Trash2, Search, Filter, MoreVertical, Layers, Calendar, ChevronRight, Users, CheckCircle2, FileText, Package } from 'lucide-react';
import api from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@ease2event/shared';
import ListingEditorModal from '../components/ListingEditorModal';
import { Button, Badge, Skeleton } from '@ease2event/ui';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Listings: React.FC = () => {
 const { user } = useAuth();
 const queryClient = useQueryClient();

 const [searchTerm, setSearchTerm] = useState('');

 // Modal State
 const [isEditorOpen, setIsEditorOpen] = useState(false);
 const [editingListing, setEditingListing] = useState<any>(null);
 const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

 // Fetch vendorId: first from JWT token, then fallback to backend profile API
 const { data: vendorId = null } = useQuery({
  queryKey: ['vendorId', user?.id],
  queryFn: async () => {
    // Fast path: vendorId already in token
    if (user?.vendor?.id) return user.vendor.id;
    // Fallback: fetch from backend
    try {
      const profile: any = await api.get('/vendors/me');
      return profile?.id || profile?.data?.id || null;
    } catch {
      return null;
    }
  },
  enabled: !!user,
 });

 const { data: listings = [], isLoading: loading, error } = useQuery({
 queryKey: ['services', vendorId],
 queryFn: async () => {
 if (!vendorId) return [];
 const response: any = await api.get(`/services?vendorId=${vendorId}&limit=100`);
 
 const dataList = Array.isArray(response) ? response : (response?.data || []);
 return dataList.map((service: any) => ({
 id: service.id,
 title: service.title,
 image: service.images?.[0] || '',
 location: service.availableLocations?.[0] || 'Mumbai',
 rating: service.vendor?.rating || 'New',
 reviews: service.vendor?.totalReviews || 0,
 price: `${service.currency || 'INR'} ${parseFloat(service.basePrice).toLocaleString()}`,
 status: service.isActive ? 'Active' : 'Inactive',
 }));
 },
 enabled: !!vendorId,
 });

 const saveMutation = useMutation({
 mutationFn: async (data: any) => {
 const payload: any = {
 title: data.title,
 description: data.description,
 basePrice: Number(data.price) || 0,
 availableLocations: data.location ? [data.location] : [],
 guestCapacity: Number(data.capacity) || 1,
 images: data.image && data.image.startsWith('http') ? [data.image] : [],
 locationType: 'onsite'
 };

 if (vendorId) {
 payload.vendorId = vendorId;
 }

 if (editingListing) {
 return api.put(`/services/${editingListing.id}`, payload);
 } else {
 return api.post('/services', payload);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['services', vendorId] });
 setIsEditorOpen(false);
 toast.success(editingListing ? 'Service updated successfully.' : 'Service created successfully.');
 },
 onError: (error: any) => {
 console.error('Failed to save listing:', error);
 toast.error(error?.response?.data?.message || error?.message || 'Failed to save listing.');
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.delete(`/services/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['services', vendorId] });
 }
 });

 const handleSaveListing = async (data: any) => {
 await saveMutation.mutateAsync(data);
 };

 const handleDelete = (id: string) => {
 setDeleteConfirmation(id);
 };

 const confirmDelete = async () => {
 if (!deleteConfirmation) return;
 try {
 await deleteMutation.mutateAsync(deleteConfirmation);
 toast.success('Service deleted successfully.');
 } catch (error: any) {
 console.error('Failed to delete listing:', error);
 toast.error('Failed to delete listing from server.');
 } finally {
 setDeleteConfirmation(null);
 }
 };

 const filteredListings = listings.filter((l: any) =>
 l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 l.location.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-8 pb-12 px-6 w-full max-w-7xl mx-auto">
 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--ease2event-border-subtle)] pb-6">
 <div className="space-y-2">
 <h1 className="text-2xl font-bold normal-case tracking-normal leading-normal">Event Management</h1>
 <p className="text-sm font-semibold text-slate-500 normal-case tracking-normal flex items-center gap-2">
 Manage and track your event posts easily.
 </p>
 </div>
 <Button
 onClick={() => { setEditingListing(null); setIsEditorOpen(true); }}
 className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center h-11 sm:h-12 px-4 sm:px-6 rounded-2xl font-bold text-[9px] sm:text-[11px] tracking-widest bg-[var(--ease2event-brand-primary)] text-white hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
 >
 <Plus size={14} className="mr-2 sm:mr-3" />
 Create New Listing
 </Button>
 </div>

 {/* Quick Stats Bar */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Total Active Services', value: listings.filter((l: any) => l.status === 'Active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
 { label: 'Total Reach', value: '1.2k', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
 { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
 { label: 'Pending Reviews', value: '12', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
 ].map((stat, i) => (
 <div key={i} className="card-minimal p-5 flex items-center gap-4 rounded-xl border border-[var(--ease2event-border-subtle)] bg-white dark:bg-slate-900">
 <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
 <stat.icon size={24} />
 </div>
 <div className="space-y-1">
 <p className="text-xs font-semibold text-slate-500 uppercase">{stat.label}</p>
 <p className="text-xl font-bold text-[var(--ease2event-text-primary)]">{stat.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Filters Bar */}
 <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--ease2event-bg-elevated)] p-4 rounded-xl border border-[var(--ease2event-border-subtle)] ">
 <div className="relative flex-1 w-full group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ease2event-text-muted)] group-focus-within:text-[var(--ease2event-brand-primary)] transition-colors" size={20} />
 <input
 type="text"
 placeholder="Search listings by title or location..."
 className="w-full h-10 pl-12 pr-4 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all text-[var(--ease2event-text-primary)] placeholder-[var(--ease2event-text-secondary)]"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <div className="flex gap-4 w-full md:w-auto">
 <Button variant="secondary" onClick={() => alert('More filters coming soon!')} className="cursor-pointer h-10 px-4 rounded-lg border-[var(--ease2event-border-subtle)] font-bold text-xs bg-[var(--ease2event-bg-surface)]" leftIcon={<Filter size={16} />}>
 More Filters
 </Button>
 </div>
 </div>

 {/* Grid List */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {loading ? (
 [1, 2, 3].map((i: number) => (
 <div key={i} className="card-minimal h-80 rounded-xl bg-[var(--ease2event-bg-elevated)] animate-pulse border-[var(--ease2event-border-subtle)]">
 <div className="h-48 bg-[var(--ease2event-bg-surface)] rounded-t-xl"></div>
 <div className="p-5 space-y-4">
 <div className="h-6 bg-[var(--ease2event-bg-surface)] w-3/4 rounded-md"></div>
 <div className="h-4 bg-[var(--ease2event-bg-surface)] w-1/2 rounded-md"></div>
 </div>
 </div>
 ))
 ) : (
 filteredListings.map((listing: any, i: number) => (
 <div key={listing.id || `listing-${i}`} className="card-minimal p-0 overflow-hidden flex flex-col group h-full border-[var(--ease2event-border-subtle)] transition-shadow rounded-xl bg-white dark:bg-slate-900">
 <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
 {listing.image ? (
 <img
 src={listing.image}
 alt={listing.title}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
 <Package size={32} className="mb-2 opacity-50" />
 <span className="text-xs font-semibold">No image uploaded</span>
 </div>
 )}
 <div className="absolute top-4 right-4 z-10">
 <Badge variant={listing.status === 'Active' ? 'confirmed' : 'pending'} className="px-3 py-1 text-[10px] font-bold rounded-md bg-white/90 dark:bg-black/90 backdrop-blur-md ">
 {listing.status || 'Active'}
 </Badge>
 </div>
 <div className="absolute bottom-4 left-4 z-10">
 <div className="flex items-center gap-1.5 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 py-1 rounded-md ">
 <Star size={14} className="text-amber-500 fill-amber-500" />
 <span className="text-xs font-bold text-[var(--ease2event-text-primary)]">{listing.rating}</span>
 </div>
 </div>
 </div>
 <div className="p-5 flex-1 flex flex-col space-y-4">
 <div className="flex justify-between items-start gap-3">
 <h3 className="text-lg font-bold text-[var(--ease2event-text-primary)] leading-snug line-clamp-2">{listing.title}</h3>
 <button
 onClick={() => { setEditingListing(listing); setIsEditorOpen(true); }}
 className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors"
 >
 <Edit2 size={16} />
 </button>
 </div>
 <div className="flex items-center gap-2 text-slate-500 text-sm">
 <MapPin size={16} />
 {listing.location}
 </div>

 <div className="mt-auto pt-4 border-t border-[var(--ease2event-border-subtle)] flex items-center justify-between">
 <div>
 <p className="text-[10px] font-semibold text-slate-500 uppercase">Base Price</p>
 <p className="text-lg font-bold text-[var(--ease2event-text-primary)]">{listing.price}</p>
 </div>
 <Button
 variant="outline"
 size="sm"
 className="px-3 h-8 rounded-md font-semibold text-xs border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
 leftIcon={<Trash2 size={14} />}
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(listing.id);
 }}
 >
 Delete
 </Button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 <ListingEditorModal
 isOpen={isEditorOpen}
 onClose={() => setIsEditorOpen(false)}
 listing={editingListing}
 onSave={handleSaveListing}
 />

 <AnimatePresence>
 {deleteConfirmation && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
 >
 <div className="p-6 text-center space-y-4">
 <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
 <Trash2 size={32} />
 </div>
 <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Delete Service?</h3>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
 This action cannot be undone. This service will be permanently removed from your active listings.
 </p>
 </div>
 <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-3">
 <button
 onClick={() => setDeleteConfirmation(null)}
 className="flex-1 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={confirmDelete}
 disabled={deleteMutation.isPending}
 className="flex-1 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 transition-colors disabled:opacity-70 flex justify-center items-center"
 >
 {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default Listings;
