import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Calendar, 
  Users, 
  ArrowRight, 
  Phone, 
  X, 
  Sparkles, 
  Crown, 
  ChevronRight,
  Loader,
  AlertCircle,
  Package as PackageIcon,
  ShoppingBag
} from 'lucide-react';
import SEO from '../components/SEO';
import FallingPetals from '../components/FallingPetals';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface PackageItem {
  id: string;
  title: string;
  description?: string;
  basePrice: number | string;
  images?: string[];
  features?: string[];
  isActive?: boolean;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

const Packages: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Modals state
  const [detailPackage, setDetailPackage] = useState<PackageItem | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventDate: '',
    guestCount: '',
    notes: ''
  });

  // Query Backend Packages from live API / Database
  const { data: packages = [], isLoading, isError, refetch } = useQuery<PackageItem[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      let pkgs: PackageItem[] = [];
      if (Array.isArray(res)) {
        pkgs = res;
      } else if (res && Array.isArray((res as any).data)) {
        pkgs = (res as any).data;
      } else if (res && (res as any).data && Array.isArray((res as any).data.data)) {
        pkgs = (res as any).data.data;
      }
      return pkgs;
    }
  });

  // Unique categories derived purely from live packages data
  const categories = useMemo(() => {
    const set = new Set<string>();
    packages.forEach(p => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [packages]);

  // Filtered packages based on live data
  const filteredPackages = useMemo(() => {
    if (activeCategory === 'all') return packages;
    return packages.filter(p => p.category?.name === activeCategory);
  }, [packages, activeCategory]);

  const openBookingModal = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setIsBookingOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
  };

  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackage) return;
      const email = formData.customerEmail.trim() || `${formData.customerPhone.replace(/\D/g, '') || 'client'}@ease2event.in`;
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: email,
        eventDate: formData.eventDate || undefined,
        message: `Package: ${selectedPackage.title} | Guests: ${formData.guestCount || 'Not specified'} | Notes: ${formData.notes || 'None'}`
      };

      await api.post(`/packages/${selectedPackage.id}/inquire`, payload);
    },
    onSuccess: () => {
      toast.success(`Thank you, ${formData.customerName}! Your inquiry has been submitted. We'll contact you shortly. 🎉`, {
        duration: 5000,
        icon: '✨'
      });
      setIsBookingOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        eventDate: '',
        guestCount: '',
        notes: ''
      });
    },
    onError: (err: any) => {
      console.error('Inquiry error:', err);
      toast.error('Failed to submit inquiry. Please try again or call support.');
    }
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error('Please enter your name and phone number.');
      return;
    }
    inquiryMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden selection:bg-red-500 selection:text-white">
      <FallingPetals />
      <SEO 
        title="Wedding Packages — Day by Day Luxury Experiences | Ease2event" 
        description="Luxury-modern cultural wedding packages curated for upper-middle and premium families across India. Day-wise packages, combos, and custom celebrations." 
      />

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.12 }}
            transition={{ duration: 16, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=2400&auto=format&fit=crop&q=85"
            alt="Luxury Wedding India"
            className="w-full h-full object-cover filter brightness-[0.72] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-slate-950/95" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Tagline */}
          <div className="flex items-center gap-3 md:gap-4 text-xs tracking-[0.3em] uppercase text-red-400 font-semibold mb-6">
            <span className="w-8 md:w-12 h-[1px] bg-red-400 inline-block opacity-80" />
            <span>India</span>
            <span className="w-8 md:w-12 h-[1px] bg-red-400 inline-block opacity-80" />
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-white leading-[1.08] tracking-tight mb-6">
            Your Wedding,<br />
            <em className="italic font-light text-red-300">Day by Day</em>
          </h1>

          {/* Paragraph */}
          <p className="max-w-xl text-base md:text-lg text-white/80 font-light leading-relaxed mb-10">
            Luxury-modern cultural experiences curated for upper-middle and premium families. Every function, every moment, elevated.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#packages"
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-bold uppercase tracking-[0.16em] rounded-xl transition-all shadow-xl shadow-red-500/30 hover:-translate-y-0.5"
            >
              Explore Packages
            </a>
            <button
              onClick={() => navigate('/plan-event')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-red-400 text-xs md:text-sm font-semibold uppercase tracking-[0.16em] rounded-xl backdrop-blur-md transition-all hover:-translate-y-0.5"
            >
              Build Custom Package
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50 text-[10px] uppercase tracking-[0.25em]">
          <div className="w-[1px] h-10 bg-gradient-to-b from-red-400 to-transparent animate-pulse" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── PACKAGES SECTION ── */}
      <section id="packages" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] font-bold text-red-600 dark:text-red-400 mb-3">
            <span className="w-6 h-[1.5px] bg-red-500 inline-block" />
            Day-Wise Experiences
            <span className="w-6 h-[1.5px] bg-red-500 inline-block" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-gray-900 dark:text-white leading-tight mb-4">
            Available Packages
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Curated celebrations from verified vendors across India.
          </p>
        </div>

        {/* Dynamic Category Filter Tabs (when categories exist) */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 border border-red-500'
                  : 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:border-red-400 hover:text-red-500'
              }`}
            >
              All Packages
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 border border-red-500'
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:border-red-400 hover:text-red-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content State: Loading, Error, Empty, or Real Packages */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader size={40} className="animate-spin text-red-500 mb-4" />
            <p className="text-sm font-bold text-gray-600 dark:text-slate-400">Loading verified packages...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Packages</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              There was an issue connecting to the package server. Please try again or reach out to our team.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Retry
            </button>
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Graceful, Functional Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto bg-gray-50/70 dark:bg-slate-900/50 rounded-3xl border border-gray-200/80 dark:border-slate-800 p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-6 shadow-sm">
              <Crown size={32} />
            </div>
            <h3 className="font-serif text-2xl md:text-3xl font-normal text-gray-900 dark:text-white mb-3">
              No Packages Available Currently
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-8">
              Our verified vendors are crafting new exclusive celebration bundles. In the meantime, you can build a custom package or connect directly with our event experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                onClick={() => navigate('/plan-event')}
                className="px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-500/20"
              >
                Build Custom Package
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-red-500 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Talk to an Expert
              </button>
            </div>
          </div>
        ) : (
          /* Real Database Packages Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPackages.map((pkg, idx) => {
                const packageImg = pkg.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80';
                const formattedPrice = typeof pkg.basePrice === 'number' 
                  ? `₹${pkg.basePrice.toLocaleString('en-IN')}`
                  : `₹${Number(pkg.basePrice || 0).toLocaleString('en-IN')}`;

                const featureList = Array.isArray(pkg.features) ? pkg.features : [];

                return (
                  <motion.article
                    key={pkg.id}
                    layout
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    onClick={() => setDetailPackage(pkg)}
                    className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300"
                  >
                    {/* Image & Badge */}
                    <div className="h-60 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={packageImg}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[0.92]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                        {pkg.category?.name || 'Exclusive'}
                      </div>

                      {/* Price on image */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-baseline justify-between text-white">
                        <span className="text-lg font-black tracking-wide text-red-200 drop-shadow-md">
                          {formattedPrice}
                        </span>
                        <span className="text-xs text-white/80 font-medium">
                          All-inclusive
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-serif text-2xl font-normal text-gray-900 dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {pkg.title}
                      </h3>

                      {/* Inclusions list */}
                      {featureList.length > 0 ? (
                        <ul className="space-y-2 mb-4 flex-1">
                          {featureList.slice(0, 5).map((item, sIdx) => (
                            <li key={sIdx} className="text-xs text-gray-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-red-500 font-bold shrink-0">—</span>
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : pkg.description ? (
                        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1 leading-relaxed">
                          {pkg.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mb-4 flex-1">
                          Full event coverage with verified vendors.
                        </p>
                      )}

                      {/* Dual Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-3 mt-auto border-t border-gray-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailPackage(pkg);
                          }}
                          className="py-3 px-3 text-xs uppercase tracking-wider font-bold rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-colors text-center"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingModal(pkg);
                          }}
                          className="py-3 px-3 text-xs uppercase tracking-wider font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-md shadow-red-500/20 text-center"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {detailPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailPackage(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-gray-200 dark:border-slate-800 z-10"
            >
              <button
                onClick={() => setDetailPackage(null)}
                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-xs uppercase tracking-[0.25em] font-bold text-red-600 dark:text-red-400 mb-1">
                {detailPackage.category?.name || 'Exclusive Experience'}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-gray-900 dark:text-white mb-2">
                {detailPackage.title}
              </h2>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-6">
                ₹{Number(detailPackage.basePrice || 0).toLocaleString('en-IN')}
              </div>

              {detailPackage.description && (
                <div className="mb-6">
                  <h5 className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Overview
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                    {detailPackage.description}
                  </p>
                </div>
              )}

              {Array.isArray(detailPackage.features) && detailPackage.features.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 dark:text-slate-400 mb-3">
                    Included Features & Services
                  </h5>
                  <ul className="space-y-2.5">
                    {detailPackage.features.map((feature, fIdx) => (
                      <li key={fIdx} className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
                        <ChevronRight size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDetailPackage(null)}
                  className="flex-1 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pkg = detailPackage;
                    setDetailPackage(null);
                    openBookingModal(pkg);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all"
                >
                  Inquire Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BOOKING / INQUIRY MODAL ── */}
      <AnimatePresence>
        {isBookingOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBookingModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-slate-800 z-10"
            >
              <button
                onClick={closeBookingModal}
                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="font-serif text-3xl font-normal text-gray-900 dark:text-white mb-1">
                Inquire for Package
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
                Enquiring for: <strong className="text-red-500">{selectedPackage.title}</strong>
              </p>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.customerPhone}
                      onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="hello@ease2event.in"
                      value={formData.customerEmail}
                      onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                      Approx Guests
                    </label>
                    <select
                      value={formData.guestCount}
                      onChange={e => setFormData({ ...formData, guestCount: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    >
                      <option value="">Select range</option>
                      <option value="Under 50">Under 50</option>
                      <option value="50 – 100">50 – 100</option>
                      <option value="100 – 200">100 – 200</option>
                      <option value="200 – 350">200 – 350</option>
                      <option value="350 – 500">350 – 500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                    Notes / Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us any specific requests, themes, or timings..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={inquiryMutation.isPending}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-[0.14em] shadow-lg shadow-red-500/25 transition-all mt-2 disabled:opacity-50"
                >
                  {inquiryMutation.isPending ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Packages;
