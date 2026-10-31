import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Edit3, Trash2, X, Loader2, Upload, ShoppingBag,
    CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Skeleton } from '@ease2event/ui';
import { useAuth } from '@ease2event/shared';
import api, { uploadImage } from '../lib/api';
import toast from 'react-hot-toast';

interface ShopItem {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
    approvalStatus: 'pending' | 'approved' | 'rejected';
}

const ShopItems: React.FC = () => {
    const { user } = useAuth();
    const vendorId = user?.vendor?.id || '';
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ShopItem[]>([]);
    
    const initialFormState = {
        title: '',
        description: '',
        price: '',
        category: 'Decor',
        stock: '',
        image: ''
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await api.get('/merchandise', { params: { vendorId } });
            const data = (res as any).data || res;
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch shop items:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadPromise = uploadImage(file);
        
        toast.promise(uploadPromise, {
            loading: 'Uploading image...',
            success: 'Image uploaded successfully!',
            error: 'Failed to upload image.',
        });

        try {
            const res = await uploadPromise;
            setFormData(prev => ({ ...prev, image: res.url || res.imageUrl || '' }));
        } catch (error) {
            console.error('Upload error', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.price || !formData.category) {
            return toast.error("Please fill all required fields.");
        }
        
        const payload = {
            title: formData.title,
            description: formData.description,
            price: Number(formData.price),
            stock: Number(formData.stock) || 0,
            category: formData.category,
            image: formData.image
        };

        try {
            setSubmitting(true);
            
            if (editingId && !editingId.startsWith('shop-')) {
                await api.put(`/merchandise/${editingId}`, payload);
                toast.success('Item updated successfully!');
            } else {
                await api.post('/merchandise', payload);
                if (editingId && editingId.startsWith('shop-')) {
                    setItems(prev => prev.filter(item => item.id !== editingId));
                }
                toast.success('Item created! It is pending approval.');
            }
            
            setFormData(initialFormState);
            setIsAdding(false);
            setEditingId(null);
            fetchItems();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        if (itemToDelete.startsWith('shop-')) {
            setItems(prev => prev.filter(item => item.id !== itemToDelete));
            toast.success("Item deleted.");
            setItemToDelete(null);
            return;
        }

        try {
            setIsDeleting(true);
            await api.delete(`/merchandise/${itemToDelete}`);
            toast.success("Item deleted.");
            fetchItems();
            setItemToDelete(null);
        } catch (error) {
            toast.error("Failed to delete item.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (item: ShopItem) => {
        setFormData({
            title: item.title,
            description: item.description || '',
            price: item.price.toString(),
            category: item.category,
            stock: item.stock.toString(),
            image: item.image || ''
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="text-indigo-500" />
                        Event Shop Items
                    </h1>
                    <p className="text-gray-500 mt-1">Manage physical products you want to sell on the marketplace.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
                        />
                    </div>
                    <Button variant="primary" className="rounded-xl" onClick={() => {
                        setFormData(initialFormState);
                        setEditingId(null);
                        setIsAdding(true);
                    }}>
                        <Plus size={18} />
                        Add Item
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                            <Skeleton className="w-full h-48 rounded-xl mb-4" />
                            <Skeleton className="w-3/4 h-6 mb-2" />
                            <Skeleton className="w-1/2 h-4 mb-4" />
                        </div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag className="text-indigo-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
                    <p className="text-gray-500 mb-6 max-w-md">You haven't added any products to the shop yet. Start selling decorations, gifts, or other physical items.</p>
                    <Button variant="primary" className="rounded-xl" onClick={() => setIsAdding(true)}>
                        <Plus size={18} /> Add Your First Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group relative">
                            {/* Status Badge */}
                            <div className="absolute top-3 left-3 z-10 flex gap-2">
                                {item.approvalStatus === 'approved' && (
                                    <Badge variant="confirmed" className="shadow-sm font-bold bg-white/90 backdrop-blur-md">
                                        <CheckCircle2 size={12} className="mr-1" /> Approved
                                    </Badge>
                                )}
                                {item.approvalStatus === 'pending' && (
                                    <Badge variant="pending" className="shadow-sm font-bold bg-white/90 backdrop-blur-md">
                                        <Clock size={12} className="mr-1" /> Pending
                                    </Badge>
                                )}
                                {item.approvalStatus === 'rejected' && (
                                    <Badge variant="cancelled" className="shadow-sm font-bold bg-white/90 backdrop-blur-md">
                                        <XCircle size={12} className="mr-1" /> Rejected
                                    </Badge>
                                )}
                            </div>

                            <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 bg-white text-gray-700 hover:text-indigo-600 rounded-lg shadow-sm hover:scale-105 transition-all"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-white text-red-500 hover:text-red-700 rounded-lg shadow-sm hover:scale-105 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="h-48 w-full bg-gray-100 dark:bg-slate-800 overflow-hidden relative">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ShoppingBag size={48} className="opacity-20" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                                    <span className="font-black text-indigo-600">₹{item.price}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                                
                                <div className="flex items-center justify-between text-xs font-medium border-t border-gray-100 dark:border-slate-800 pt-4">
                                    <span className="text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">{item.category}</span>
                                    <span className={item.stock > 0 ? "text-green-600" : "text-red-500"}>
                                        {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <>
                        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {editingId ? 'Edit Item' : 'Add New Item'}
                                    </h2>
                                    <p className="text-sm text-gray-500">Items must be approved by admin</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm hover:shadow">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Item Image</label>
                                        <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group">
                                            {formData.image ? (
                                                <div className="relative h-40 w-full rounded-xl overflow-hidden">
                                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <p className="text-white font-medium">Click to change image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-8">
                                                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Click to upload image</p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Item Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g., Elegant Floral Centerpiece"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Price (₹) *</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Stock Quantity</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="Decor">Decor</option>
                                            <option value="Signage">Signage</option>
                                            <option value="Apparel">Apparel</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Gifts">Gifts</option>
                                            <option value="Accessories">Accessories</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
                                        <textarea
                                            rows={4}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                            placeholder="Describe your product..."
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 sticky bottom-0">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAdding(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" className="flex-1 rounded-xl" type="submit" form="item-form" disabled={submitting}>
                                    {submitting ? (
                                        <><Loader2 size={18} className="animate-spin" /> Saving...</>
                                    ) : (
                                        <>{editingId ? 'Save Changes' : 'Submit Item'}</>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {itemToDelete && (
                    <>
                        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setItemToDelete(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Item?</h2>
                                <p className="text-gray-500 mb-8">Are you sure you want to delete this item? This action cannot be undone and will immediately remove it from the shop.</p>
                                
                                <div className="flex gap-4">
                                    <Button variant="outline" className="flex-1 rounded-xl py-3" onClick={() => setItemToDelete(null)} disabled={isDeleting}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" className="flex-1 rounded-xl py-3 !bg-red-600 hover:!bg-red-700 shadow-red-500/20" onClick={confirmDelete} disabled={isDeleting}>
                                        {isDeleting ? (
                                            <><Loader2 size={18} className="animate-spin inline mr-2" /> Deleting...</>
                                        ) : (
                                            'Yes, Delete'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShopItems;
