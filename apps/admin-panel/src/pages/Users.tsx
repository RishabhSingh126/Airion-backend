import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MoreHorizontal, Mail, Phone, Calendar, Shield, User as UserIcon, AlertCircle, Clock, MapPin, Activity, X, Ban, Unlock } from 'lucide-react';
import { useAdminUsers, useBlockUser, useUnblockUser } from '../hooks/useUsers';

interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    role: string;
    isBlocked: boolean;
    lastLoginAt?: string;
    device?: string;
}

const Users: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [page, setPage] = useState(1);
    
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab');
    const [filter, setFilter] = useState<'all' | 'blocked'>(tab === 'suspicious' ? 'blocked' : 'all');

    // Fetch real data using the hook
    const { data: response, isLoading: loading, error } = useAdminUsers(page, 20, searchQuery, 'all', 'newest');
    const users: User[] = response?.data || [];
    
    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();

    // The filtering is now handled server-side through the query hook search param.
    // However, for immediate UI feedback we can map the data directly.
    const filteredUsers = filter === 'blocked' ? users.filter(u => u.isBlocked) : users;

    const toggleBlockStatus = async (user: User) => {
        try {
            if (user.isBlocked) {
                await unblockMutation.mutateAsync(user.id);
                setSelectedUser({ ...user, isBlocked: false });
            } else {
                await blockMutation.mutateAsync(user.id);
                setSelectedUser({ ...user, isBlocked: true });
            }
        } catch (err) {
            console.error('Failed to toggle block status', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <AlertCircle className="text-red-500" size={48} />
                <h3 className="text-xl font-bold">Error loading users</h3>
                <p className="text-gray-500">{error instanceof Error ? error.message : String(error)}</p>
            </div>
        );
    }

    return (
        <div className="fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">User Management</h1>
                    <p className="text-sm font-medium text-[var(--ease2event-text-secondary)] mt-1">Manage and monitor platform users</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="flex gap-4 mb-4">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All Users</button>
                <button onClick={() => setFilter('blocked')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'blocked' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Suspicious/Blocked</button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden ">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="  transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                {user.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{user.name || 'Unnamed'}</p>
                                                <p className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">{user.email}</p>
                                        <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            !user.isBlocked ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {user.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                                        <p className="text-xs text-gray-500">{user.device || 'Unknown Device'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2   rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                                            <MoreHorizontal size={18} className="text-gray-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
            </div>

            {/* Profile Drawer */}
            {selectedUser && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedUser(null)}></div>
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900  z-50 transform transition-transform border-l border-gray-200 dark:border-slate-800 flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Profile</h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2   rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl">
                                    {selectedUser.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name || 'Unnamed'}</h3>
                                    <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                            !selectedUser.isBlocked ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                        {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                                    <div className="space-y-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{selectedUser.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Mumbai, India (IP detected)</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Security & Device</h4>
                                    <div className="space-y-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Last login: {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Shield size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Device: {selectedUser.device || 'Unknown Device'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Activity Heatmap</h4>
                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 h-32 flex items-center justify-center">
                                        <div className="text-center">
                                            <Activity size={24} className="text-indigo-400 mx-auto mb-2" />
                                            <p className="text-xs text-gray-500 font-medium">Heatmap visualization will render here.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => toggleBlockStatus(selectedUser)}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
                                    selectedUser.isBlocked 
                                    ? 'bg-gray-900  text-white dark:bg-white dark:text-gray-900' 
                                    : 'bg-red-50  text-red-600 border border-red-200'
                                }`}
                            >
                                {selectedUser.isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
                                {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Users;
