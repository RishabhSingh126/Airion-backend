import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, IndianRupee, Users, Image as ImageIcon, Save, CheckCircle, Plus } from 'lucide-react';
import api, { uploadImage } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ListingEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing?: any; // If null, means 'Add New'
    onSave: (data: any) => Promise<void>;
}

const ListingEditorModal: React.FC<ListingEditorModalProps> = ({ isOpen, onClose, listing, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        capacity: '',
        category: 'Venue',
        image: '',
        images: [] as string[]
    });

    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title || '',
                description: listing.description || '',
                price: listing.price || '',
                location: listing.location || '',
                capacity: listing.capacity || '',
                category: listing.category || 'Venue',
                image: listing.image || '',
                images: listing.images || []
            });
        } else {
            setFormData({ title: '', description: '', price: '', location: '', capacity: '', category: 'Venue', image: '', images: [] });
        }
    }, [listing, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error(error);
            alert("Failed to save listing");
        } finally {
            setLoading(false);
        }
    };

    return (
 <AnimatePresence>
 {isOpen && (
 <div key="modal-backdrop" className="fixed inset-0 z-[999] flex items-center justify-center pt-[100px] pb-6 px-4 sm:px-8 bg-slate-900/60 backdrop-blur-md">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="bg-white dark:bg-slate-950 w-full max-w-2xl max-h-[calc(100vh-120px)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
 >
 {/* Header */}
 <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
 <div>
 <h2 className="text-xl font-bold text-slate-900 dark:text-white">
 {listing ? 'Edit Service Listing' : 'Create New Listing'}
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">Fill out all the details to publish your service.</p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
 <X size={24} className="text-slate-500" />
 </button>
 </div>

 {/* Scrollable Form */}
 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
 <form id="listing-form" onSubmit={handleSubmit} className="space-y-6">

 {/* Image Uploader */}
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Cover Image</label>
 <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-40 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
 {formData.image ? (
 <>
 <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
 <Upload size={32} className="mb-2" />
 <span className="font-bold">Change Image</span>
 </div>
 </>
 ) : (
 <div className="text-center p-4">
 <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform text-red-500">
 <ImageIcon size={24} />
 </div>
 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload image</p>
 <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
 </div>
 )}
 {/* File input trigger */}
 <input
 type="file"
 accept="image/*"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 onChange={async (e) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // 1. Instant local preview
 const localUrl = URL.createObjectURL(file);
 setFormData(prev => ({ ...prev, image: localUrl }));

 setLoading(true);
 try {
 const result: any = await uploadImage(file);
 
 // The API client automatically unwraps response.data
 // So result is { success: true, url: "...", message: "..." }
 const imageUrl = result?.url || (typeof result === 'string' ? result : null);

 if (imageUrl && imageUrl.startsWith('http')) {
 // 2. Update with permanent cloud URL once upload succeeds
 setFormData(prev => ({ ...prev, image: imageUrl }));
 } else {
 // Upload didn't produce a valid cloud URL — clear preview so blob isn't saved to DB
 URL.revokeObjectURL(localUrl);
 setFormData(prev => ({ ...prev, image: '' }));
 alert('Image upload failed: Cloud storage (Supabase) is not configured. The listing will be saved without an image.');
 }
 } catch (err: any) {
 console.error('[Upload Debug]:', err);
 // Clear local blob preview so it is NOT sent to DB
 URL.revokeObjectURL(localUrl);
 setFormData(prev => ({ ...prev, image: '' }));
 const backendError = err?.response?.data?.message || err?.message || 'Unknown error occurred.';
 alert(`Image upload failed: ${backendError}`);
 } finally {
 setLoading(false);
 }
 }}
 />
 </div>
 </div>


 <div className="grid gap-5">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Service Title</label>
 <input
 type="text"
 required
 placeholder="e.g. Grand Royal Banquet Hall"
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
 <select
 value={formData.category}
 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
 >
 <option>Venue</option>
 <option>Photography</option>
 <option>Catering</option>
 <option>Decor</option>
 <option>Music/DJ</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Base Price (Per Event)</label>
 <div className="relative">
 <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="number"
 required
 placeholder="e.g. 50000"
 value={formData.price}
 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
 <div className="relative">
 <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 required
 list="city-options"
 placeholder="City, State"
 value={formData.location}
 onChange={(e) => setFormData({ ...formData, location: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
 />
 <datalist id="city-options">
 <option value="Mumbai, Maharashtra" />
 <option value="Delhi, NCR" />
 <option value="Bangalore, Karnataka" />
 <option value="Hyderabad, Telangana" />
 <option value="Ahmedabad, Gujarat" />
 <option value="Chennai, Tamil Nadu" />
 <option value="Kolkata, West Bengal" />
 <option value="Pune, Maharashtra" />
 <option value="Jaipur, Rajasthan" />
 <option value="Lucknow, Uttar Pradesh" />
 <option value="Kanpur, Uttar Pradesh" />
 <option value="Nagpur, Maharashtra" />
 <option value="Indore, Madhya Pradesh" />
 <option value="Thane, Maharashtra" />
 <option value="Bhopal, Madhya Pradesh" />
 <option value="Visakhapatnam, Andhra Pradesh" />
 <option value="Pimpri-Chinchwad, Maharashtra" />
 <option value="Patna, Bihar" />
 <option value="Vadodara, Gujarat" />
 <option value="Ghaziabad, Uttar Pradesh" />
 <option value="Ludhiana, Punjab" />
 <option value="Agra, Uttar Pradesh" />
 <option value="Nashik, Maharashtra" />
 <option value="Faridabad, Haryana" />
 <option value="Meerut, Uttar Pradesh" />
 <option value="Rajkot, Gujarat" />
 <option value="Kalyan-Dombivli, Maharashtra" />
 <option value="Vasai-Virar, Maharashtra" />
 <option value="Varanasi, Uttar Pradesh" />
 <option value="Srinagar, Jammu and Kashmir" />
 <option value="Aurangabad, Maharashtra" />
 <option value="Dhanbad, Jharkhand" />
 <option value="Amritsar, Punjab" />
 <option value="Navi Mumbai, Maharashtra" />
 <option value="Allahabad, Uttar Pradesh" />
 <option value="Ranchi, Jharkhand" />
 <option value="Howrah, West Bengal" />
 <option value="Coimbatore, Tamil Nadu" />
 <option value="Jabalpur, Madhya Pradesh" />
 <option value="Gwalior, Madhya Pradesh" />
 <option value="Vijayawada, Andhra Pradesh" />
 <option value="Jodhpur, Rajasthan" />
 <option value="Madurai, Tamil Nadu" />
 <option value="Raipur, Chhattisgarh" />
 <option value="Kota, Rajasthan" />
 <option value="Chandigarh, Punjab/Haryana" />
 <option value="Guwahati, Assam" />
 </datalist>
 </div>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Max Capacity</label>
 <div className="relative">
 <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 placeholder="e.g. 500"
 value={formData.capacity}
 onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
 />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Detailed Description</label>
 <textarea
 required
 rows={4}
 placeholder="Describe your service offerings, packages, amenities, and specialties."
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white resize-none"
 />
 </div>
 </div>
 </form>
 </div>

 {/* Footer Actions */}
 <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-end gap-3 shrink-0">
 <button
 type="button"
 onClick={onClose}
 className="cursor-pointer px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 form="listing-form"
 disabled={loading || success}
 className={`cursor-pointer px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center min-w-[120px] shadow-md ${success
 ? 'bg-emerald-500 shadow-emerald-500/30'
 : 'bg-red-500 hover:bg-red-600 shadow-red-500/30 .5'
 } disabled:opacity-70 disabled:hover:translate-y-0`}
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : success ? (
 <><CheckCircle size={20} className="mr-2" /> Saved!</>
 ) : (
 <><Save size={20} className="mr-2" /> Save Service</>
 )}
 </button>
 </div>
 </motion.div>
 <style key="modal-styles">{`
 .custom-scrollbar::-webkit-scrollbar { width: 6px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; }
 `}</style>
 </div>
 )}
 </AnimatePresence>
 );
};

export default ListingEditorModal;
