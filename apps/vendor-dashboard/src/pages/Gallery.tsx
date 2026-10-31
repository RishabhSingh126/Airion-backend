import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Plus, Trash2, Eye, Sparkles, Loader2, Image as ImageIcon, Zap, Target, Activity, ShieldCheck, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@ease2event/shared';
import api, { uploadImage } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '@ease2event/ui';

interface GalleryItem {
 id: string;
 imageUrl: string;
 title?: string;
 createdAt: Date;
 isUploading?: boolean;
}

/**
 * 🎨 Professional Image Management: Portfolio
 * Modernized with theme-aware styling, clean typography, and professional gallery interface.
 */
const Gallery: React.FC = () => {
 const { user, refreshUser } = useAuth();
 const [uploading, setUploading] = useState(false);
 const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
 const [optimisticImages, setOptimisticImages] = useState<GalleryItem[]>([]);
 const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<string[]>([]);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const baseGallery = user?.vendor?.gallery || [];

 const gallery = [...baseGallery, ...optimisticImages]
 .filter(item => !optimisticDeletedIds.includes(item.id)) as GalleryItem[];

 // Helper: convert file to base64 data URL
 const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(file);
 });

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (!e.target.files?.length) return;

 setUploading(true);
 const files = Array.from(e.target.files);

 // --- INSTANT PREVIEW PROTOCOL ---
 const localPreviews = files.map(file => ({
 id: `temp-${Math.random()}`,
 imageUrl: URL.createObjectURL(file),
 title: file.name,
 createdAt: new Date(),
 isUploading: true
 }));

 setOptimisticImages(prev => [...prev, ...localPreviews]);

 try {
 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 let imageUrl: string | null = null;

 // --- CLOUD UPLOAD (with base64 fallback) ---
 try {
 const data = await uploadImage(file);
 imageUrl = data.url || data.data?.url || (typeof data === 'string' ? data : null);
 } catch (uploadErr: any) {
 console.warn('[Gallery] Cloud upload unavailable, using base64 fallback:', uploadErr.message);
 imageUrl = await fileToBase64(file);
 }

 if (imageUrl) {
 await api.post('/vendors/gallery', {
 imageUrl,
 title: file.name
 });
 }
 }

 toast.success(`Images uploaded successfully: ${files.length} image${files.length > 1 ? 's' : ''} added`);
 setOptimisticImages([]);
 refreshUser();
 } catch (err: any) {
 console.error('[Gallery upload failure]:', err);
 // Keep previews visible but mark them as failed (not uploading)
 setOptimisticImages(prev => prev.map(img => ({ ...img, isUploading: false })));
 const errorMessage = err.error || err.response?.data?.message || err.message || String(err);
 toast.error('Upload failed: ' + errorMessage);
 } finally {
 setUploading(false);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }
 };

 const handleDelete = async (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 // INSTANT DELETE PROTOCOL
 setOptimisticDeletedIds(prev => [...prev, id]);

 try {
 await api.delete(`/vendors/gallery/${id}`);
 toast.success('Asset purged');
 refreshUser();
 } catch (err) {
 setOptimisticDeletedIds(prev => prev.filter(oid => oid !== id)); // Revert on failure
 toast.error('Purge failure');
 }
 };

 const handlePurgeAll = async () => {
 if (!confirm('CRITICAL ACTION: Purge entire gallery registry? This cannot be undone.')) return;

 setOptimisticDeletedIds(gallery.map(i => i.id));

 try {
 await api.delete('/vendors/gallery-purge');
 toast.success('Gallery registry cleared');
 refreshUser();
 } catch (err) {
 setOptimisticDeletedIds([]);
 toast.error('Purge failure');
 }
 };

 return (
 <div className="space-y-6 pb-6 px-6 w-full max-w-7xl mx-auto">
 {/* Header Section */}
 <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pt-0 pb-6 border-b border-[var(--ease2event-border-subtle)]">
 <div className="space-y-6">
 <h1 className="text-xl font-bold tracking-tight">Gallery</h1>
 <p className="text-base font-semibold text-[var(--ease2event-text-secondary)] flex items-center gap-2">
 Manage your portfolio images and visual content.
 </p>
 </div>

 <div className="flex gap-6 w-full xl:w-auto">
 <button
 onClick={handlePurgeAll}
 className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest bg-rose-600/10 text-rose-600 border-2 border-rose-600/20 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-4 cursor-pointer"
 >
 <Trash2 size={16} />
 Clear Gallery </button>

 <input
 type="file"
 ref={fileInputRef}
 onChange={handleUpload}
 className="hidden"
 multiple
 accept="image/*"
 />
 <Button
 onClick={() => fileInputRef.current?.click()}
 disabled={uploading}
 className="btn-primary flex-1 xl:flex-initial !h-12 px-14 rounded-3xl text-sm font-bold tracking-normal shadow-blue-500/20  active:scale-95 transition-all"
 >
 {uploading ? <Loader2 className="animate-spin mr-3" size={16} /> : <Plus size={16} className="mr-3" />}
 <span>{uploading ? 'UPLOADING...' : 'UPLOAD IMAGES'}</span>
 </Button>
 </div>
 </div>

 {/* Empty State */}
 {gallery.length === 0 && !uploading ? (
 <div className="card-minimal !p-32 flex flex-col items-center justify-center text-center space-y-6 bg-[var(--ease2event-bg-elevated)]/20 border-4 border-dashed border-[var(--ease2event-border-base)] rounded-[4rem] ">
 <div className="w-40 h-40 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border-4 border-blue-500/10 transition-transform hover:scale-110 group relative overflow-hidden">
 <div className="absolute inset-0 bg-blue-500/10 group-hover:scale-150 transition-transform " />
 <ImageIcon size={64} className="relative z-10" />
 </div>
 <div className="max-w-xl space-y-6">
 <h3 className="text-xl font-bold text-[var(--ease2event-text-primary)] tracking-tight leading-none">No Images Uploaded</h3>
 <p className="text-lg text-[var(--ease2event-text-secondary)] font-semibold tracking-tight leading-loose opacity-100">Upload your work to showcase your services and attract more clients.</p>
 </div>
 <Button
 onClick={() => fileInputRef.current?.click()}
 className="btn-secondary !h-13 px-12 text-sm font-bold tracking-normal border-2 border-[var(--ease2event-border-base)] rounded-2xl hover:bg-blue-600 hover:text-white transition-all "
 >
 Upload Photos
 </Button>
 </div>
 ) : (
 <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
 {gallery.map((item, index) => (
 <div
 key={item.id || index}
 
 
 
 onClick={() => !item.isUploading && setSelectedImage(item)}
 className={`relative group cursor-pointer break-inside-avoid rounded-xl overflow-hidden border-2 transition-all bg-[var(--ease2event-bg-surface)] ${item.isUploading
 ? 'border-blue-500/30 opacity-80 cursor-wait'
 : 'border-[var(--ease2event-border-subtle)]  hover: '
 }`}
 >
 <img
 src={item.imageUrl}
 alt={item.title || 'Registry item'}
 className={`w-full h-auto object-cover transition-transform ${!item.isUploading && ' opacity-95 group-hover:opacity-100'}`}
 onError={(e) => {
 (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/2563eb/white?text=Image+Unavailable';
 }}
 />

 {item.isUploading ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10 backdrop-blur-[2px]">
 <Loader2 className="animate-spin text-white mb-4" size={48} />
 <span className="text-white font-black text-xs tracking-[0.3em] drop-">Uploading...</span>
 </div>
 ) : (
 <div className="absolute inset-0 bg-gradient-to-t from-[var(--ease2event-bg-surface)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
 <div className="space-y-6 translate-y-10 group-hover:translate-y-0 transition-transform ">
 <div className="flex items-center gap-3">
 <ShieldCheck size={18} className="text-blue-500" />
 <span className="text-[10px] text-blue-500 font-bold tracking-widest">VERIFIED ASSET</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[var(--ease2event-text-primary)] text-sm font-bold tracking-widest truncate pr-6">
 {item.title || 'GALLERY_ITEM'}
 </span>
 <div className="flex gap-4">
 <button
 onClick={(e) => handleDelete(item.id, e)}
 className="w-12 h-12 flex items-center justify-center bg-rose-600 shadow-rose-600/20 rounded-2xl text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
 >
 <Trash2 size={16} />
 </button>
 <button className="w-12 h-12 flex items-center justify-center bg-blue-600 shadow-blue-600/20 rounded-2xl text-white hover:scale-110 active:scale-95 transition-all cursor-pointer">
 <Maximize2 size={16} />
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 <div className={`h-2 w-0 transition-all absolute bottom-0 left-0 ${item.isUploading ? 'w-1/2 bg-amber-500 animate-pulse' : 'group-hover:w-full bg-blue-600'}`}></div>
 </div>
 ))}
 </div>
 )}

 {/* Preview Overlay */}
 <AnimatePresence>
 {selectedImage && (
 <div
 
 
 
 className="fixed inset-0 z-[100] flex items-start justify-center p-6 md:p-6 md:pl-64 bg-[var(--ease2event-bg-base)]/95 backdrop-blur-3xl overflow-y-auto"
 onClick={() => setSelectedImage(null)}
 >
 <div
 
 
 
 className="relative max-w-7xl w-full flex flex-col gap-6 my-auto px-5"
 onClick={e => e.stopPropagation()}
 >
 {/* Controls Row */}
 <div className="flex items-center justify-end">
 <button 
 onClick={(e) => {
 e.stopPropagation();
 window.open(selectedImage.imageUrl, '_blank');
 }}
 className="p-2 sm:p-2.5 bg-black/50 backdrop-blur-md text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg cursor-pointer mr-3"
 >
 <Maximize2 size={14} className="sm:w-4 sm:h-4" />
 </button>
 <button
 onClick={(e) => handleDelete(selectedImage.id, e)}
 className="p-2 sm:p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-lg cursor-pointer"
 >
 <Trash2 size={14} className="sm:w-4 sm:h-4" />
 </button>
 <button
 onClick={() => setSelectedImage(null)}
 className="flex items-center gap-3 text-[var(--ease2event-text-secondary)] hover:text-white transition-all font-bold text-xs tracking-[0.3em] ml-6"
 >
 Close <X size={38} className="p-2 bg-rose-600 text-white rounded-2xl shadow-rose-600/30" />
 </button>
 </div>

 {/* Image */}
 <div className="w-full rounded-xl overflow-hidden border-4 border-[var(--ease2event-border-base)] bg-[var(--ease2event-bg-surface)]">
 <img
 src={selectedImage.imageUrl}
 className="w-full h-auto max-h-[80vh] object-contain"
 alt="Gallery preview"
 />
 </div>

 {/* Title */}
 {selectedImage.title && (
 <div
 
 
 className="flex items-center gap-6 bg-[var(--ease2event-bg-surface)] px-6 py-5 rounded-xl border-2 border-[var(--ease2event-border-base)] self-center"
 >
 <div className="w-3 h-3 bg-blue-500 rounded-full" />
 <p className="text-[var(--ease2event-text-primary)] font-bold text-lg tracking-tight">{selectedImage.title}</p>
 <div className="h-5 w-0.5 bg-[var(--ease2event-border-subtle)] mx-1" />
 <span className="text-xs font-bold text-[var(--ease2event-text-secondary)] tracking-widest">{new Date(selectedImage.createdAt).toLocaleDateString()}</span>
 </div>
 )}
 </div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default Gallery;
