import React, { useState } from 'react';
import { User, Bell, Lock, Unlock, Shield, Globe, Moon, Sun, Save, Server, Trash2, Key, Mail, Phone, Plus, Database, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

const Settings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('general');

    // Authorized Administrators
    const [admins, setAdmins] = useState<AdminUser[]>([
        { id: '1', name: 'Vinay Sharma', email: 'vinaysharma31681@gmail.com', phone: '9616981292', role: 'Super Admin' },
        { id: '2', name: 'Abhishek Kumar', email: 'abhishekkumar518@gmail.com', phone: '8130607796', role: 'Admin' },
    ]);

    // Modals
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);

    // Notification Settings State
    const [notifyNewBooking, setNotifyNewBooking] = useState(true);
    const [notifyNewVendor, setNotifyNewVendor] = useState(true);
    const [notifyDispute, setNotifyDispute] = useState(true);
    const [notifySupport, setNotifySupport] = useState(false);

    // Advanced settings state
    const [systemMaintenance, setSystemMaintenance] = useState(false);
    const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
    const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPhone.trim()) {
            return toast.error('Please fill in all admin fields');
        }
        const newAdmin: AdminUser = {
            id: Date.now().toString(),
            name: newAdminName.trim(),
            email: newAdminEmail.trim(),
            phone: newAdminPhone.trim(),
            role: 'Admin',
        };
        setAdmins([...admins, newAdmin]);
        setIsAdminModalOpen(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        toast.success(`Admin user ${newAdmin.name} added successfully!`);
    };

    const handleDeleteAdmin = (id: string) => {
        if (confirm('Are you sure you want to remove this admin?')) {
            setAdmins(admins.filter(a => a.id !== id));
            toast.success('Admin user removed');
        }
    };

    const handleBackupDatabase = () => {
        const id = toast.loading('Exporting database schema and data...');
        setTimeout(() => {
            toast.success('Backup export completed successfully: ease2event_db_backup.sql', { id });
        }, 1500);
    };

    const handleClearCache = () => {
        toast.success('Platform application cache cleared successfully');
    };

    const handleSaveGeneral = () => {
        toast.success('General preferences saved successfully');
    };

    const handleSavePlatform = () => {
        toast.success('Platform rules and commission rates updated');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'admin', label: 'Admin Users', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'platform', label: 'Platform & Rules', icon: Shield },
        { id: 'advanced', label: 'Advanced', icon: Server },
    ];

    return (
        <div className="fade-in pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--ease2event-text-primary)]">Settings</h1>
                <p className="text-sm font-medium text-[var(--ease2event-text-secondary)] mt-1">Manage platform configuration and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl  border border-gray-200 dark:border-slate-800 p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'text-gray-600 dark:text-gray-400   font-medium'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl  border border-gray-200 dark:border-slate-800 p-8">

                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">General Settings</h2>
                                    <p className="text-sm text-gray-500 font-medium">Update basic platform information and appearance</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Appearance Theme</h3>
                                            <p className="text-sm text-gray-500 mt-1">Choose between light or dark mode</p>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl  transition-colors "
                                        >
                                            {theme === 'light' ? <Moon size={18} className="text-gray-600" /> : <Sun size={18} className="text-gray-300" />}
                                            <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
                                                {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Platform Name</label>
                                            <input
                                                type="text"
                                                defaultValue="Ease2event UI"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Support Email</label>
                                            <input
                                                type="email"
                                                defaultValue="support@ease2event.com"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveGeneral}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600  text-white rounded-xl font-bold transition-all  "
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'admin' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Administrative Users</h2>
                                        <p className="text-sm text-gray-500 font-medium">Manage administrative portal access and user accounts</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAdminModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600  text-white font-bold rounded-xl  transition-all text-sm"
                                    >
                                        <Plus size={16} /> Add Admin
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {admins.map((admin) => (
                                                <tr key={admin.id} className="  transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900 dark:text-white">{admin.name}</div>
                                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1"><Mail size={12} /> {admin.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> {admin.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-900/50 dark:text-indigo-400">
                                                            {admin.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleDeleteAdmin(admin.id)}
                                                            className="p-1.5 bg-red-50 text-red-600  dark:bg-red-950/30 dark:text-red-400 rounded-lg transition-colors"
                                                            title="Delete admin"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Notification Configurations</h2>
                                    <p className="text-sm text-gray-500 font-medium">Control system updates and trigger parameters</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">SMS on New Booking Requests</h3>
                                            <p className="text-sm text-gray-500">Dispatch text message alerts immediately when bookings are placed</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifyNewBooking} onChange={(e) => setNotifyNewBooking(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email Alert on Vendor Registration</h3>
                                            <p className="text-sm text-gray-500">Notify moderation queue when new merchants apply</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifyNewVendor} onChange={(e) => setNotifyNewVendor(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Instant Alert on Booking Disputes</h3>
                                            <p className="text-sm text-gray-500">Escalate booking complaints directly to dashboard alerts</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifyDispute} onChange={(e) => setNotifyDispute(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Moderator SMS on Support Tickets</h3>
                                            <p className="text-sm text-gray-500">Dispatch high-priority support ticket SMS</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifySupport} onChange={(e) => setNotifySupport(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Security & Access</h2>
                                    <p className="text-sm text-gray-500 font-medium">Protect the admin portal and configure login policies</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Two-Factor Authentication (2FA)</h3>
                                            <p className="text-sm text-gray-500">Enforce OTP verification for all admin logins</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const next = !isTwoFactorEnabled;
                                                setIsTwoFactorEnabled(next);
                                                toast.success(`Two-Factor Authentication ${next ? 'enabled' : 'disabled'} successfully`);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border flex items-center gap-2 ${
                                                isTwoFactorEnabled 
                                                    ? 'bg-emerald-50 text-emerald-600  border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20' 
                                                    : 'bg-rose-50 text-rose-600  border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
                                            }`}
                                        >
                                            {isTwoFactorEnabled ? (
                                                <>
                                                    <Lock size={16} /> Enabled
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock size={16} /> Disabled
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Session Timeout</h3>
                                        <p className="text-sm text-gray-500 mb-4">Automatically log out idle admins</p>
                                        <select className="w-full md:w-64 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 dark:text-white cursor-pointer">
                                            <option>15 Minutes</option>
                                            <option>30 Minutes</option>
                                            <option>1 Hour</option>
                                            <option>Never</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'platform' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Platform Rules & Commission</h2>
                                    <p className="text-sm text-gray-500 font-medium">Configure global business rules for vendors and bookings</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Manual Vendor Approval</h3>
                                            <p className="text-sm text-gray-500">Require admins to approve vendors before they can list services</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Strict KYC Enforcement</h3>
                                            <p className="text-sm text-gray-500">Vendors must complete KYC to receive payouts</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Default Commission Rate</h3>
                                        <p className="text-sm text-gray-500 mb-4">Base percentage taken from all successful bookings</p>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                defaultValue="12"
                                                min="0"
                                                max="100"
                                                className="w-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 dark:text-white text-center"
                                            />
                                            <span className="font-bold text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSavePlatform}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600  text-white rounded-xl font-bold transition-all  "
                                    >
                                        <Save size={18} />
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Advanced Administration</h2>
                                    <p className="text-sm text-gray-500 font-medium">Platform maintenance, cache management, and data operations</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900 rounded-2xl">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5"><AlertTriangle size={18} /> System Maintenance Mode</h3>
                                                <p className="text-sm text-rose-600 dark:text-rose-500/80 mt-1">Make platform temporarily inaccessible to users and vendors. Admins can still log in normally.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={systemMaintenance}
                                                    onChange={(e) => {
                                                        setPendingMaintenanceState(e.target.checked);
                                                        setMaintenanceConfirmOpen(true);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                                            </label>
                                        </div>
                                        {systemMaintenance && (
                                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Platform is currently in Maintenance Mode — users cannot access the site.</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Database size={16} /> Database Backup</h3>
                                                <p className="text-sm text-gray-500 mt-1">Export a full backup of the relational SQL database.</p>
                                            </div>
                                            <button
                                                onClick={handleBackupDatabase}
                                                className="w-full py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl  transition-colors font-bold text-sm text-gray-700 dark:text-slate-200  flex items-center justify-center gap-2"
                                            >
                                                <Database size={16} /> Export Backup File
                                            </button>
                                        </div>

                                        <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><RefreshCw size={16} /> Clear Cache</h3>
                                                <p className="text-sm text-gray-500 mt-1">Reset system memory caches and load active configuration.</p>
                                            </div>
                                            <button
                                                onClick={handleClearCache}
                                                className="w-full py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl  transition-colors font-bold text-sm text-gray-700 dark:text-slate-200  flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} /> Clear All Caches
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Admin User Modal */}
            {isAdminModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px]  border border-gray-200 dark:border-slate-800 w-full max-w-md relative p-8">
                        <button type="button" onClick={() => setIsAdminModalOpen(false)} className="absolute top-6 right-6 text-gray-400  ">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Administrative Account</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Add a user with portal configuration control.</p>

                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Admin Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={newAdminName}
                                    onChange={(e) => setNewAdminName(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. john@ease2event.com"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Authorized Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 9876543210"
                                    value={newAdminPhone}
                                    onChange={(e) => setNewAdminPhone(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600  text-white rounded-xl font-bold transition-all  "
                                >
                                    Add Account
                                </button>
                                <button type="button" onClick={() => setIsAdminModalOpen(false)} className="flex-1 py-3 bg-gray-100  dark:bg-slate-800  text-gray-900 dark:text-white rounded-xl font-bold transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Maintenance Mode Confirmation Modal */}
            {maintenanceConfirmOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[28px]  border border-gray-200 dark:border-slate-800 w-full max-w-md p-8 relative">
                        <button onClick={() => setMaintenanceConfirmOpen(false)} className="absolute top-5 right-5 text-gray-400  ">
                            <X size={22} />
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-5">
                            <AlertTriangle size={28} className="text-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {pendingMaintenanceState ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                            {pendingMaintenanceState
                                ? 'This will make the platform inaccessible to all users and vendors. Only admins will be able to log in. Are you sure?'
                                : 'This will restore full public access to the platform. Confirm to proceed.'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSystemMaintenance(pendingMaintenanceState);
                                    setMaintenanceConfirmOpen(false);
                                    toast.success(`Maintenance Mode ${pendingMaintenanceState ? 'activated' : 'deactivated'} successfully`);
                                }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                                    pendingMaintenanceState
                                        ? 'bg-rose-600  text-white'
                                        : 'bg-emerald-600  text-white'
                                }`}
                            >
                                {pendingMaintenanceState ? 'Yes, Enable' : 'Yes, Disable'}
                            </button>
                            <button
                                onClick={() => setMaintenanceConfirmOpen(false)}
                                className="flex-1 py-3 bg-gray-100  dark:bg-slate-800  text-gray-900 dark:text-white rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
