import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Calendar, Users, ArrowRight, Phone, Loader, Crown, AlertCircle, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import FallingPetals from '../components/FallingPetals';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const Packages: React.FC = () => {
  const navigate = useNavigate();

  const { data: packages = [], isLoading, isError } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      let pkgs = [];
      if (Array.isArray(res)) {
        pkgs = res;
      } else if (res && Array.isArray(res.data)) {
        pkgs = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        pkgs = res.data.data;
      }
      return pkgs;
    },
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      eventDate: '',
      message: ''
  });

  const submitInquiryMutation = useMutation({
      mutationFn: async () => {
          await api.post(`/packages/${selectedPackage.id}/inquire`, formData);
      },
      onSuccess: () => {
          toast.success('Inquiry submitted successfully! We will get back to you soon.');
          setIsModalOpen(false);
          setFormData({ customerName: '', customerEmail: '', customerPhone: '', eventDate: '', message: '' });
      },
      onError: () => {
          toast.error('Failed to submit inquiry. Please try again.');
      }
  });

  const handleInquire = (e: React.FormEvent) => {
      e.preventDefault();
      submitInquiryMutation.mutate();
  };

  const openInquiryModal = (pkg: any) => {
      setSelectedPackage(pkg);
      setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">
      <FallingPetals />
      <SEO title="Wedding Packages — Bundle & Save" description="Book multiple wedding days together and enjoy priority vendor allocation, a dedicated wedding manager, and exclusive pricing." />

      {/* ── Hero ── */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=3840&auto=format&fit=crop&q=100&dpr=2"
            alt="Luxury Wedding"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 max-w-4xl px-4 flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-7xl font-normal text-white mb-6 leading-tight font-['Playfair_Display']">
            Exclusive <span className="text-[#ffffff]">Packages</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed">
            Discover curated event bundles by our premium vendors.
          </p>
        </motion.div>
      </section>

      {/* ── Dynamic Packages Grid ── */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Available Packages</h2>
            <p className="text-gray-500 dark:text-slate-400">Handcrafted experiences from our top vendors.</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader size={48} className="animate-spin text-red-500 mb-4" />
              <p className="text-gray-500 font-bold">Loading premium packages...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load packages</h3>
              <p className="text-gray-500">There was an error connecting to our servers. Please try again later.</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-slate-800">
              <ShoppingBag size={64} className="text-gray-300 dark:text-slate-700 mb-6 mx-auto" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">No Packages Available</h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                Our vendors are currently crafting new amazing experiences. Check back soon for exclusive bundles!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg: any, i: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-56 relative overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    {pkg.images?.[0] ? (
                      <img src={pkg.images[0]} alt={pkg.title || pkg.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                        <Crown size={48} className="text-[#c5a059] opacity-50" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest z-10 shadow-lg">
                      {pkg.category?.name || 'Exclusive'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white relative">
                    <h3 className="text-2xl font-black mb-1 line-clamp-1">{pkg.title || pkg.name}</h3>
                    <p className="text-white/60 text-sm font-medium line-clamp-1 mb-6">{pkg.category?.name || 'Package'}</p>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">₹{Number(pkg.basePrice || pkg.price || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    {pkg.description && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 line-clamp-2">
                        {pkg.description}
                    <div className="mt-auto">
                      <button
                        onClick={() => openInquiryModal(pkg)}
                        className="w-full py-4 rounded-2xl font-black text-sm tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-red-600 dark:hover:bg-red-500 dark:hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Inquire Now <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Custom CTA ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-red-950 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ef4444,_transparent)]" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Need a Custom Event Plan?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Every event is unique. Tell us your vision and our experts will craft a bespoke package just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/plan-event')}
                className="inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-red-500/30"
              >
                Build Custom Package <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-2xl font-bold transition-all"
              >
                <Phone size={16} /> Talk to an Expert
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Inquiry Modal */}
      {isModalOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg p-8 relative shadow-2xl">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500">
                      <AlertCircle size={24} className="rotate-45" /> {/* Using alert circle as X for now */}
                  </button>
                  <h3 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Inquire about {selectedPackage.title}</h3>
                  <p className="text-gray-500 mb-6">Fill out the details below and we will get back to you with the best available vendors.</p>

                  <form onSubmit={handleInquire} className="space-y-4">
                      <input 
                          type="text" required placeholder="Your Name" 
                          value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                          className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                      />
                      <input 
                          type="email" required placeholder="Email Address" 
                          value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                          className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                      />
                      <input 
                          type="tel" required placeholder="Phone Number" 
                          value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                          className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                      />
                      <input 
                          type="date" placeholder="Event Date (Optional)" 
                          value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})}
                          className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                      />
                      <textarea 
                          placeholder="Additional Requirements (Optional)" rows={3}
                          value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                          className="w-full bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                      />
                      
                      <button 
                          type="submit" disabled={submitInquiryMutation.isPending}
                          className="w-full py-4 bg-red-500 text-white rounded-xl font-bold mt-4 hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                          {submitInquiryMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};

export default Packages;
