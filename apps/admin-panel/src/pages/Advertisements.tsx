import React, { useState, useRef } from 'react';
import { Search, CheckCircle, XCircle, PauseCircle, Activity, Image as ImageIcon, Calendar, Plus, UploadCloud, Eye, MousePointer2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAdvertisements, useApproveAdvertisement, useRejectAdvertisement, useExpireAdvertisement, useCreateAdvertisement } from '../hooks/useAdvertisements';
import { useAdminVendors } from '../hooks/useVendors';
import { authApi } from '@ease2event/shared/auth/api';

interface Ad {
    id: string;
    campaignName: string;
    vendorName: string;
    adType: string;
    status: 'pending' | 'active' | 'paused' | 'rejected';
    dailyBudget: number;
    totalBudget: number;
    startDate: string;
    endDate: string;
    impressions: number;
    clicks: number;
}

const Advertisements: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [vendorId, setVendorId] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [adType, setAdType] = useState('Banner');
    const [dailyBudget, setDailyBudget] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: adsData, isLoading } = useAdminAdvertisements();
    const { data: vendorsResponse } = useAdminVendors(1, 100, '', 'all', 'all');
    const createAdMutation = useCreateAdvertisement();
    const approveMutation = useApproveAdvertisement();
    const rejectMutation = useRejectAdvertisement();
    const expireMutation = useExpireAdvertisement();

    const ads: Ad[] = adsData || [];
    const vendors = vendorsResponse?.data || [];

    const handleApprove = async (id: string) => {
        await approveMutation.mutateAsync(id);
    };

    const handleReject = async (id: string) => {
        await rejectMutation.mutateAsync(id);
    };

    const handleExpire = async (id: string) => {
        await expireMutation.mutateAsync(id);
    };

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            return toast.error('Please upload an image file');
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await authApi.post('/uploads/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data?.url) {
                setImageUrl(response.data.url);
                toast.success('Banner uploaded successfully!');
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (err: any) {
            console.error('Banner upload error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to upload banner');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleBrowseClick = () => {
        if (isModalOpen) {
            fileInputRef.current?.click();
        } else {
            setIsModalOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId) return toast.error('Select a vendor');
        if (!campaignName.trim()) return toast.error('Enter campaign name');
        if (!dailyBudget || !totalBudget) return toast.error('Enter budget details');
        if (!startDate || !endDate) return toast.error('Enter campaign dates');
        if (!imageUrl) return toast.error('Please upload a campaign banner');

        try {
            await createAdMutation.mutateAsync({
                vendorId,
                campaignName: campaignName.trim(),
                adType: adType.toLowerCase(),
                dailyBudget: parseFloat(dailyBudget),
                totalBudget: parseFloat(totalBudget),
                startDate,
                endDate,
                mediaUrls: [imageUrl],
            });
            setIsModalOpen(false);
            // Reset form
            setVendorId('');
            setCampaignName('');
            setAdType('Banner');
            setDailyBudget('');
            setTotalBudget('');
            setStartDate('');
            setEndDate('');
            setImageUrl('');
        } catch (err) {
            // Error toast handled by hook
        }
    };

    const filteredAds = ads.filter(ad => 
        ad.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-200';
            case 'paused': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="fade-in pb-12">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect} 
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">Advertisements</h1>
                    <p className="text-sm font-medium text-[var(--ease2event-text-secondary)] mt-1">Manage vendor ad campaigns and monitor performance</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600  text-white font-bold rounded-xl   transition-all"
                >
                    <Plus size={18} />
                    <span>Create Campaign</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl  border border-gray-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search campaigns or vendors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Ad Card (Drag & Drop Preview) */}
                <div 
                    onClick={() => setIsModalOpen(true)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="bg-gray-50 dark:bg-slate-900/50 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-[32px] p-8 flex flex-col items-center justify-center text-center   transition-colors cursor-pointer group min-h-[400px]"
                >
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4  group-hover:scale-110 transition-transform">
                        <UploadCloud size={28} className="text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create New Ad Campaign</h3>
                    <p className="text-sm text-gray-500 max-w-sm mb-6">Click to build a campaign, select a vendor, set target budget, and upload ad banner assets.</p>
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold rounded-xl   transition-colors"
                    >
                        Start Campaign Builder
                    </button>
                </div>

                {filteredAds.map((ad) => (
                    <div key={ad.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px]  border border-gray-200 dark:border-slate-800 flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{ad.campaignName}</h3>
                                    <p className="text-sm font-medium text-indigo-600 mb-3">{ad.vendorName}</p>
                                    <div className="flex gap-2">
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${getStatusColor(ad.status)}`}>
                                            {ad.status}
                                        </span>
                                        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase border bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex items-center gap-1">
                                            {(ad.adType as any) === 'Video' ? <Activity size={12}/> : <ImageIcon size={12}/>}
                                            {ad.adType}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{ad.totalBudget.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 font-medium">₹{ad.dailyBudget}/day</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6 text-sm font-medium text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                                <Calendar size={16} className="text-gray-400" />
                                {ad.startDate} — {ad.endDate}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl flex flex-col gap-1 border border-indigo-100 dark:border-indigo-900/30">
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1"><Eye size={12}/> Impressions</p>
                                    <p className="text-lg font-black text-indigo-900 dark:text-indigo-300">{ad.impressions.toLocaleString()}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl flex flex-col gap-1 border border-emerald-100 dark:border-emerald-900/30">
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1"><MousePointer2 size={12}/> Clicks</p>
                                    <p className="text-lg font-black text-emerald-900 dark:text-emerald-300">{ad.clicks.toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl flex flex-col gap-1 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1"><Activity size={12}/> CTR</p>
                                    <p className="text-lg font-black text-amber-900 dark:text-amber-300">
                                        {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0'}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            {ad.status === 'pending' && (
                                <>
                                    <button onClick={() => handleApprove(ad.id)} className="flex-1 py-3 bg-emerald-50  text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                    <button onClick={() => handleReject(ad.id)} className="flex-1 py-3 bg-rose-50  text-rose-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                        <XCircle size={18} /> Reject
                                    </button>
                                </>
                            )}
                            {ad.status === 'active' && (
                                <button onClick={() => handleExpire(ad.id)} className="flex-1 py-3 bg-amber-50  text-amber-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                    <PauseCircle size={18} /> End Campaign
                                </button>
                            )}
                            {(ad.status === 'paused' || ad.status === 'rejected') && (
                                <button onClick={() => handleApprove(ad.id)} className="flex-1 py-3 bg-emerald-50  text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                    <Activity size={18} /> Restart Campaign
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaign Creator Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px]  border border-gray-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-8">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-gray-400  "
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Ad Campaign</h2>
                        <p className="text-sm text-gray-500 mb-6">Launch a new advertisement campaign on behalf of a vendor.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Select Vendor</label>
                                    <select
                                        required
                                        value={vendorId}
                                        onChange={(e) => setVendorId(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="" className="text-gray-900 dark:bg-slate-900">Choose vendor...</option>
                                        {vendors.map((v: any) => (
                                            <option key={v.id} value={v.id} className="text-gray-900 dark:bg-slate-900">
                                                {v.businessName || v.user?.name || 'Unnamed Vendor'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Campaign Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Summer Bridal Promo"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Ad Type</label>
                                    <select
                                        value={adType}
                                        onChange={(e) => setAdType(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="Banner" className="text-gray-900 dark:bg-slate-900">Banner</option>
                                        <option value="Featured" className="text-gray-900 dark:bg-slate-900">Featured</option>
                                        <option value="Category" className="text-gray-900 dark:bg-slate-900">Category</option>
                                        <option value="City" className="text-gray-900 dark:bg-slate-900">City</option>
                                        <option value="Event" className="text-gray-900 dark:bg-slate-900">Event</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Daily Budget (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="e.g. 500"
                                        value={dailyBudget}
                                        onChange={(e) => setDailyBudget(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Total Budget (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="e.g. 5000"
                                        value={totalBudget}
                                        onChange={(e) => setTotalBudget(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Banner Asset Uploader */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Campaign Banner / Image</label>
                                <div 
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={handleBrowseClick}
                                    className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer   transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : imageUrl ? (
                                        <div className="relative group w-full max-h-48 overflow-hidden rounded-xl">
                                            <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover max-h-40" />
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setImageUrl(''); }}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5   transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud size={32} className="text-gray-400" />
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Click or Drag & Drop image file here</p>
                                            <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={!vendorId || !campaignName.trim() || !dailyBudget || !totalBudget || !startDate || !endDate || !imageUrl || createAdMutation.isPending || uploading}
                                    className="flex-1 py-3 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
                                >
                                    {createAdMutation.isPending ? 'Creating Campaign...' : 'Launch Campaign'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100  dark:bg-slate-800  text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Advertisements;
