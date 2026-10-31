import React, { useState, useRef } from 'react';
import { Mail, MessageSquare, Download, Plus, Trash2, Share2, CheckCircle, Users, Sparkles, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ─── Templates ─── */
const TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic Elegance',
        preview: 'bg-gradient-to-br from-amber-50 to-orange-100',
        border: 'border-amber-300',
        titleColor: 'text-amber-800',
        bodyColor: 'text-amber-700',
        accent: '✦',
    },
    {
        id: 'floral',
        name: 'Floral Garden',
        preview: 'bg-gradient-to-br from-pink-50 to-rose-100',
        border: 'border-pink-300',
        titleColor: 'text-pink-800',
        bodyColor: 'text-pink-700',
        accent: '❀',
    },
    {
        id: 'modern',
        name: 'Modern Minimal',
        preview: 'bg-gradient-to-br from-slate-800 to-slate-900',
        border: 'border-slate-600',
        titleColor: 'text-white',
        bodyColor: 'text-slate-300',
        accent: '◆',
    },
    {
        id: 'royal',
        name: 'Royal Gold',
        preview: 'bg-gradient-to-br from-yellow-900 to-amber-900',
        border: 'border-yellow-500',
        titleColor: 'text-yellow-300',
        bodyColor: 'text-yellow-200',
        accent: '♛',
    },
    {
        id: 'minimal',
        name: 'Soft Pastel',
        preview: 'bg-gradient-to-br from-purple-50 to-indigo-100',
        border: 'border-purple-300',
        titleColor: 'text-purple-900',
        bodyColor: 'text-purple-700',
        accent: '★',
    },
];

interface Guest {
    id: string;
    name: string;
    phone: string;
    email: string;
}

