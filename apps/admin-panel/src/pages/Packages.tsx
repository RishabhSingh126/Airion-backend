import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, X, Users } from 'lucide-react';
import { useAdminPackages, useCreatePackage, useUpdatePackage, useDeletePackage, useAdminPackageInquiries, useAssignVendorToInquiry } from '../hooks/usePackages';
import { useAdminVendors } from '../hooks/useVendors';

const Packages: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'packages' | 'inquiries'>('packages');
    
    // Packages Modal
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editPackageId, setEditPackageId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [featuresStr, setFeaturesStr] = useState('');

    const { data: packages = [], isLoading: isLoadingPackages } = useAdminPackages();
    const { data: inquiries = [], isLoading: isLoadingInquiries } = useAdminPackageInquiries();
    const { data: vendorsData } = useAdminVendors(1, 100, '', 'all', 'all');
    const vendors = vendorsData?.data || [];

    const createPackageMutation = useCreatePackage();
    const updatePackageMutation = useUpdatePackage();
    const deletePackageMutation = useDeletePackage();
    const assignVendorMutation = useAssignVendorToInquiry();

    const openCreateModal = () => {
        setEditPackageId(null);
        setTitle('');
        setDescription('');
        setBasePrice('');
        setFeaturesStr('');
        setIsPackageModalOpen(true);
    };

    const openEditModal = (pkg: any) => {
        setEditPackageId(pkg.id);
        setTitle(pkg.title);
        setDescription(pkg.description);
        setBasePrice(pkg.basePrice.toString());
        setFeaturesStr((pkg.features || []).join('\n'));
        setIsPackageModalOpen(true);
    };

    const handleSavePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        const features = featuresStr.split('\n').map(f => f.trim()).filter(f => f);
        const payload = {
            title,
            description,
            basePrice: parseFloat(basePrice) || 0,
            features
        };

        if (editPackageId) {
            await updatePackageMutation.mutateAsync({ id: editPackageId, data: payload });
        } else {
            await createPackageMutation.mutateAsync(payload);
        }
        setIsPackageModalOpen(false);
    };

    const handleDeletePackage = async (id: string) => {
        if (confirm('Are you sure you want to delete this package?')) {
            await deletePackageMutation.mutateAsync(id);
        }
    };

    const handleAssignVendor = async (inquiryId: string, vendorId: string) => {
        if (!vendorId) return;
        await assignVendorMutation.mutateAsync({ id: inquiryId, vendorId });
    };

    return (
        <div className="fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">Packages & Inquiries</h1>
                    <p className="text-sm font-medium text-[var(--ease2event-text-secondary)] mt-1">Manage global packages and assign customer inquiries to vendors.</p>
                </div>
                
                {activeTab === 'packages' && (
                    <button 
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl transition-all"
                    >
                        <Plus size={18} /> Add New Package
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`flex items-center gap-2 pb-4 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'packages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
                >
                    <Package size={18} /> Packages
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`flex items-center gap-2 pb-4 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'inquiries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
                >
                    <Users size={18} /> Inquiries
                </button>
            </div>

            {activeTab === 'packages' && (
                isLoadingPackages ? (
                    <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.isArray(packages) && packages.map((pkg: any) => (
                            <div key={pkg.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(pkg)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeletePackage(pkg.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pkg.title}</h3>
                                <p className="text-indigo-600 font-bold mb-4">₹{pkg.basePrice}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{pkg.description}</p>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'inquiries' && (
                isLoadingInquiries ? (
                    <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Info</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Package</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Vendor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {Array.isArray(inquiries) && inquiries.map((inq: any) => (
                                    <tr key={inq.id} className="transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{inq.customerName}</p>
                                            <p className="text-sm text-gray-500">{inq.customerEmail}</p>
                                            <p className="text-sm text-gray-500">{inq.customerPhone}</p>
                                            {inq.eventDate && <p className="text-xs text-gray-400 mt-1">Date: {inq.eventDate}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {inq.package?.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${inq.status === 'ASSIGNED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {inq.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select 
                                                value={inq.vendorId || ''} 
                                                onChange={(e) => handleAssignVendor(inq.id, e.target.value)}
                                                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                            >
                                                <option value="" disabled className="bg-white dark:bg-slate-800">Select Vendor</option>
                                                {vendors.map((v: any) => (
                                                    <option key={v.id} value={v.id} className="bg-white dark:bg-slate-800">{v.businessName}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Package Modal */}
            {isPackageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-200 dark:border-slate-800 w-full max-w-md relative p-8 max-h-[90vh] overflow-y-auto">
                        <button type="button" onClick={() => setIsPackageModalOpen(false)} className="absolute top-6 right-6 text-gray-400">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{editPackageId ? 'Edit' : 'Add'} Package</h2>
                        
                        <form onSubmit={handleSavePackage} className="space-y-5 mt-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Base Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={basePrice}
                                    onChange={(e) => setBasePrice(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Features (One per line)</label>
                                <textarea
                                    value={featuresStr}
                                    onChange={(e) => setFeaturesStr(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                    rows={3}
                                    placeholder="e.g. 5 hours of service&#10;2 photographers"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                                    className="flex-1 py-3 bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                                >
                                    {editPackageId ? 'Save Changes' : 'Create Package'}
                                </button>
                                <button type="button" onClick={() => setIsPackageModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold transition-colors">
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

export default Packages;
