import React, { useState } from 'react';
import { X, Calendar, Clock, Users, CheckCircle, CreditCard, ArrowRight, ArrowLeft, Shield, Plus, FileText, Briefcase, Camera, Music, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { createBooking, createPaymentOrder, verifyPayment } from '../lib/api';
import { useAuth } from '@ease2event/shared/auth';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventName: string;
    price: string;
    vendorId: string;
    initialPackage?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, eventName, price, vendorId, initialPackage }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Booking State
    const [formData, setFormData] = useState({
        occasion: '',
        date: '',
        time: '',
        guests: '',
        package: initialPackage || 'Silver',
        details: '',
        addons: [] as string[],
        isEmi: false,
    });

    if (!isOpen) return null;

    const basePrice =
        formData.package === 'Silver' ? 50000 :
            formData.package === 'Gold' ? 100000 :
                formData.package === 'Platinum' ? 200000 :
                    parseFloat(price.replace(/[^\d.-]/g, '')) || 0;

    const addonsTotal = formData.addons.length * 15000; // Flat ₹15k per addon for demo
    const dynamicPrice = basePrice + addonsTotal;

    const handlePayment = async (order: any, bookingId: string) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SoVyCbeWSJWBW1',
            amount: order.amount,
            currency: "INR",
            name: "Ease2event Event Booking",
            description: `Payment for ${eventName}`,
            order_id: order.order_id,
            handler: async (response: any) => {
                setLoading(true);
                try {
                    await verifyPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature
                    }, bookingId);

                    navigate('/booking-confirmation', { state: { ...formData, eventName, total: dynamicPrice } });
                } catch (error) {
                    alert('Payment Verification Failed');
                } finally {
                    setLoading(false);
                }
            },
            prefill: {
                name: user?.name || "",
                email: user?.email || "",
                contact: user?.phoneNumber || "",
            },
            theme: { color: "#ef4444" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await createBooking({
                vendorId,
                totalAmount: dynamicPrice,
                eventDate: formData.date ? new Date(`${formData.date}T${formData.time || '12:00'}`) : undefined,
                specialRequirements: `Occasion: ${formData.occasion} | Package: ${formData.package} | Addons: ${formData.addons.join(', ')} | Details: ${formData.details}`
            });

            if (res.success && res.booking) {
                const order = await createPaymentOrder(dynamicPrice, res.booking.id);
                handlePayment(order, res.booking.id);
            }
        } catch (error: any) {
            console.error(error);
            alert('Failed to initiate booking: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(6, s + 1));
    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const addonsList = [
        { id: 'drone', label: 'Drone Photography', icon: Camera, price: '₹15,000' },
        { id: 'dj', label: 'Extended DJ Hours', icon: Music, price: '₹15,000' },
        { id: 'sparklers', label: 'Cold Sparklers Entry', icon: Sparkles, price: '₹15,000' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-neutral-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-4">
                        {step > 1 && (
                            <button onClick={prevStep} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-neutral-600 dark:text-slate-300" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Reserve {eventName}</h2>
                            <p className="text-xs text-neutral-500 dark:text-slate-400 font-medium">Step {step} of 6</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors text-neutral-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 dark:bg-slate-800 h-1.5 shrink-0">
                    <div className="bg-red-500 h-1.5 transition-all duration-500 ease-out" style={{ width: `${(step / 6) * 100}%` }}></div>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8 overflow-y-auto grow custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {/* Step 1: Occasion */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">What's the occasion?</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Wedding', 'Birthday', 'Corporate Event', 'Anniversary', 'Social Gathering', 'Other'].map(occ => (
                                            <button
                                                key={occ}
                                                onClick={() => { setFormData({ ...formData, occasion: occ }); nextStep(); }}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.occasion === occ ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-bold' : 'border-neutral-200 dark:border-slate-700  text-neutral-700 dark:text-slate-300 font-medium'}`}
                                            >
                                                {occ}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Date & Event Details */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">When is it happening?</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-2">Event Date</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors" size={18} />
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full pl-12 p-3.5 border border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-2">Event Time</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors" size={18} />
                                                <input
                                                    type="time"
                                                    value={formData.time}
                                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                    className="w-full pl-12 p-3.5 border border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-2">Estimated Guests</label>
                                            <div className="relative group">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors" size={18} />
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 200"
                                                    value={formData.guests}
                                                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                                    className="w-full pl-12 p-3.5 border border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Package */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Select a Package</h3>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Silver', price: '₹50,000', desc: 'Standard essential coverage and basic delivery.' },
                                            { name: 'Gold', price: '₹1,00,000', desc: 'Premium services, extended hours, and top-tier materials.', popular: true },
                                            { name: 'Platinum', price: '₹2,00,000', desc: 'Ultimate VIP experience, unlimited coverage, luxury goods.' }
                                        ].map(pkg => (
                                            <div
                                                key={pkg.name}
                                                onClick={() => setFormData({ ...formData, package: pkg.name })}
                                                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.package === pkg.name ? 'border-red-500 bg-red-50/50 dark:bg-red-500/10' : 'border-neutral-200 dark:border-slate-700  dark:'}`}
                                            >
                                                {pkg.popular && (
                                                    <span className="absolute -top-3 left-6 bg-neutral-900 dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-full">Most Popular</span>
                                                )}
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold text-lg text-neutral-900 dark:text-white">{pkg.name}</h4>
                                                    <span className="font-black text-red-500">{pkg.price}</span>
                                                </div>
                                                <p className="text-sm text-neutral-500 dark:text-slate-400">{pkg.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Details */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Any specific requirements?</h3>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-2">Your Vision & Details</label>
                                        <textarea
                                            rows={5}
                                            placeholder="Tell the vendor about your dream setup, strict timelines, or specific themes..."
                                            value={formData.details}
                                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                            className="w-full p-4 border border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white font-medium resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Add-ons */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Enhance your booking</h3>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400 mb-4 -mt-4">Select optional add-ons to make your event even more special.</p>

                                    <div className="space-y-3">
                                        {addonsList.map(addon => {
                                            const isSelected = formData.addons.includes(addon.id);
                                            return (
                                                <div
                                                    key={addon.id}
                                                    onClick={() => {
                                                        const newAddons = isSelected
                                                            ? formData.addons.filter(id => id !== addon.id)
                                                            : [...formData.addons, addon.id];
                                                        setFormData({ ...formData, addons: newAddons });
                                                    }}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-red-500 bg-red-50/30 dark:bg-red-500/10' : 'border-neutral-200 dark:border-slate-700 '}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-full ${isSelected ? 'bg-red-100 text-red-500' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500'}`}>
                                                            <addon.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-neutral-900 dark:text-white">{addon.label}</h4>
                                                            <p className="text-xs text-neutral-500">{addon.price}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-neutral-300 dark:border-slate-600'}`}>
                                                        {isSelected && <CheckCircle size={14} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Payment Review */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Review & Pay</h3>

                                    <div className="bg-neutral-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-neutral-200 dark:border-slate-700 space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-slate-700">
                                            <div>
                                                <h4 className="font-bold text-neutral-900 dark:text-white">{formData.package} Package</h4>
                                                <p className="text-xs text-neutral-500">{eventName}</p>
                                            </div>
                                            <span className="font-bold">₹{basePrice.toLocaleString()}</span>
                                        </div>

                                        {formData.addons.length > 0 && (
                                            <div className="pb-4 border-b border-neutral-200 dark:border-slate-700">
                                                <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Add-ons</p>
                                                {formData.addons.map(a => (
                                                    <div key={a} className="flex justify-between text-sm mb-1">
                                                        <span className="text-neutral-700 dark:text-slate-300">{addonsList.find(x => x.id === a)?.label}</span>
                                                        <span className="font-medium">₹15,000</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold text-lg text-neutral-900 dark:text-white">Total</span>
                                            <span className="font-black text-2xl text-red-500">₹{dynamicPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id="emi"
                                                className="peer w-5 h-5 text-red-500 rounded focus:ring-red-500 border-neutral-300"
                                                checked={formData.isEmi}
                                                onChange={(e) => setFormData({ ...formData, isEmi: e.target.checked })}
                                            />
                                        </div>
                                        <label htmlFor="emi" className="flex-1 cursor-pointer">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <CreditCard size={16} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                                                <span className="block font-bold text-neutral-900 dark:text-white">Pay with EMI</span>
                                            </div>
                                            <span className="block text-xs text-neutral-500 dark:text-slate-400">Starting at ₹{(dynamicPrice / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month with 0% interest</span>
                                        </label>
                                    </div>

                                    <div className="flex items-start gap-3 text-xs text-neutral-500 dark:text-slate-400 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-700 dark:text-blue-300">
                                        <Shield size={16} className="shrink-0 mt-0.5" />
                                        <p>Secure payment protected by industry standard 256-bit encryption. Ease2event guarantees full refund on cancellations 14 days before the event.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-neutral-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
                    <div className="flex gap-4">
                        {step < 6 ? (
                            <button
                                onClick={nextStep}
                                disabled={step === 1 && !formData.occasion || step === 2 && (!formData.date || !formData.time)}
                                className="w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled: shadow-lg"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-neutral-900 dark:hover:bg-white text-white dark:hover:text-neutral-900 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled: shadow-xl shadow-red-500/20"
                                >
                                    {loading ? 'Processing Secure Payment...' : 'Confirm & Pay Now'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BookingModal;
