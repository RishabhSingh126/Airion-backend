import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Zap, Eye, MousePointer, Plus, X, Megaphone,
    Award, BarChart2, Clock, CheckCircle, AlertCircle,
    Star, Target, ImageIcon, Tag, Upload
} from 'lucide-react';
import { Button } from '@ease2event/ui';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ── Types ───────────────────────────────────────────────────────────────────
interface Ad {
    id: string;
    campaignName: string;
    adType: string;
    status: string;
    dailyBudget: number;
    totalBudget: number;
    impressions: number;
    clicks: number;
    startDate?: string;
    endDate?: string;
}

type Tab = 'sponsored' | 'display';
type SponsoredDuration = '7' | '15' | '30' | '60';

// ── Pricing tables ──────────────────────────────────────────────────────────
const SPONSORED_PACKAGES: { days: SponsoredDuration; label: string; price: number; badge?: string }[] = [
    { days: '7',  label: '7 Days',  price: 999 },
    { days: '15', label: '15 Days', price: 1799, badge: 'Popular' },
    { days: '30', label: '30 Days', price: 2999, badge: 'Best Value' },
    { days: '60', label: '60 Days', price: 4999, badge: 'Premium' },
];

const DISPLAY_PLACEMENTS = [
    'Homepage Hero', 'Homepage Banner', 'Category Pages',
    'Marketplace', 'City Pages', 'Vendor Profile', 'Event Pages', 'Footer',
];

