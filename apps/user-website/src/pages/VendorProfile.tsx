import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Star, MapPin, ShieldCheck, Mail, Phone,
    Share2, Heart, Info, CheckCircle2,
    Loader2, Camera, Instagram, Facebook, Globe,
    Users, Tag, ChevronRight, MessageSquare, X, Package as PackageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { toggleWishlist, checkIsWishlisted, recordVendorProfileView } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "@ease2event/shared/auth";

import { useBookingCart } from '../context/BookingCartContext';

const VendorProfile: React.FC = () => {
    const { id: routeId } = useParams<{ id: string }>();
    const id = React.useMemo(() => {
        if (!routeId) return '';
        const match = routeId.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/);
        return match ? match[0] : routeId;
    }, [routeId]);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const packageId = searchParams.get('package');
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const { addToCart, isInCart } = useBookingCart();
    const [vendor, setVendor] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    const selectedPackage = React.useMemo(() => {
        if (!packageId || !services.length) return null;
        
        // Extract UUID if the packageId is a slugified string (e.g., 'updated-form-823b45e1-...')
        const uuidMatch = packageId.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/);
        const actualPackageId = uuidMatch ? uuidMatch[0] : packageId;
        
        // 1. First try to find it as a nested package
        for (const service of services) {
            const pkg = service.packages?.find((p: any) => p.id === actualPackageId || p.name === packageId || p.name === actualPackageId || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === packageId);
            if (pkg) return { ...pkg, serviceTitle: service.title, serviceImage: service.images?.[0], allImages: service.images || [] };
        }
        
        // 2. Fallback: Try to find it as a service itself (since Packages.tsx treats services as packages)
        const srv = services.find((s: any) => s.id === actualPackageId || s.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === packageId);
        if (srv) {
             return {
                 id: srv.id,
                 name: srv.title,
                 description: srv.description,
                 price: srv.basePrice || srv.startingPrice,
                 guestCapacity: srv.guestCapacity,
                 features: srv.features,
                 serviceTitle: srv.category?.name || 'Package',
                 serviceImage: srv.images?.[0],
                 allImages: srv.images || []
             };
        }
        
        return null;
    }, [packageId, services]);
    
    const isWishlistedGlobal = vendor ? isInWishlist(vendor.id) : false;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [vendorRes, servicesRes, reviewsRes, wishlistRes] = await Promise.all([
                    api.get(`/vendors/${id}`),
                    api.get(`/services?vendorId=${id}`),
                    api.get(`/reviews?vendorId=${id}`).catch(() => ({ data: [] })),
                    checkIsWishlisted(id).catch(() => ({ isSaved: false }))
                ]);
                const vendorData = vendorRes.data || vendorRes;
                if (vendorData && (vendorData.id || vendorData.userId)) {
                    setVendor(vendorData);
                    setServices(Array.isArray(servicesRes) ? servicesRes : (servicesRes.data || []));
                    setReviews(Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes.data || []));
                } else {
                    throw new Error('Not found');
                }
            } catch (err) {
                console.error('Failed to load vendor profile from backend:', err);
                setVendor(null);
                setServices([]);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProfile();
    }, [id]);

    const viewRecordedRef = useRef(false);

    useEffect(() => {
        if (!id || viewRecordedRef.current) return;

        const controller = new AbortController();
        viewRecordedRef.current = true; // Optimistic lock

        const recordView = async () => {
            try {
                // Check if user is logged in
                const isLoggedIn = !!localStorage.getItem('ease2event_token');
                
                // Helper to manage cookies
                const getCookie = (name: string) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift();
                };
                const setCookie = (name: string, value: string, days: number) => {
                    const date = new Date();
                    date.setTime(date.getTime() + (days*24*60*60*1000));
                    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
                };

                let guestId = getCookie('guestVisitorId') || localStorage.getItem('guestVisitorId');
                
                // For unauthenticated users, ensure guest ID exists
                if (!isLoggedIn && !guestId) {
                    guestId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                    setCookie('guestVisitorId', guestId, 365);
                    localStorage.setItem('guestVisitorId', guestId);
                } else if (guestId) {
                    // Sync cookie and localStorage if one is missing
                    if (!getCookie('guestVisitorId')) setCookie('guestVisitorId', guestId, 365);
                    if (!localStorage.getItem('guestVisitorId')) localStorage.setItem('guestVisitorId', guestId);
                }

                // Send the request, passing the signal for aborting
                await recordVendorProfileView(id, guestId);
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Failed to record profile view:', error);
                }
            }
        };

        recordView();

        return () => {
            controller.abort();
        };
    }, [id]);

    const handleToggleWishlist = async () => {
        if (!user) {
            toast('Please login or sign up for adding in wishlist.', {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }
        if (!vendor) return;
        
        const vendorObj = {
            id: vendor.id,
            title: vendor.businessName || vendor.title,
            rating: vendor.rating || 0,
            reviews: vendor.reviews || 0,
            location: vendor.location || vendor.address || '',
            price: vendor.price || vendor.startingPrice || '',
            category: vendor.category || vendor.vendorType || '',
            image: vendor.images?.[0] || vendor.portfolioImages?.[0] || vendor.image || '',
            description: vendor.description || '',
            capacity: vendor.capacity || ''
        };

        if (isWishlistedGlobal) {
            removeFromWishlist(vendor.id);
            toast.success('Removed from wishlist');
        } else {
            addToWishlist(vendorObj);
            toast.success('Added to wishlist!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-gray-400 text-sm font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Vendor Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">The vendor profile you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate('/vendors')} className="bg-primary text-white">
                    Explore Vendors
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 border-t border-gray-100">
            {/* Cover Image Header */}
            <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
                <img
                    src={selectedPackage?.images?.[0] || selectedPackage?.serviceImage || vendor.portfolioImages?.[0] || 
                         (selectedPackage ? `https://images.unsplash.com/photo-${['1519167758481-83f550bb49b3', '1511578314322-379afb476865', '1530103862676-de8c9debad1d', '1519741497674-611481863552', '1515232389446-a17ce9ca7434', '1533174072545-7a4b6ad7a6c3'][Math.abs([...(selectedPackage.id || selectedPackage.name || '0')].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6]}?auto=format&fit=crop&q=80&w=2000` : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=2000')
                    }
                    className="w-full h-full object-cover transition-opacity duration-500"
                    alt={selectedPackage ? selectedPackage.name : vendor.businessName}
                    key={selectedPackage ? selectedPackage.id : 'vendor-header'}
                />
                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute bottom-20 left-0 w-full px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex justify-between items-end">
                        <div className="flex gap-4 items-center mb-2">
                            <Button
                                onClick={handleToggleWishlist}
                                size="sm"
                                variant="secondary"
                                className={`rounded-full w-9 h-9 p-0 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none transition-all cursor-pointer ${isWishlistedGlobal ? 'text-red-500 fill-red-500' : ''}`}
                            >
                                <Heart size={18} className={isWishlistedGlobal ? 'fill-red-500 text-red-500' : ''} />
                            </Button>
                            <Button size="sm" variant="secondary" className="rounded-full w-9 h-9 p-0 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none transition-transform ">
                                <Share2 size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Header Info Card */}
                        <div className="card-minimal space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="space-y-4 border-l-4 border-primary pl-6">
                                    <div className="flex items-center gap-2">
                                        {vendor.isVerified && (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                                <ShieldCheck size={10} className="mr-1 inline" /> VERIFIED VENDOR
                                            </Badge>
                                        )}
                                        <Badge className="bg-indigo-50 text-indigo-500 border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                            {selectedPackage ? (selectedPackage.serviceTitle || 'Package') : (vendor.category?.name || 'EXCLUSIVE PARTNER')}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                            {selectedPackage ? selectedPackage.name : vendor.businessName}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
                                            <div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {vendor.city || 'India'}</div>
                                            <div className="flex items-center gap-2"><Star size={14} className="text-amber-400 fill-amber-400" /> {vendor.rating || '5.0'} <span className="text-[8px] text-slate-300">({vendor.totalReviews || 0})</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => {
                                            const cartItemId = selectedPackage?.id || id || vendor.id;
                                            const cartItemName = selectedPackage?.name || vendor.businessName;
                                            const cartItemImage = selectedPackage?.allImages?.[0] || vendor.portfolioImages?.[0] || '';
                                            const cartItemPrice = Number(selectedPackage ? (selectedPackage.price || selectedPackage.basePrice || 0) : (vendor.averageBookingPrice || vendor.startingPrice || 50000));

                                            addToCart({
                                                vendorId: cartItemId,
                                                vendorName: cartItemName,
                                                vendorImage: cartItemImage,
                                                vendorCategory: vendor.businessName || 'Vendor',
                                                vendorCity: vendor.city || 'India',
                                                eventDate: '',
                                                eventTime: '10:00',
                                                guestCount: '50',
                                                occasion: 'Wedding',
                                                selectedPackage: 'Standard',
                                                packagePrice: cartItemPrice,
                                                selectedAddons: [],
                                                addOnServices: [],
                                                specialInstructions: '',
                                            });
                                            toast.success(`${cartItemName} added to booking cart!`);
                                        }}
                                        className={`h-10 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                                            isInCart(selectedPackage?.id || id || vendor.id)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {isInCart(selectedPackage?.id || id || vendor.id) ? '✓ Added to Cart' : '+ Add to Cart'}
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/booking-cart')}
                                        className="h-10 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest bg-neutral-900 text-white hover:bg-neutral-800 transition-all"
                                    >
                                        Book Consultation
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-3 bg-primary rounded-full"></div>
                                <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Overview</h2>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-sm max-w-4xl">
                                {selectedPackage ? selectedPackage.description : (vendor.businessDescription || "A professional service dedicated to providing high-quality experiences tailored to your events needs.")}
                            </p>
                            {/* General Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between flex-1">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Years in Business</span>
                                    <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">{vendor.yearsInBusiness || '5+'} <span className="text-[10px] text-slate-400 ml-1">YRS</span></span>
                                </div>
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between flex-1">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                    <span className="text-lg md:text-xl font-black text-emerald-600 uppercase truncate">ACTIVE</span>
                                </div>
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between flex-1">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Events Handled</span>
                                    <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">10-20 <span className="text-[10px] text-slate-400 ml-1">PTR</span></span>
                                </div>
                            </div>
                            
                            {/* Highlight Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-5 bg-gradient-to-br from-slate-900 to-black dark:from-slate-800 dark:to-slate-950 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                                    <div className="relative z-10">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting Price</span>
                                        <span className="text-2xl md:text-3xl font-black text-white truncate">₹{Number(selectedPackage ? (selectedPackage.price || selectedPackage.basePrice || 0) : (vendor.averageBookingPrice || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 relative z-10">
                                        <Tag className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                </div>
                                <div className="p-5 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                                    <div className="relative z-10">
                                        <span className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">Max Guests</span>
                                        <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{selectedPackage ? (selectedPackage.guestCapacity || 'Custom') : (vendor.capacity || 'Custom')}</span>
                                    </div>
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 relative z-10">
                                        <Users className="text-primary w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {selectedPackage && selectedPackage.features && selectedPackage.features.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                                    <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Included Features</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedPackage.features.map((feat: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{feat.name || feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Gallery Section */}
                        {((selectedPackage?.allImages?.length > 0) || (vendor.portfolioImages?.length > 0)) && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-primary rounded-full"></div>
                                        <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">{selectedPackage ? 'Package Gallery' : 'Work Portfolio'}</h2>
                                    </div>
                                    <Badge className="bg-slate-50 text-slate-400 border-none text-[9px] font-black uppercase tracking-widest">{(selectedPackage?.allImages?.length > 0 ? selectedPackage.allImages : vendor.portfolioImages)?.length || 0} CELLS</Badge>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(selectedPackage?.allImages?.length > 0 ? selectedPackage.allImages : vendor.portfolioImages)?.map((img: string, i: number) => (
                                        <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100 group cursor-pointer shadow-sm  transition-all duration-500">
                                            <img
                                                src={img}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={`Gallery ${i + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {services.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Event Packages & Listings</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {services.map((item: any) => (
                                        <div key={item.id} onClick={() => {
                                            const name = item.title || item.name || 'package';
                                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                            setSearchParams({ package: slug });
                                            window.scrollTo(0, 0);
                                        }} className="flex flex-col bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group">
                                            <div className="h-40 w-full overflow-hidden relative">
                                                <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=400'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 border-none shadow-sm">{item.category?.name || 'Event'}</Badge>
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                                    <Users size={14} className="text-blue-500" /> {item.guestCapacity ? `${item.guestCapacity} Guests` : 'Contact for capacity'}
                                                </div>
                                                {item.features && item.features.length > 0 && (
                                                    <div className="mb-4">
                                                        <ul className="space-y-1">
                                                            {item.features.slice(0, 3).map((feat: any, idx: number) => (
                                                                <li key={idx} className="flex items-start gap-2 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                                                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                                                    <span className="line-clamp-1">{feat.name || feat}</span>
                                                                </li>
                                                            ))}
                                                            {item.features.length > 3 && (
                                                                <li className="text-[10px] text-primary font-bold italic pl-5">
                                                                    + {item.features.length - 3} more features
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                                <div className="mt-auto flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Starting price</p>
                                                        <p className="text-lg font-black text-slate-900 dark:text-white text-primary">₹{Number(item.basePrice).toLocaleString()}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-8 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Awards & Certifications */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Awards & Certifications</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl bg-amber-50/30 dark:bg-amber-900/10 text-center">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">Best Decor 2024</h5>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Wedding Wire</p>
                                </div>
                                <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl bg-amber-50/30 dark:bg-amber-900/10 text-center">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-3">
                                        <Star size={18} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">Premium Partner</h5>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ease2Event</p>
                                </div>
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <section className="space-y-8 pt-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Client Reviews</h2>
                                <Button variant="ghost" className="text-sm text-primary font-bold hover:bg-primary/5 rounded-lg px-4 h-9">
                                    View All {reviews.length}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.length === 0 ? (
                                    <div className="md:col-span-2 py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm font-medium italic">
                                        No reviews yet. Be the first to leave one!
                                    </div>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev.id} className="p-5 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-500 font-bold uppercase">
                                                        {rev.userName?.charAt(0) || 'G'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{rev.userName || 'Verified Guest'}</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 italic">
                                                "{rev.reviewText}"
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-10 space-y-8">

                            {/* Visual Availability Calendar */}
                            <div className="bg-white dark:!bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:!border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 flex flex-col items-center text-center">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Availability Calendar</p>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">Select Your Date</h3>
                                </div>

                                <div className="w-full flex justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <DayPicker
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={[{ before: new Date() }]}
                                        className="!m-0 text-sm"
                                        modifiersClassNames={{
                                            selected: 'bg-primary text-white font-bold rounded-full',
                                            today: 'text-primary font-bold'
                                        }}
                                    />
                                </div>

                                <div className="space-y-4 w-full">
                                    <Button 
                                        onClick={() => {
                                            if (!selectedDate) {
                                                toast.error('Please select a date from the calendar first.');
                                                return;
                                            }
                                            addToCart({
                                                vendorId: id || vendor?.id || '',
                                                vendorName: vendor?.businessName || 'Vendor',
                                                vendorImage: vendor?.portfolioImages?.[0] || '',
                                                vendorCategory: vendor?.category?.name || 'Vendor',
                                                vendorCity: vendor?.city || '',
                                                eventDate: selectedDate.toISOString(),
                                                eventTime: '10:00',
                                                guestCount: '50',
                                                occasion: 'Event',
                                                selectedPackage: 'Standard',
                                                packagePrice: vendor?.startingPrice || vendor?.basePrice || 50000,
                                                selectedAddons: [],
                                                addOnServices: [],
                                                specialInstructions: '',
                                            });
                                            toast.success(`${vendor?.businessName || 'Vendor'} added for ${selectedDate.toLocaleDateString()}!`);
                                            navigate('/booking-cart');
                                        }}
                                        className="w-full h-11 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-red-700 transition-soft">
                                        {selectedDate ? `Book for ${selectedDate.toLocaleDateString()}` : 'Select a Date'}
                                    </Button>
                                    <Button 
                                        onClick={() => navigate(`/dashboard/inbox?vendorId=${id}`)}
                                        variant="outline" 
                                        className="w-full h-11 border-gray-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 dark:bg-transparent rounded-lg font-bold text-xs uppercase tracking-tight hover:bg-gray-50 dark:hover:bg-slate-800 transition-soft"
                                    >
                                        Chat with Vendor
                                    </Button>
                                    <Button 
                                        onClick={() => navigate(`/merchandise?vendorId=${id}`)}
                                        variant="outline" 
                                        className="w-full h-11 border-gray-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 dark:bg-transparent rounded-lg font-bold text-xs uppercase tracking-tight hover:bg-gray-50 dark:hover:bg-slate-800 transition-soft"
                                    >
                                        <Tag size={14} className="mr-2" /> Visit Event Shop
                                    </Button>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                                        <span>Official Handle</span>
                                        <div className="flex gap-4">
                                            <Instagram size={18} className="cursor-pointer hover:text-pink-500 transition-colors" />
                                            <Globe size={18} className="cursor-pointer hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info & Policy Card */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                    <Info size={14} className="text-primary" /> Store Policies
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        '20% Advance to confirm date',
                                        'Free cancellation up to 14 days',
                                        'GST invoice provided for all bookings'
                                    ].map(p => (
                                        <li key={p} className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                            <CheckCircle2 size={12} className="text-emerald-500 mt-0.5" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>



            </main>
        </div>
    );
};

export default VendorProfile;
