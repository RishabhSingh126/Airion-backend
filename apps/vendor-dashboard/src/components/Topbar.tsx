import React from 'react';
import { Bell, Search, ChevronDown, Menu, Moon, Sun, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@ease2event/shared';
import { Avatar } from '@ease2event/ui';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';


interface TopbarProps {
 title: string;
 onMenuClick: () => void;
}

const getDisplayName = (user: any) => {
  if (!user) return 'Vendor';
  const name = user.name;
  if (name && typeof name === 'string') {
    const cleaned = name.replace(/^User\s+/i, '').trim();
    if (cleaned.length > 0 && !cleaned.includes('@')) {
      return cleaned;
    }
  }
  return user.email || 'Vendor';
};

const Topbar: React.FC<TopbarProps> = ({ title, onMenuClick }) => {
 const { user, logout } = useAuth();
 const { theme, toggleTheme } = useTheme();
 const navigate = useNavigate();
 const [isNotifOpen, setIsNotifOpen] = React.useState(false);
 const [isProfileOpen, setIsProfileOpen] = React.useState(false);
 const queryClient = useQueryClient();

 const { data: notifications = [] } = useQuery({
 queryKey: ['notifications'],
 queryFn: async () => {
 const res = await api.get('/notifications') as any;
 return res.data || res;
 },
 enabled: !!user
 });

 const markAsRead = useMutation({
 mutationFn: async (id: string) => await api.patch(`/notifications/${id}/read`),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
 });

 const markAllAsRead = useMutation({
 mutationFn: async () => await api.post('/notifications/read-all'),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
 });

 const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

 const handleNotificationClick = (notif: any) => {
 if (!notif.isRead) markAsRead.mutate(notif.id);
 setIsNotifOpen(false);
 
 if (notif.type?.includes('booking')) {
 navigate('/bookings');
 } else if (notif.type === 'message_received' || notif.type?.includes('enquiry')) {
 navigate('/enquiries');
 } else if (notif.type === 'review_added') {
 navigate('/analytics');
 } else if (notif.type?.includes('listing') || notif.type?.includes('service')) {
 navigate('/events');
 } else if (notif.data?.url) {
 navigate(notif.data.url);
 }
 };

 // Close menus when clicking outside
 const navRef = React.useRef<HTMLDivElement>(null);
 React.useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (navRef.current && !navRef.current.contains(e.target as Node)) {
 setIsNotifOpen(false);
 setIsProfileOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 return (
 <header className="glass-panel h-[70px] flex items-center justify-between px-7 sticky top-0 z-50 transition-colors border-x-0 border-t-0 border-b border-[var(--ease2event-border-subtle)]">
 <div className="flex items-center gap-3 md:gap-4 flex-1">
 <button
 onClick={onMenuClick}
 className="md:hidden p-2 -ml-2 text-[var(--ease2event-text-secondary)] hover:bg-[rgba(108,99,255,0.05)] rounded-lg shrink-0"
 >
 <Menu size={20} />
 </button>
 </div>

 <div className="hidden lg:flex flex-1 justify-center px-8">
 <div className="flex items-center gap-4 max-w-lg w-full bg-[var(--ease2event-bg-elevated)] px-5 py-2.5 rounded-xl border border-[var(--ease2event-border-subtle)] focus-within:border-[var(--ease2event-brand-primary)] transition-all shadow-sm">
 <Search className="text-[var(--ease2event-text-muted)]" size={18} />
 <input
 type="text"
 placeholder="Search for anything..."
 className="w-full outline-none bg-transparent text-sm font-bold text-[var(--ease2event-text-primary)] placeholder-[var(--ease2event-text-muted)] tracking-wide"
 />
 </div>
 </div>

 <div ref={navRef} className="flex items-center justify-end gap-3 md:gap-6 flex-1 relative">
 <button onClick={() => {
     const landingUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin.replace(':5174', ':5173').replace(':5175', ':5173');
     window.location.href = landingUrl;
 }} className="p-2.5 hover:bg-[rgba(108,99,255,0.06)] rounded-xl transition-all text-[var(--ease2event-brand-primary)] border border-transparent cursor-pointer">
 <Home size={20} />
 </button>
 <button onClick={toggleTheme} className="p-2.5 hover:bg-[rgba(108,99,255,0.06)] rounded-xl transition-all text-[var(--ease2event-text-secondary)] border border-transparent cursor-pointer">
 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
 </button>

 <div className="relative">
 <button
 onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
 className={`relative p-2.5 hover:bg-[rgba(108,99,255,0.06)] rounded-xl transition-all text-[var(--ease2event-text-secondary)] border border-transparent cursor-pointer ${isNotifOpen ? 'bg-[rgba(108,99,255,0.08)] text-[var(--ease2event-brand-primary)]' : ''}`}
 >
 <Bell size={20} />
 {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[var(--ease2event-bg-surface)] z-10 animate-pulse"></span>}
 </button>

 {isNotifOpen && (
 <div className="fixed inset-x-4 md:absolute md:right-0 md:left-auto mt-3 md:w-80 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-2xl shadow-[var(--ease2event-shadow-lg)] origin-top md:origin-top-right z-50 top-[75px] md:top-auto">
 <div className="p-4 border-b border-[var(--ease2event-border-subtle)]">
 <h3 className="font-bold text-[var(--ease2event-text-primary)]">Notifications</h3>
 </div>
 <div className="max-h-[300px] overflow-y-auto">
 {Array.isArray(notifications) && notifications.length > 0 ? notifications.map((notif: any, i: number) => (
 <div key={i} onClick={() => handleNotificationClick(notif)} className={`p-4 border-b border-[var(--ease2event-border-subtle)] last:border-0 hover:bg-[var(--ease2event-bg-elevated)] transition-colors cursor-pointer ${!notif.isRead ? 'bg-[var(--ease2event-brand-primary)]/5' : ''}`}>
 <div className="flex justify-between items-start mb-1">
 <h4 className={`text-sm font-bold ${!notif.isRead ? 'text-[var(--ease2event-text-primary)]' : 'text-[var(--ease2event-text-secondary)]'}`}>{notif.title || 'Notification'}</h4>
 <span className="text-xs font-bold text-[var(--ease2event-text-muted)]">{new Date(notif.createdAt).toLocaleDateString()}</span>
 </div>
 <p className="text-sm text-[var(--ease2event-text-muted)] font-semibold">{notif.message}</p>
 </div>
 )) : <div className="p-6 text-center text-sm font-bold text-[var(--ease2event-text-muted)]">No notifications</div>}
 </div>
 {unreadCount > 0 && (
 <div onClick={() => markAllAsRead.mutate()} className="p-3 border-t border-[var(--ease2event-border-subtle)] text-center cursor-pointer hover:text-[var(--ease2event-brand-primary)]">
 <span className="text-xs font-bold text-[var(--ease2event-text-secondary)]">Mark all as read</span>
 </div>
 )}
 </div>
 )}
 </div>

 <div className="relative border-l border-[var(--ease2event-border-subtle)] pl-2 md:pl-5">
 <div
 onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
 className={`flex items-center gap-2 md:gap-4 cursor-pointer hover:bg-[rgba(108,99,255,0.05)] p-1.5 md:pr-3 rounded-xl transition-all ${isProfileOpen ? 'bg-[rgba(108,99,255,0.05)]' : ''}`}
 >
 <Avatar
 src={user?.vendor?.logo || (user as any)?.avatar}
 name={getDisplayName(user)}
 size="sm"
 />
 <div className="hidden md:block">
 <p className="text-sm font-semibold text-[var(--ease2event-text-primary)] leading-tight">{getDisplayName(user)}</p>
 <p className="text-[10px] text-[var(--ease2event-text-muted)] leading-tight font-bold tracking-widest opacity-60 truncate max-w-[120px]">{user?.email || user?.phoneNumber || ''}</p>
 </div>
 <ChevronDown size={16} className={`text-[var(--ease2event-text-muted)] hidden md:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
 </div>

 {isProfileOpen && (
 <div className="fixed inset-x-4 md:absolute md:right-0 md:left-auto mt-3 md:w-56 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-2xl shadow-[var(--ease2event-shadow-lg)] origin-top md:origin-top-right z-50 overflow-hidden top-[75px] md:top-auto">
 <div className="p-4 border-b border-[var(--ease2event-border-subtle)] bg-[var(--ease2event-bg-elevated)]/50">
 <p className="font-bold text-[var(--ease2event-text-primary)] text-sm truncate">{getDisplayName(user)}</p>
 <p className="text-xs text-[var(--ease2event-text-muted)] truncate">{user?.email || 'vendor@ease2event.in'}</p>
 </div>
 <div className="p-2 space-y-1">
 <button onClick={() => { setIsProfileOpen(false); navigate('/profile'); }} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[var(--ease2event-text-secondary)] hover:text-[var(--ease2event-text-primary)] hover:bg-[var(--ease2event-bg-elevated)] transition-colors">
 Account Settings
 </button>
 <button onClick={() => { setIsProfileOpen(false); navigate('/'); }} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[var(--ease2event-text-secondary)] hover:text-[var(--ease2event-text-primary)] hover:bg-[var(--ease2event-bg-elevated)] transition-colors">
 Dashboard
 </button>
 <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
 Logout
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </header>
 );
};

export default Topbar;
