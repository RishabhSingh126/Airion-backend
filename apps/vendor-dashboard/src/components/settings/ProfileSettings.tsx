import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Camera, Plus, Trash2, CheckCircle2, Loader2, Phone, Mail, Edit3, X } from 'lucide-react';
import { Avatar, Button } from '@ease2event/ui';
import { useAuth } from '@ease2event/shared';
import api, { uploadImage } from '../../lib/api';
import toast from 'react-hot-toast';

const ProfileSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: '',
    aadharNumber: '',
    panNumber: '',
    gstNumber: ''
  });

  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    yearsInBusiness: '',
    avgBookingPrice: '',
    website: '',
    instagram: '',
    monthlyEventVolume: '',
    acquisitionChannels: [] as string[],
    painPoints: [] as string[],
    categoryId: '',
    subcategoryId: '',
    portfolioImages: [] as string[],
  });

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const res = await api.get('/categories') as any;
        const cats = res.data || res;
        if (cats && cats.length > 0) {
          setCategories(cats);
        } else {
          setCategories([
            { id: '1', name: 'Venue & Spaces' },
            { id: '2', name: 'Catering & Food' },
            { id: '3', name: 'Photography & Media' },
            { id: '4', name: 'Decor & Styling' }
          ]);
        }
      } catch (err) {
        setCategories([
          { id: '1', name: 'Venue & Spaces' },
          { id: '2', name: 'Catering & Food' },
          { id: '3', name: 'Photography & Media' },
          { id: '4', name: 'Decor & Styling' }
        ]);
      }
    };
    fetchRegistry();
  }, []);

  useEffect(() => {
    if (businessData.categoryId) {
      const fetchSubs = async () => {
        try {
          const res = await api.get(`/categories/${businessData.categoryId}/subcategories`) as any;
          const subs = res.data || res;
          setSubcategories(Array.isArray(subs) ? subs : []);
        } catch (err) {
          setSubcategories([]);
        }
      };
      fetchSubs();
    } else {
      setSubcategories([]);
    }
  }, [businessData.categoryId]);

  useEffect(() => {
    if (user) {
      setPersonalData({
        name: (user.name && user.name.startsWith('User ') && user.name.includes('@')) ? (user.vendor?.businessName || '') : (user.name || user.vendor?.businessName || ''),
        email: user.email || '',
        phone: user.phoneNumber || user.vendor?.businessPhone || '',
        profileImage: (user as any).avatar || user.vendor?.logo || '',
        aadharNumber: user.vendor?.aadharNumber || '',
        panNumber: user.vendor?.panNumber || '',
        gstNumber: user.vendor?.gstNumber || ''
      });

      const v = user.vendor || {} as any;
      setBusinessData({
        businessName: v.businessName || '',
        businessEmail: v.businessEmail || '',
        businessPhone: v.businessPhone || '',
        gstNumber: v.gstNumber || '',
        address: v.businessAddress?.street || v.businessAddress?.address || '',
        city: v.businessAddress?.city || v.city || '',
        state: v.businessAddress?.state || '',
        zipCode: v.businessAddress?.zipCode || '',
        description: v.businessDescription || '',
        yearsInBusiness: v.yearsInBusiness || '',
        avgBookingPrice: v.averageBookingPrice ? String(v.averageBookingPrice) : '',
        website: v.socialLinks?.website || '',
        instagram: v.socialLinks?.instagram || '',
        monthlyEventVolume: v.monthlyEventVolume || '',
        acquisitionChannels: v.acquisitionChannels || [],
        painPoints: v.painPoints || [],
        categoryId: v.categoryId || '',
        subcategoryId: v.subcategoryId || '',
        portfolioImages: (v.portfolioImages && v.portfolioImages.length > 0) ? v.portfolioImages : [],
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!businessData.businessName) {
      toast.error('Please fill in the Business Name.');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Save Personal
      await api.patch('/auth/profile', {
        name: personalData.name,
        phoneNumber: personalData.phone,
        avatar: personalData.profileImage
      });

      // 2. Save Business
      const cleanBusinessData: any = {};
      Object.entries(businessData).forEach(([key, value]) => {
        const skipKeys = ['address', 'city', 'state', 'zipCode', 'website', 'instagram', 'avgBookingPrice'];
        if (!skipKeys.includes(key) && value !== '' && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
          cleanBusinessData[key] = value;
        }
      });

      const ensureUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
      };

      const submissionData = {
        ...cleanBusinessData,
        averageBookingPrice: Number(businessData.avgBookingPrice) || 0,
        aadharNumber: personalData.aadharNumber,
        panNumber: personalData.panNumber,
        gstNumber: personalData.gstNumber,
        businessAddress: {
          street: businessData.address || '',
          city: businessData.city || '',
          state: businessData.state || '',
          country: 'India',
          zipCode: businessData.zipCode || ''
        },
        socialLinks: {
          website: ensureUrl(businessData.website),
          instagram: ensureUrl(businessData.instagram)
        }
      };

      if (!submissionData.categoryId) delete submissionData.categoryId;
      if (!submissionData.subcategoryId) delete submissionData.subcategoryId;

      await api.put('/vendors/me', submissionData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refreshUser();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* 👤 Personal Info Header */}
      <div className="flex items-center justify-between border-b border-[var(--ease2event-border-subtle)] pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-base)] text-blue-500 shrink-0">
            <User className="size-6 sm:size-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-lg font-semibold text-[var(--ease2event-text-primary)] leading-none tracking-tight">Personal Information</h2>
            <p className="text-[10px] sm:text-sm text-[var(--ease2event-text-secondary)] font-semibold mt-1.5 sm:mt-3 tracking-normal">Manage your personal profile and documents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <Button 
              onClick={handleSaveProfile} 
              disabled={submitting} 
              className="h-10 px-4 text-xs font-bold rounded-xl bg-[var(--ease2event-brand-primary)] text-white hover:opacity-90 transition-all shadow-md"
            >
              {submitting ? <Loader2 className="animate-spin size-4" /> : <><CheckCircle2 size={14} className="mr-2" /> Save Changes</>}
            </Button>
          )}
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'outline' : 'primary'}
            className={`h-10 px-4 text-xs font-bold rounded-xl transition-all ${isEditing ? 'border-red-500 text-red-500 hover:bg-red-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isEditing ? <><X size={14} className="mr-2" /> Cancel</> : <><Edit3 size={14} className="mr-2" /> Edit</>}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row items-center gap-5 sm:gap-6 group bg-[var(--ease2event-bg-elevated)]/30 p-6 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--ease2event-border-subtle)] relative">
          <input
            ref={fileInputRef}
            type="file"
            id="profile-upload"
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const loaderId = toast.loading('Uploading profile picture...');
              try {
                const data = await uploadImage(file);
                const imageUrl = data.url || data.data?.url || (typeof data === 'string' ? data : null);
                if (imageUrl) {
                  setPersonalData(prev => ({ ...prev, profileImage: imageUrl }));
                  // Auto-save the avatar directly so it persists immediately
                  await api.patch('/auth/profile', { avatar: imageUrl });
                  refreshUser();
                  toast.success('Profile picture updated and saved!', { id: loaderId });
                } else {
                  toast.error('Failed to get uploaded image URL', { id: loaderId });
                }
              } catch (err: any) {
                toast.error(err?.message || 'Upload failed', { id: loaderId });
              } finally {
                e.target.value = '';
              }
            }}
          />
          <div className="relative">
            <Avatar name={personalData.name} src={personalData.profileImage} size="xl" className="size-24 sm:size-32 ring-8 sm:ring-12 ring-[var(--ease2event-bg-surface)] group-hover:ring-[var(--ease2event-brand-primary)]/20 transition-all" />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-auto md:left-auto md:bottom-1 md:right-1 md:translate-x-0 md:translate-y-0 p-3 bg-[var(--ease2event-brand-primary)] text-white rounded-full md:rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-md z-10"
              title="Upload profile photo"
            >
              <Camera size={18} />
            </button>
          </div>
          <div className="space-y-4 sm:space-y-5 text-center xl:text-left flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-[var(--ease2event-text-primary)] tracking-normal">Profile Picture</h3>
            <p className="text-[10px] sm:text-[11px] text-[var(--ease2event-text-secondary)] font-semibold leading-relaxed max-w-sm">Upload a professional photo to improve your credibility and brand visibility.</p>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer inline-flex items-center justify-center h-10 sm:h-11 px-6 sm:px-5 bg-[var(--ease2event-bg-surface)] hover:bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-base)] hover:border-[var(--ease2event-brand-primary)] text-[10px] sm:text-sm text-[var(--ease2event-text-primary)] font-bold tracking-normal rounded-xl w-full sm:w-auto transition-all shadow-sm active:scale-95"
            >
              Update Photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Name</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
              <input
                type="text"
                value={personalData.name}
                disabled={!isEditing}
                onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl pl-12 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all text-[var(--ease2event-text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter your name"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 transition-opacity" size={16} />
              <input
                type="email"
                value={personalData.email}
                disabled
                className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)]/50 border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl pl-12 pr-6 text-sm font-bold outline-none text-[var(--ease2event-text-muted)] cursor-not-allowed"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
              <input
                type="text"
                value={personalData.phone}
                disabled={!isEditing}
                onChange={(e: any) => setPersonalData({ ...personalData, phone: e.target.value })}
                className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl pl-12 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all text-[var(--ease2event-text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="+91"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🏢 Business Info Header */}
      <div className="flex items-center gap-4 border-b border-[var(--ease2event-border-subtle)] pb-6 pt-8">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-base)] text-[var(--ease2event-brand-primary)] shrink-0">
          <Briefcase className="size-6 sm:size-8" />
        </div>
        <div>
          <h2 className="text-xl sm:text-lg font-semibold text-[var(--ease2event-text-primary)] leading-none tracking-tight">Business Profile</h2>
          <p className="text-[10px] sm:text-sm text-[var(--ease2event-text-secondary)] font-semibold mt-1.5 sm:mt-3 tracking-normal">Manage your business details and marketplace listing</p>
        </div>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Marketplace Domain</label>
            <select value={businessData.categoryId} onChange={(e: any) => setBusinessData({ ...businessData, categoryId: e.target.value, subcategoryId: '' })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all appearance-none cursor-pointer">
              <option value="" className="bg-[var(--ease2event-bg-surface)]">Select Core Domain...</option>
              {categories.map((c: any, i: number) => <option key={c._id || c.id || i} value={c._id || c.id} className="bg-[var(--ease2event-bg-surface)]">{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Specialization</label>
            <select disabled={!businessData.categoryId} value={businessData.subcategoryId} onChange={(e: any) => setBusinessData({ ...businessData, subcategoryId: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all appearance-none cursor-pointer disabled:opacity-30">
              <option value="" className="bg-[var(--ease2event-bg-surface)]">Select Specialization...</option>
              {subcategories.map((s: any, i: number) => <option key={s._id || s.id || i} value={s._id || s.id} className="bg-[var(--ease2event-bg-surface)]">{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Business Name</label>
            <input value={businessData.businessName} onChange={(e: any) => setBusinessData({ ...businessData, businessName: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-base outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all tracking-tight" placeholder="Business Name" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Business Phone</label>
            <input value={businessData.businessPhone} onChange={(e: any) => setBusinessData({ ...businessData, businessPhone: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-base outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all tracking-tight" placeholder="Business Phone" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Portfolio Highlights</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 bg-[var(--ease2event-bg-elevated)]/20 p-4 sm:p-6 rounded-xl sm:rounded-xl md:rounded-[32px] border border-[var(--ease2event-border-subtle)]">
            {businessData.portfolioImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-base)] relative group transition-all active:scale-95">
                <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <button onClick={() => setBusinessData(p => ({ ...p, portfolioImages: p.portfolioImages.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"><Trash2 size={16} /></button>
              </div>
            ))}
            <label className="aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-[var(--ease2event-border-base)] flex flex-col items-center justify-center text-[var(--ease2event-text-muted)] hover:text-[var(--ease2event-brand-primary)] hover:bg-[var(--ease2event-brand-primary)]/5 transition-all gap-2 sm:gap-3 group cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const loaderId = toast.loading('Uploading image...');
                  try {
                    const data = await uploadImage(file);
                    const imageUrl = data.url || data.data?.url || (typeof data === 'string' ? data : null);
                    if (imageUrl) {
                      setBusinessData(prev => ({ ...prev, portfolioImages: [...prev.portfolioImages, imageUrl] }));
                      toast.success('Image uploaded successfully', { id: loaderId });
                    }
                  } catch (err) {
                    toast.error('Upload failed', { id: loaderId });
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <Plus className="size-6 sm:size-8 group-hover:rotate-90 transition-transform" />
              <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase">Add Image</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Business Description</label>
          <textarea value={businessData.description} onChange={(e: any) => setBusinessData({ ...businessData, description: e.target.value })} rows={5} className="w-full h-auto min-h-[140px] sm:min-h-[160px] bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-3xl border border-[var(--ease2event-border-subtle)] font-bold leading-relaxed text-sm sm:text-base outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all" placeholder="Describe your services and business philosophy..." />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">City</label>
            <input value={businessData.city} onChange={(e: any) => setBusinessData({ ...businessData, city: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all" placeholder="City" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Average Booking Price (₹)</label>
            <input type="number" value={businessData.avgBookingPrice} onChange={(e: any) => setBusinessData({ ...businessData, avgBookingPrice: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] px-5 sm:px-6 rounded-xl sm:rounded-2xl border border-[var(--ease2event-border-subtle)] font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all" placeholder="75,000" />
          </div>
        </div>

        {/* GST/PAN Documents grouped at the bottom */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-6 border-t border-[var(--ease2event-border-subtle)]">
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">Aadhar Number</label>
            <input type="text" disabled={!isEditing} value={personalData.aadharNumber} onChange={(e: any) => setPersonalData({ ...personalData, aadharNumber: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl px-5 sm:px-6 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">PAN Number</label>
            <input type="text" disabled={!isEditing} value={personalData.panNumber} onChange={(e: any) => setPersonalData({ ...personalData, panNumber: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl px-5 sm:px-6 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] sm:text-sm font-bold text-[var(--ease2event-text-secondary)] tracking-widest ml-1">GST Number</label>
            <input type="text" disabled={!isEditing} value={personalData.gstNumber} onChange={(e: any) => setPersonalData({ ...personalData, gstNumber: e.target.value })} className="w-full h-12 sm:h-10 bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-xl sm:rounded-2xl px-5 sm:px-6 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--ease2event-brand-primary)]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Optional" />
          </div>
        </div>
      </div>


    </div>
  );
};

export default ProfileSettings;