// ── Status badge ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        active:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        pending:  'bg-amber-500/10 text-amber-600 border-amber-500/20',
        rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
        paused:   'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    const cls = map[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
    const Icon = status === 'active' ? CheckCircle : status === 'pending' ? Clock : AlertCircle;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-bold uppercase border ${cls}`}>
            <Icon size={11} /> {status}
        </span>
    );
};

// ── Main component ──────────────────────────────────────────────────────────
const Promotions: React.FC = () => {
    const [tab, setTab] = useState<Tab>('sponsored');
    const [campaigns, setCampaigns] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    // Sponsored form
    const [showSponsoredForm, setShowSponsoredForm] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<SponsoredDuration>('15');
    const [submittingSponsored, setSubmittingSponsored] = useState(false);

    // Display ad form
    const [showDisplayForm, setShowDisplayForm] = useState(false);
    const [displayForm, setDisplayForm] = useState({
        campaignName: '',
        title: '',
        description: '',
        cta: '',
        targetCategory: '',
        targetCity: '',
        placement: 'Homepage Banner',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        dailyBudget: 500,
        totalBudget: 3500,
        imageUrl: '',
    });
    const [uploading, setUploading] = useState(false);
    const [submittingDisplay, setSubmittingDisplay] = useState(false);

    const fetchCampaigns = async () => {
        try {
            const data = await api.get('/ads/vendor/me') as any;
            const parsedData = Array.isArray(data) ? data : (data?.data || []);
            setCampaigns(parsedData);
        } catch {
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const sponsoredCampaigns = campaigns.filter(a =>
        ['featured', 'sponsored'].includes(a.adType?.toLowerCase())
    );
    const displayCampaigns = campaigns.filter(a =>
        !['featured', 'sponsored'].includes(a.adType?.toLowerCase())
    );
    const shownCampaigns = tab === 'sponsored' ? sponsoredCampaigns : displayCampaigns;

    // ── Submit sponsored listing ─────────────────────────────────────────────
    const handleSubmitSponsored = async () => {
        setSubmittingSponsored(true);
        const pkg = SPONSORED_PACKAGES.find(p => p.days === selectedDuration)!;
        const start = new Date();
        const end   = new Date(Date.now() + Number(selectedDuration) * 86400000);
        try {
            await api.post('/ads', {
                campaignName: `Sponsored Listing – ${pkg.label}`,
                adType: 'featured',
                dailyBudget: Math.round(pkg.price / Number(selectedDuration)),
                totalBudget: pkg.price,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            toast.success('Sponsored Listing submitted for approval!');
            setShowSponsoredForm(false);
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit');
        } finally {
            setSubmittingSponsored(false);
        }
    };

    // ── Upload banner ─────────────────────────────────────────────────────────
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res: any = await api.post('/uploads/image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDisplayForm(f => ({ ...f, imageUrl: res.url || res.data?.url }));
            toast.success('Banner uploaded');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // ── Submit display ad ─────────────────────────────────────────────────────
    const handleSubmitDisplay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayForm.campaignName.trim()) return toast.error('Campaign name is required');
        setSubmittingDisplay(true);
        try {
            await api.post('/ads', {
                campaignName: displayForm.campaignName,
                adType: 'banner',
                dailyBudget: Number(displayForm.dailyBudget),
                totalBudget: Number(displayForm.totalBudget),
                startDate: new Date(displayForm.startDate).toISOString(),
                endDate: new Date(displayForm.endDate).toISOString(),
                mediaUrls: displayForm.imageUrl ? [displayForm.imageUrl] : [],
                targetAudience: {
                    placement: displayForm.placement,
                    category: displayForm.targetCategory,
                    city: displayForm.targetCity,
                    title: displayForm.title,
                    description: displayForm.description,
                    cta: displayForm.cta,
                },
            });
            toast.success('Display Ad submitted for approval!');
            setShowDisplayForm(false);
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit');
        } finally {
            setSubmittingDisplay(false);
        }
    };

    const CTR = (ad: Ad) =>
        ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-6 pb-8">
            {/* ── Header ── */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--ease2event-border-subtle)] pb-6">
                <div>
                    <h1 className="text-xl font-bold text-[var(--ease2event-text-primary)]">Ads &amp; Promotions</h1>
                    <p className="text-sm font-semibold text-[var(--ease2event-text-secondary)] mt-1">
                        Boost visibility through Sponsored Listings or Display Advertisements.
                    </p>
                </div>
                <Button
                    onClick={() => tab === 'sponsored' ? setShowSponsoredForm(true) : setShowDisplayForm(true)}
                    className="h-10 px-5 gap-2 rounded-2xl font-bold"
                >
                    <Plus size={16} /> Create Campaign
                </Button>
            </header>

            {/* ── Tab switcher ── */}
            <div className="flex gap-2 bg-[var(--ease2event-bg-elevated)] p-1 rounded-2xl w-fit">
                {([['sponsored', 'Sponsored Listing', Award], ['display', 'Display Ad', ImageIcon]] as const).map(
                    ([key, label, Icon]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key as Tab)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                tab === key
                                    ? 'bg-white dark:bg-slate-800 text-[var(--ease2event-text-primary)] shadow-sm'
                                    : 'text-[var(--ease2event-text-secondary)]'
                            }`}
                        >
                            <Icon size={15} /> {label}
                        </button>
                    )
                )}
            </div>

            {/* ── Sponsored Listing Section ── */}
            {tab === 'sponsored' && (
                <div className="space-y-6">
                    {/* Pricing packages */}
                    {!showSponsoredForm ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {SPONSORED_PACKAGES.map(pkg => (
                                <button
                                    key={pkg.days}
                                    onClick={() => { setSelectedDuration(pkg.days); setShowSponsoredForm(true); }}
                                    className="relative flex flex-col items-start p-5 rounded-2xl border-2 border-[var(--ease2event-border-base)] bg-[var(--ease2event-bg-elevated)] text-left transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 group"
                                >
                                    {pkg.badge && (
                                        <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                            {pkg.badge}
                                        </span>
                                    )}
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 border border-blue-500/20">
                                        <Award size={18} />
                                    </div>
                                    <p className="font-black text-lg text-[var(--ease2event-text-primary)]">₹{pkg.price.toLocaleString()}</p>
                                    <p className="text-sm font-bold text-[var(--ease2event-text-secondary)] mt-0.5">{pkg.label}</p>
                                    <ul className="mt-3 space-y-1">
                                        {['Higher search ranking', 'Featured placement', 'Sponsored Badge'].map(f => (
                                            <li key={f} className="text-[11px] text-[var(--ease2event-text-secondary)] flex items-center gap-1.5">
                                                <CheckCircle size={11} className="text-emerald-500 shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Sponsored confirmation form */
                        <div className="card-minimal p-6 border-2 border-blue-500/30 rounded-2xl max-w-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold">Confirm Sponsored Listing</h2>
                                <button onClick={() => setShowSponsoredForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {SPONSORED_PACKAGES.map(pkg => (
                                        <label
                                            key={pkg.days}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                selectedDuration === pkg.days
                                                    ? 'border-blue-500 bg-blue-500/5'
                                                    : 'border-[var(--ease2event-border-base)]'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="duration"
                                                value={pkg.days}
                                                checked={selectedDuration === pkg.days}
                                                onChange={() => setSelectedDuration(pkg.days)}
                                                className="accent-blue-600"
                                            />
                                            <span>
                                                <p className="font-bold text-sm">{pkg.label}</p>
                                                <p className="text-xs text-[var(--ease2event-text-secondary)]">₹{pkg.price.toLocaleString()}</p>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20 text-sm text-[var(--ease2event-text-secondary)] font-semibold">
                                    Your profile will be featured in search results, homepage recommendations, and category pages with a <strong className="text-[var(--ease2event-text-primary)]">Sponsored</strong> badge for {SPONSORED_PACKAGES.find(p => p.days === selectedDuration)?.label}.
                                </div>
                                <Button
                                    onClick={handleSubmitSponsored}
                                    disabled={submittingSponsored}
                                    className="w-full h-11 rounded-xl font-bold"
                                >
                                    {submittingSponsored ? 'Submitting…' : `Purchase – ₹${SPONSORED_PACKAGES.find(p => p.days === selectedDuration)?.price.toLocaleString()}`}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Display Advertisement Section ── */}
            {tab === 'display' && showDisplayForm && (
                <form onSubmit={handleSubmitDisplay} className="card-minimal p-6 border-2 border-[var(--ease2event-border-base)] rounded-2xl space-y-5 max-w-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Create Display Ad</h2>
                        <button type="button" onClick={() => setShowDisplayForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Campaign Name *', key: 'campaignName', placeholder: 'e.g. Diwali Promo' },
                            { label: 'Ad Title',       key: 'title',        placeholder: 'Headline text' },
                            { label: 'Target Category', key: 'targetCategory', placeholder: 'e.g. Wedding' },
                            { label: 'Target City',    key: 'targetCity',   placeholder: 'e.g. Mumbai' },
                            { label: 'CTA Text',       key: 'cta',          placeholder: 'e.g. Book Now' },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="block text-sm font-bold mb-1.5">{f.label}</label>
                                <input
                                    type="text"
                                    required={f.key === 'campaignName'}
                                    placeholder={f.placeholder}
                                    value={(displayForm as any)[f.key]}
                                    onChange={e => setDisplayForm(d => ({ ...d, [f.key]: e.target.value }))}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-bold mb-1.5">Placement</label>
                            <select
                                value={displayForm.placement}
                                onChange={e => setDisplayForm(d => ({ ...d, placement: e.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--ease2event-text-primary)]"
                            >
                                {DISPLAY_PLACEMENTS.map(p => <option key={p} className="bg-white dark:bg-slate-900">{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5">Daily Budget (₹)</label>
                            <input type="number" min="100" value={displayForm.dailyBudget}
                                onChange={e => setDisplayForm(d => ({ ...d, dailyBudget: Number(e.target.value) }))}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5">Total Budget (₹)</label>
                            <input type="number" min="500" value={displayForm.totalBudget}
                                onChange={e => setDisplayForm(d => ({ ...d, totalBudget: Number(e.target.value) }))}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5">Start Date</label>
                            <input type="date" value={displayForm.startDate}
                                onChange={e => setDisplayForm(d => ({ ...d, startDate: e.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5">End Date</label>
                            <input type="date" value={displayForm.endDate}
                                onChange={e => setDisplayForm(d => ({ ...d, endDate: e.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                    </div>
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold mb-1.5">Ad Description</label>
                        <textarea rows={3} placeholder="Short ad copy…" value={displayForm.description}
                            onChange={e => setDisplayForm(d => ({ ...d, description: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    {/* Banner upload */}
                    <div>
                        <label className="block text-sm font-bold mb-1.5">Banner Image</label>
                        <label className="flex items-center gap-3 h-11 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : displayForm.imageUrl ? 'Banner uploaded ✓' : 'Click to upload banner'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                        {displayForm.imageUrl && (
                            <img src={displayForm.imageUrl} alt="Preview" className="mt-2 h-20 rounded-xl object-cover border border-gray-200" />
                        )}
                    </div>
                    <Button type="submit" disabled={submittingDisplay} className="w-full h-11 rounded-xl font-bold">
                        {submittingDisplay ? 'Submitting…' : 'Submit for Approval'}
                    </Button>
                </form>
            )}

            {/* ── Campaign list ── */}
            <div className="card-minimal p-6 border-[var(--ease2event-border-base)] rounded-xl">
                <h2 className="text-base font-bold text-[var(--ease2event-text-primary)] mb-5">
                    {tab === 'sponsored' ? 'Sponsored Listing Campaigns' : 'Display Ad Campaigns'}
                </h2>
                {loading ? (
                    <div className="py-10 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
                    </div>
                ) : shownCampaigns.length === 0 ? (
                    <div className="py-16 text-center bg-[var(--ease2event-bg-elevated)] rounded-xl border-2 border-dashed border-[var(--ease2event-border-subtle)] space-y-4">
                        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                            {tab === 'sponsored' ? <Award size={28} /> : <Megaphone size={28} />}
                        </div>
                        <h3 className="text-base font-bold">No {tab === 'sponsored' ? 'Sponsored Listings' : 'Display Ads'} yet</h3>
                        <Button
                            onClick={() => tab === 'sponsored' ? setShowSponsoredForm(true) : setShowDisplayForm(true)}
                            className="h-10 px-6 rounded-2xl font-bold"
                        >
                            Create First Campaign
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {shownCampaigns.map(ad => (
                            <div key={ad.id} className="p-5 rounded-2xl bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)]">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-sm leading-tight">{ad.campaignName}</h3>
                                        <p className="text-[11px] text-gray-500 uppercase mt-0.5">{ad.adType}</p>
                                    </div>
                                    <StatusBadge status={ad.status} />
                                </div>
                                <p className="text-lg font-black mb-4">₹{Number(ad.totalBudget).toLocaleString()}</p>
                                <div className="grid grid-cols-3 gap-3 border-t border-[var(--ease2event-border-subtle)] pt-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5"><Eye size={10} /> Impressions</div>
                                        <div className="font-bold text-sm">{ad.impressions.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5"><MousePointer size={10} /> Clicks</div>
                                        <div className="font-bold text-sm">{ad.clicks.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5"><BarChart2 size={10} /> CTR</div>
                                        <div className="font-bold text-sm">{CTR(ad)}%</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Promotions;
