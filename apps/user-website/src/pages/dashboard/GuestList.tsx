import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Mail, Phone, CheckCircle, Clock, XCircle, Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export type GroupType = 'Bride Side' | 'Groom Side' | 'Friends' | 'Family' | 'VVIP' | 'Uncategorized';
export type StatusType = 'Confirmed' | 'Pending' | 'Declined';

export interface Guest {
    id: string;
    name: string;
    email: string;
    phone: string;
    group: GroupType;
    status: StatusType;
}

const FILTER_TABS = ['All', 'Bride Side', 'Groom Side', 'Friends', 'Family', 'VVIP'];

export default function GuestList() {
    const [guests, setGuests] = useState<Guest[]>(() => {
        try {
            const saved = localStorage.getItem('ease2event_guests');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('ease2event_guests', JSON.stringify(guests));
        } catch (e) {
            console.error('Failed to save guests:', e);
        }
    }, [guests]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [guestToDelete, setGuestToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Guest, 'id'>>({
        name: '',
        email: '',
        phone: '',
        group: 'Friends',
        status: 'Pending'
    });

    const filteredGuests = useMemo(() => {
        return guests.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  g.phone.includes(searchQuery);
            const matchesFilter = activeFilter === 'All' || g.group === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [guests, searchQuery, activeFilter]);

    const stats = useMemo(() => {
        const confirmed = guests.filter(g => g.status === 'Confirmed').length;
        const pending = guests.filter(g => g.status === 'Pending').length;
        const declined = guests.filter(g => g.status === 'Declined').length;
        const total = guests.length;
        return { confirmed, pending, declined, total };
    }, [guests]);

    const openModal = (guest?: Guest) => {
        if (guest) {
            setEditingGuestId(guest.id);
            setFormData({
                name: guest.name,
                email: guest.email !== 'N/A' ? guest.email : '',
                phone: guest.phone,
                group: guest.group,
                status: guest.status
            });
        } else {
            setEditingGuestId(null);
            setFormData({ name: '', email: '', phone: '', group: 'Friends', status: 'Pending' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGuestId(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        if (editingGuestId) {
            setGuests(guests.map(g => g.id === editingGuestId ? { ...formData, id: editingGuestId, email: formData.email || 'N/A' } : g));
            toast.success('Guest updated');
        } else {
            const newGuest: Guest = {
                ...formData,
                id: Date.now().toString(),
                email: formData.email || 'N/A'
            };
            setGuests([newGuest, ...guests]);
            toast.success('Guest added');
        }
        closeModal();
    };

    const openDeleteModal = (id: string) => {
        setGuestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (guestToDelete) {
            setGuests(guests.filter(g => g.id !== guestToDelete));
            toast.success('Guest removed');
            setIsDeleteModalOpen(false);
            setGuestToDelete(null);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setGuestToDelete(null);
    };

    const getInitialColor = (name: string) => {
        const char = name.charAt(0).toUpperCase();
        if (['A', 'E', 'I', 'O', 'U'].includes(char)) return 'bg-red-100 text-red-500';
        if (['P', 'R', 'S', 'T'].includes(char)) return 'bg-orange-100 text-orange-500';
        if (['V', 'W', 'X', 'Y', 'Z'].includes(char)) return 'bg-emerald-100 text-emerald-600';
        return 'bg-blue-100 text-blue-500';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Guest List</h1>
                    <p className="text-gray-500 font-semibold mt-1">Manage your event attendees and status.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                    <Plus size={18} /> Add Guest
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Table Area) */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full md:w-72 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search guests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full hide-scrollbar">
                            {FILTER_TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                                        activeFilter === tab
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-800 hover:border-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800">
                                        <th className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400">Guest</th>
                                        <th className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400">Contact</th>
                                        <th className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400">Group</th>
                                        <th className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGuests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-500 font-semibold">
                                                No guests found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredGuests.map((guest) => (
                                            <tr key={guest.id} className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getInitialColor(guest.name)}`}>
                                                            {guest.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white">{guest.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                        <Mail size={14} /> {guest.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                        <Phone size={14} /> {guest.phone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{guest.group}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`flex items-center gap-2 text-sm font-bold ${
                                                        guest.status === 'Confirmed' ? 'text-green-500' :
                                                        guest.status === 'Pending' ? 'text-orange-500' :
                                                        'text-red-500'
                                                    }`}>
                                                        {guest.status === 'Confirmed' && <CheckCircle size={16} />}
                                                        {guest.status === 'Pending' && <Clock size={16} />}
                                                        {guest.status === 'Declined' && <XCircle size={16} />}
                                                        {guest.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button 
                                                            onClick={() => openModal(guest)}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => openDeleteModal(guest.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <UsersIcon className="text-gray-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white">Summary</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Confirmed</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.confirmed}</p>
                            </div>
                            
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}
                                />
                            </div>

                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Declined</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.declined}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Need Help Card */}
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-3xl p-6 border border-orange-100 dark:border-orange-900/30">
                        <h3 className="font-bold text-gray-900 dark:text-orange-100 mb-2">Need Help?</h3>
                        <p className="text-sm font-semibold text-gray-600 dark:text-orange-200/70 mb-6 leading-relaxed">
                            Send digital invites to your guests to track RSVPs.
                        </p>
                        <button 
                            onClick={() => toast('Digital Invites coming soon!', { icon: '✉️' })}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                        >
                            Send Digital Invites
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                {editingGuestId ? 'Edit Guest' : 'Add New Guest'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-gray-900 dark:text-white"
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-gray-900 dark:text-white"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-gray-900 dark:text-white"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Group</label>
                                    <div className="relative">
                                        <select
                                            value={formData.group}
                                            onChange={(e) => setFormData({ ...formData, group: e.target.value as GroupType })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-gray-900 dark:text-white appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="Bride Side">Bride Side</option>
                                            <option value="Groom Side">Groom Side</option>
                                            <option value="Friends">Friends</option>
                                            <option value="Family">Family</option>
                                            <option value="VVIP">VVIP</option>
                                            <option value="Uncategorized">Uncategorized</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusType })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-semibold text-gray-900 dark:text-white appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Declined">Declined</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-black tracking-wide rounded-xl transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {editingGuestId ? 'Save Changes' : 'Add Guest'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Remove Guest?</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6 leading-relaxed">
                                Are you sure you want to remove this guest? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors"
                                >
                                    Yes, Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

// Minimal missing icon wrapper since it wasn't exported directly from lucide usually like this without check
function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
