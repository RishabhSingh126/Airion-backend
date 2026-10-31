import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, Zap, Crown, Lock, ChevronDown, ShieldCheck, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button, Badge } from '@ease2event/ui';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useVendorSubscription, SubscriptionPlan } from '../hooks/useVendorSubscription';

export default function PremiumUpgrade() {
    const { subscription, isPremium, isLoading: isSubLoading, refetch } = useVendorSubscription();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isPlansLoading, setIsPlansLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setIsPlansLoading(true);
            const res: any = await api.get('/subscriptions/plans', { params: { type: 'vendor' } });
            const data = res.data?.data || res.data || [];
            if (Array.isArray(data)) {
                setPlans(data);
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            toast.error('Could not load subscription plans.');
        } finally {
            setIsPlansLoading(false);
        }
    };

    const handleCheckout = async (planId: string) => {
        try {
            setIsCheckingOut(true);
            const res: any = await api.post('/subscriptions/checkout', { planId });
            const data = res.data?.data || res.data;
            
            if (data.url) {
                // Redirect to actual payment gateway if url is provided
                window.location.href = data.url;
            } else if (data.success) {
                // If payment confirmed immediately
                toast.success(data.message || 'Payment initiated successfully!');
                // Refetch subscription state to reflect the change if the backend activated it immediately
                await refetch();
            } else {
                toast.error('Failed to initiate checkout.');
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.message || 'Error processing checkout.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your Premium subscription? You will lose access to premium features at the end of your billing cycle.')) return;
        
        try {
            await api.post('/subscriptions/cancel');
            toast.success('Subscription cancelled successfully.');
            await refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error cancelling subscription.');
        }
    };

    const monthlyPlans = plans.filter(p => p.billingCycle === 'monthly');
    const yearlyPlans = plans.filter(p => p.billingCycle === 'yearly');
    
    // Fallbacks if backend has no plans defined
    const displayPlans = billingCycle === 'yearly' && yearlyPlans.length > 0 ? yearlyPlans : monthlyPlans;

    // Calculate discount dynamically if both monthly and yearly plans exist
    let discountPercent = 0;
    if (yearlyPlans.length > 0 && monthlyPlans.length > 0) {
        const matchingMonthly = monthlyPlans.find(p => p.name === yearlyPlans[0].name) || monthlyPlans[0];
        const yearlyPrice = yearlyPlans[0].price;
        const equivalentMonthlyPrice = matchingMonthly.price * 12;
        if (equivalentMonthlyPrice > yearlyPrice && yearlyPrice > 0) {
            discountPercent = Math.round((1 - (yearlyPrice / equivalentMonthlyPrice)) * 100);
        }
    }

    if (isSubLoading || isPlansLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <RefreshCcw className="animate-spin text-[var(--ease2event-brand-primary)]" size={32} />
                <p className="text-[var(--ease2event-text-secondary)] font-medium">Loading subscription details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-32">
            
            {/* ── HERO SECTION ───────────────────────────────────────────────────────── */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 font-semibold text-sm"
                >
                    <Crown size={16} /> 
                    {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                </motion.div>
                
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    {isPremium ? 'You are a Premium Vendor' : 'Scale Your Business Faster.'}
                </h1>
                
                <p className="text-base md:text-lg text-[var(--ease2event-text-secondary)] leading-relaxed">
                    {isPremium 
                        ? 'Thank you for being a premium member. You have access to all advanced tools, priority ranking, and unlimited leads.'
                        : 'Unlock advanced analytics, priority ranking, unlimited leads, and exclusive tools to get booked more often.'}
                </p>
            </div>

            {/* ── ACTIVE SUBSCRIPTION DETAILS ────────────────────────────────────────── */}
            {isPremium && subscription && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-subtle)] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-bold">{subscription.plan?.name || 'Premium Plan'}</h2>
                            <Badge variant={"success" as any} className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                        </div>
                        <p className="text-[var(--ease2event-text-secondary)] font-medium">
                            Billing Cycle: <span className="text-[var(--ease2event-text-primary)] capitalize">{subscription.plan?.billingCycle || 'Monthly'}</span>
                        </p>
                        <p className="text-[var(--ease2event-text-secondary)] font-medium">
                            Renewal Date: <span className="text-[var(--ease2event-text-primary)]">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <div>
                        {subscription.autoRenew ? (
                            <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                Cancel Auto-Renew
                            </Button>
                        ) : (
                            <Badge variant={"warning" as any} className="text-amber-600 bg-amber-50">Cancels at end of period</Badge>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── PRICING TOGGLE ──────────────────────────────────────────────────────── */}
            {!isPremium && plans.length > 0 && (
                <div className="flex justify-center">
                    <div className="bg-[var(--ease2event-bg-elevated)] border border-[var(--ease2event-border-base)] p-1.5 rounded-full inline-flex relative">
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-all ${billingCycle === 'monthly' ? 'text-white' : 'text-[var(--ease2event-text-muted)] hover:text-[var(--ease2event-text-primary)]'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setBillingCycle('yearly')}
                            className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-[var(--ease2event-text-muted)] hover:text-[var(--ease2event-text-primary)]'}`}
                        >
                            Yearly
                            {discountPercent > 0 && (
                                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Save {discountPercent}%</span>
                            )}
                        </button>
                        
                        {/* Animated background pill */}
                        <motion.div 
                            className="absolute inset-y-1.5 bg-[var(--ease2event-brand-primary)] rounded-full z-0"
                            initial={false}
                            animate={{
                                left: billingCycle === 'monthly' ? '6px' : '50%',
                                width: billingCycle === 'monthly' ? 'calc(50% - 6px)' : 'calc(50% - 6px)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>
            )}

            {/* ── PRICING CARDS ──────────────────────────────────────────────────────── */}
            {!isPremium && plans.length > 0 && (
                <div className={`grid gap-8 max-w-7xl mx-auto items-start ${
                    displayPlans.length === 1 ? 'md:grid-cols-2 lg:grid-cols-2' : 
                    displayPlans.length === 2 ? 'md:grid-cols-2 lg:grid-cols-3' :
                    displayPlans.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'
                }`}>
                    
                    {/* Free Tier */}
                    <div className="bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-3xl p-8 lg:p-10 shadow-sm relative overflow-hidden">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--ease2event-text-primary)] mb-2">Basic</h3>
                                <p className="text-[var(--ease2event-text-secondary)] text-sm md:text-base font-medium h-10">Everything you need to get started on Ease2Event.</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold">Free</span>
                                <span className="text-[var(--ease2event-text-muted)] font-medium">forever</span>
                            </div>
                            
                            <div className="pt-6 space-y-4 border-t border-[var(--ease2event-border-subtle)]">
                                {[
                                    "Vendor Profile & Portfolio",
                                    "Manage up to 5 Services",
                                    "Basic Marketplace Visibility",
                                    "Standard Analytics",
                                    "Up to 10 Leads per month"
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-[var(--ease2event-text-muted)] shrink-0 mt-0.5" />
                                        <span className="text-[var(--ease2event-text-secondary)] font-medium">{feat}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <Button className="w-full mt-8 bg-[var(--ease2event-bg-elevated)] text-[var(--ease2event-text-primary)] border border-[var(--ease2event-border-base)] hover:bg-[var(--ease2event-bg-surface)] font-semibold" disabled>
                                Current Plan
                            </Button>
                        </div>
                    </div>

                    {/* Paid Tiers mapped dynamically */}
                    {displayPlans.map((plan, idx) => (
                        <div key={plan.id} className={`bg-[var(--ease2event-bg-elevated)] border rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden ${idx === 0 ? 'border-[var(--ease2event-brand-primary)] shadow-[var(--ease2event-brand-primary)]/10 ring-1 ring-[var(--ease2event-brand-primary)]/20' : 'border-[var(--ease2event-border-subtle)]'}`}>
                            
                            {idx === 0 && (
                                <div className="absolute top-0 right-0 bg-gradient-to-bl from-[var(--ease2event-brand-primary)] to-[var(--ease2event-brand-secondary)] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-6 rounded-bl-2xl">
                                    Recommended
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--ease2event-text-primary)] mb-2 flex items-center gap-2">
                                        {idx === 0 ? <Crown size={20} className="text-amber-500" /> : <Star size={20} className="text-blue-500" />}
                                        {plan.name}
                                    </h3>
                                    <p className="text-[var(--ease2event-text-secondary)] text-sm md:text-base font-medium h-10">{plan.description}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold">₹{plan.price}</span>
                                    <span className="text-[var(--ease2event-text-muted)] font-medium">/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                
                                <div className="pt-6 space-y-4 border-t border-[var(--ease2event-border-subtle)]">
                                    {(plan.features || []).map((feat: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="bg-[var(--ease2event-brand-primary)]/10 p-0.5 rounded-full shrink-0 mt-0.5">
                                                <CheckCircle2 size={16} className="text-[var(--ease2event-brand-primary)]" strokeWidth={3} />
                                            </div>
                                            <span className="text-[var(--ease2event-text-primary)] font-semibold">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <Button 
                                    className="w-full mt-8 bg-[var(--ease2event-brand-primary)] hover:bg-[var(--ease2event-brand-secondary)] text-white font-bold py-4 shadow-lg shadow-[var(--ease2event-brand-primary)]/30 transition-all hover:scale-[1.02]"
                                    onClick={() => handleCheckout(plan.id)}
                                    loading={isCheckingOut}
                                >
                                    <Sparkles size={18} className="mr-2" /> Upgrade to {plan.name}
                                </Button>
                                <p className="text-center text-xs text-[var(--ease2event-text-muted)] font-medium mt-4 flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={14} /> Secure payment
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State / No Plans Error */}
            {!isPremium && plans.length === 0 && !isPlansLoading && (
                <div className="text-center py-20 bg-[var(--ease2event-bg-surface)] rounded-3xl border border-[var(--ease2event-border-subtle)]">
                    <AlertCircle size={48} className="mx-auto text-[var(--ease2event-text-muted)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--ease2event-text-primary)]">Premium Plans Unavailable</h3>
                    <p className="text-[var(--ease2event-text-secondary)] mt-2">We are currently updating our subscription plans. Please check back later.</p>
                </div>
            )}

            {/* ── FAQ SECTION ──────────────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto pt-16 border-t border-[var(--ease2event-border-subtle)] space-y-8">
                <div className="text-center space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold">Frequently Asked Questions</h3>
                    <p className="text-[var(--ease2event-text-secondary)]">Everything you need to know about billing and premium.</p>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-[var(--ease2event-bg-elevated)] p-6 rounded-2xl border border-[var(--ease2event-border-subtle)]">
                        <h4 className="font-bold text-lg mb-2">Can I cancel my subscription anytime?</h4>
                        <p className="text-[var(--ease2event-text-secondary)] leading-relaxed">Yes, you can cancel auto-renewal at any time from this page. You will continue to have Premium access until the end of your current billing period.</p>
                    </div>
                    <div className="bg-[var(--ease2event-bg-elevated)] p-6 rounded-2xl border border-[var(--ease2event-border-subtle)]">
                        <h4 className="font-bold text-lg mb-2">What happens to my data if my Premium expires?</h4>
                        <p className="text-[var(--ease2event-text-secondary)] leading-relaxed">Your account simply returns to the Free plan. No data (listings, reviews, analytics history, or bookings) is deleted. Only access to premium tools will be locked.</p>
                    </div>
                    <div className="bg-[var(--ease2event-bg-elevated)] p-6 rounded-2xl border border-[var(--ease2event-border-subtle)]">
                        <h4 className="font-bold text-lg mb-2">Does Premium mean my listings are Sponsored?</h4>
                        <p className="text-[var(--ease2event-text-secondary)] leading-relaxed">No. Premium provides account-level benefits like advanced analytics and priority search ranking. "Sponsored" listings are separate advertising campaigns designed for maximum visibility.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