const DigitalInvites: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [eventName, setEventName] = useState('Our Wedding Celebration');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventVenue, setEventVenue] = useState('');
    const [hostName, setHostName] = useState('');
    const [personalNote, setPersonalNote] = useState('With great joy, we invite you to celebrate this special day with us.');
    const [guests, setGuests] = useState<Guest[]>([]);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'design' | 'guests' | 'preview'>('design');
    const printRef = useRef<HTMLDivElement>(null);

    const addGuest = () => {
        if (!newName.trim()) return toast.error('Guest name is required');
        setGuests(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim() }]);
        setNewName('');
        setNewPhone('');
        setNewEmail('');
        toast.success('Guest added!');
    };

    const removeGuest = (id: string) => setGuests(prev => prev.filter(g => g.id !== id));

    const shareWhatsApp = (guest?: Guest) => {
        const msg = encodeURIComponent(
            `🎉 *${eventName}*\n\n${personalNote}\n\n📅 ${eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}\n🕐 ${eventTime || 'TBD'}\n📍 ${eventVenue || 'Venue TBD'}\n\nHosted by: ${hostName || 'Host'}\n\nWe look forward to seeing you! 🙏`
        );
        const phone = guest?.phone?.replace(/\D/g, '') || '';
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    const shareEmail = (guest?: Guest) => {
        const subject = encodeURIComponent(`Invitation: ${eventName}`);
        const body = encodeURIComponent(
            `Dear ${guest?.name || 'Guest'},\n\n${personalNote}\n\nEvent: ${eventName}\nDate: ${eventDate || 'TBD'}\nTime: ${eventTime || 'TBD'}\nVenue: ${eventVenue || 'TBD'}\n\nHosted by: ${hostName || 'Host'}\n\nWe look forward to your presence!\n\nWith warm regards,\n${hostName || 'Host'}`
        );
        window.open(`mailto:${guest?.email || ''}?subject=${subject}&body=${body}`, '_blank');
    };

    const downloadPDF = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const originalBody = document.body.innerHTML;
        document.body.innerHTML = printContent.outerHTML;
        window.print();
        document.body.innerHTML = originalBody;
        window.location.reload();
    };

    const t = selectedTemplate;

    return (
        <div className="max-w-5xl mx-auto pb-12 space-y-6">
            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Digital Invitations</h1>
                <p className="text-neutral-500 dark:text-slate-400 mt-1">Create beautiful digital invites and share with your guests.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                {([['design', 'Design'], ['guests', `Guests (${guests.length})`], ['preview', 'Preview & Share']] as const).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === id
                            ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-sm'
                            : 'text-neutral-500 dark:text-slate-400'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Form */}
                    <div className="space-y-6">
                        {/* Template picker */}
                        <div>
                            <h2 className="text-sm font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider mb-3">Choose Template</h2>
                            <div className="grid grid-cols-5 gap-2">
                                {TEMPLATES.map(tmpl => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => setSelectedTemplate(tmpl)}
                                        className={`h-16 rounded-xl border-2 transition-all ${tmpl.preview} ${selectedTemplate.id === tmpl.id ? `${tmpl.border} ring-2 ring-offset-2 ring-red-500` : 'border-transparent'}`}
                                        title={tmpl.name}
                                    >
                                        <span className="text-lg">{tmpl.accent}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1 font-medium">{selectedTemplate.name}</p>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-neutral-200 dark:border-slate-800">
                            <h2 className="font-bold text-neutral-900 dark:text-white">Event Details</h2>
                            {[
                                { label: 'Event / Occasion Name', value: eventName, set: setEventName, type: 'text', placeholder: 'e.g. Priya & Raj Wedding' },
                                { label: 'Host Name', value: hostName, set: setHostName, type: 'text', placeholder: 'e.g. Sharma Family' },
                                { label: 'Event Date', value: eventDate, set: setEventDate, type: 'date', placeholder: '' },
                                { label: 'Event Time', value: eventTime, set: setEventTime, type: 'time', placeholder: '' },
                                { label: 'Venue', value: eventVenue, set: setEventVenue, type: 'text', placeholder: 'e.g. Royal Palace Banquet, Mumbai' },
                            ].map(({ label, value, set, type, placeholder }) => (
                                <div key={label}>
                                    <label className="block text-xs font-bold text-neutral-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
                                    <input
                                        type={type}
                                        value={value}
                                        onChange={e => set(e.target.value)}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Personal Note</label>
                                <textarea
                                    value={personalNote}
                                    onChange={e => setPersonalNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab('guests')}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            Next: Add Guests →
                        </button>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="sticky top-4">
                        <h2 className="text-sm font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider mb-3">Live Preview</h2>
                        <div ref={printRef} className={`${t.preview} ${t.border} border-4 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center shadow-xl`}>
                            <p className={`text-4xl mb-4 ${t.titleColor}`}>{t.accent}</p>
                            <p className={`text-xs font-bold uppercase tracking-[0.3em] mb-3 ${t.bodyColor} opacity-70`}>You are cordially invited to</p>
                            <h2 className={`text-2xl font-black mb-4 leading-tight ${t.titleColor}`}>{eventName || 'Your Event Name'}</h2>
                            <p className={`text-sm leading-relaxed mb-6 max-w-xs ${t.bodyColor}`}>{personalNote}</p>
                            <div className={`space-y-1 text-sm font-bold ${t.bodyColor}`}>
                                {eventDate && <p>📅 {new Date(eventDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                                {eventTime && <p>🕐 {eventTime}</p>}
                                {eventVenue && <p>📍 {eventVenue}</p>}
                            </div>
                            {hostName && <p className={`text-xs mt-6 font-medium ${t.bodyColor} opacity-70`}>Hosted by {hostName}</p>}
                            <p className={`text-3xl mt-4 ${t.titleColor}`}>{t.accent}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* GUESTS TAB */}
            {activeTab === 'guests' && (
                <div className="space-y-6">
                    {/* Add Guest Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-neutral-200 dark:border-slate-800">
                        <h2 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Users size={18} /> Add Guest</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name *" className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 Phone Number" className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email Address" type="email" className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <button onClick={addGuest} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors">
                            <Plus size={16} /> Add Guest
                        </button>
                    </div>

                    {/* Guest List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="font-bold text-neutral-900 dark:text-white">{guests.length} Guest{guests.length !== 1 ? 's' : ''}</h2>
                            <button
                                onClick={() => { guests.forEach(g => shareWhatsApp(g)); toast.success(`Invite sent to all ${guests.length} guests via WhatsApp!`); }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-colors"
                            >
                                <MessageSquare size={14} /> Send All via WhatsApp
                            </button>
                        </div>
                        {guests.length === 0 ? (
                            <div className="p-12 text-center text-neutral-400">
                                <Users size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No guests added yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                                {guests.map(guest => (
                                    <div key={guest.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/20 text-red-600 font-black flex items-center justify-center text-sm">
                                                {guest.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-neutral-900 dark:text-white">{guest.name}</p>
                                                <p className="text-xs text-neutral-400">{guest.phone}{guest.email ? ` • ${guest.email}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => shareWhatsApp(guest)} className="p-2 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-lg hover:bg-green-100" title="WhatsApp">
                                                <MessageSquare size={15} />
                                            </button>
                                            {guest.email && (
                                                <button onClick={() => shareEmail(guest)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-100" title="Email">
                                                    <Mail size={15} />
                                                </button>
                                            )}
                                            <button onClick={() => removeGuest(guest.id)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg hover:bg-red-100" title="Remove">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PREVIEW & SHARE TAB */}
            {activeTab === 'preview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Invite Preview (printable) */}
                    <div>
                        <h2 className="text-sm font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider mb-3">Invitation Preview</h2>
                        <div ref={printRef} className={`${t.preview} ${t.border} border-4 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-xl`}>
                            <p className={`text-5xl mb-5 ${t.titleColor}`}>{t.accent}</p>
                            <p className={`text-xs font-bold uppercase tracking-[0.4em] mb-3 ${t.bodyColor} opacity-70`}>You are cordially invited to</p>
                            <h2 className={`text-3xl font-black mb-5 leading-tight ${t.titleColor}`}>{eventName}</h2>
                            <p className={`text-sm leading-relaxed mb-8 max-w-xs ${t.bodyColor}`}>{personalNote}</p>
                            <div className={`space-y-2 text-sm font-bold ${t.bodyColor}`}>
                                {eventDate && <p>📅 {new Date(eventDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                                {eventTime && <p>🕐 {eventTime}</p>}
                                {eventVenue && <p>📍 {eventVenue}</p>}
                            </div>
                            {hostName && <p className={`text-xs mt-8 font-medium ${t.bodyColor} opacity-70`}>Hosted by {hostName}</p>}
                            <p className={`text-4xl mt-6 ${t.titleColor}`}>{t.accent}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Share & Download</h2>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden">
                            {[
                                {
                                    icon: <MessageSquare size={20} className="text-green-600" />,
                                    bg: 'bg-green-50 dark:bg-green-500/10',
                                    title: 'Share via WhatsApp',
                                    desc: `Send to all ${guests.length} guest${guests.length !== 1 ? 's' : ''}`,
                                    action: () => { guests.length > 0 ? guests.forEach(g => shareWhatsApp(g)) : shareWhatsApp(); toast.success('Opening WhatsApp!'); },
                                },
                                {
                                    icon: <Mail size={20} className="text-blue-600" />,
                                    bg: 'bg-blue-50 dark:bg-blue-500/10',
                                    title: 'Share via Email',
                                    desc: `Send email invitations to guests`,
                                    action: () => { guests.filter(g => g.email).forEach(g => shareEmail(g)); toast.success('Opening email client!'); },
                                },
                                {
                                    icon: <Download size={20} className="text-purple-600" />,
                                    bg: 'bg-purple-50 dark:bg-purple-500/10',
                                    title: 'Download PDF',
                                    desc: 'Save as printable PDF invitation',
                                    action: downloadPDF,
                                },
                            ].map(({ icon, bg, title, desc, action }) => (
                                <button
                                    key={title}
                                    onClick={action}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-slate-800/30 border-b border-neutral-100 dark:border-slate-800 last:border-0 transition-colors text-left"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-neutral-900 dark:text-white text-sm">{title}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                                    </div>
                                    <Share2 size={16} className="text-neutral-300" />
                                </button>
                            ))}
                        </div>

                        {/* Guest summary */}
                        <div className="bg-neutral-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-neutral-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle size={16} className="text-emerald-500" />
                                <p className="font-bold text-sm text-neutral-900 dark:text-white">Invite Summary</p>
                            </div>
                            <div className="space-y-1 text-xs text-neutral-500 dark:text-slate-400 font-medium">
                                <p>Template: <span className="text-neutral-900 dark:text-white font-bold">{t.name}</span></p>
                                <p>Event: <span className="text-neutral-900 dark:text-white font-bold">{eventName}</span></p>
                                <p>Total Guests: <span className="text-neutral-900 dark:text-white font-bold">{guests.length}</span></p>
                                <p>WhatsApp: <span className="text-neutral-900 dark:text-white font-bold">{guests.filter(g => g.phone).length} contacts</span></p>
                                <p>Email: <span className="text-neutral-900 dark:text-white font-bold">{guests.filter(g => g.email).length} contacts</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalInvites;
