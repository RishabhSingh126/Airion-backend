import React, { useState, useMemo } from 'react';
import { Star, MessageSquare, ThumbsUp, Filter, Search, ChevronDown, User, Reply, MoreVertical, TrendingUp, Loader2 } from 'lucide-react';
import { Button, Badge, Skeleton, notify } from '@ease2event/ui';
import { useAuth } from '@ease2event/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVendorReviews, replyToReview } from '../lib/api';

const Reviews: React.FC = () => {
    const { user } = useAuth();
    const vendorId = user?.vendor?.id || user?.id || '';
    const queryClient = useQueryClient();
    
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const { data: rawReviews = [], isLoading } = useQuery({
        queryKey: ['vendor-reviews', vendorId],
        queryFn: async () => {
            if (!vendorId) return [];
            const res: any = await fetchVendorReviews(vendorId);
            return res.data || res;
        },
        enabled: !!vendorId
    });

    const reviewsData = useMemo(() => {
        return rawReviews || [];
    }, [rawReviews]);

    const stats = useMemo(() => {
        const total = reviewsData.length;
        if (total === 0) return { average: 0, total: 0, distribution: [5, 4, 3, 2, 1].map(s => ({ stars: s, percentage: 0 })) };

        const sum = reviewsData.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
        const average = (sum / total).toFixed(1);

        const distribution = [5, 4, 3, 2, 1].map(stars => {
            const count = reviewsData.filter((r: any) => Math.round(r.rating) === stars).length;
            return { stars, percentage: Math.round((count / total) * 100) };
        });

        return { average, total, distribution };
    }, [reviewsData]);

    const filteredReviews = useMemo(() => {
        let result = reviewsData;

        // Apply filters
        if (filter === 'positive') result = result.filter((r: any) => r.rating >= 4);
        else if (filter === 'negative') result = result.filter((r: any) => r.rating <= 3);
        else if (filter === 'no_reply') result = result.filter((r: any) => !r.vendorReply);

        // Apply search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter((r: any) => 
                r.user?.name?.toLowerCase().includes(lowerQuery) || 
                r.reviewText?.toLowerCase().includes(lowerQuery) ||
                r.service?.title?.toLowerCase().includes(lowerQuery)
            );
        }

        return result;
    }, [reviewsData, filter, searchQuery]);

    const replyMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            return replyToReview(id, vendorId, text);
        },
        onSuccess: () => {
            notify.success('Reply posted successfully!');
            setReplyingTo(null);
            setReplyText('');
            queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
        },
        onError: (err: any) => {
            notify.error(err.response?.data?.message || err.message || 'Failed to post reply');
        }
    });

    const handleSendReply = (id: string) => {
        if (!replyText.trim()) return notify.error('Reply text cannot be empty');
        replyMutation.mutate({ id, text: replyText });
    };

    return (
        <div className="space-y-5 pb-6 px-4 md:px-0 max-w-full">
            <header className="space-y-4 border-b border-[var(--ease2event-border-subtle)] pb-6">
                <h1 className="text-xl font-bold text-[var(--ease2event-text-primary)] tracking-tight">Reviews</h1>
                <p className="text-lg font-semibold text-[var(--ease2event-text-secondary)]">Manage your reputation and interact with your clients performance.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Sidebar */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="card-minimal p-6 rounded-xl border-[var(--ease2event-border-base)] text-center space-y-6">
                        <div className="text-6xl font-bold text-[var(--ease2event-text-primary)] tracking-tighter">
                            {isLoading ? <Skeleton className="h-16 w-24 mx-auto" /> : stats.average}
                        </div>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={16} className={s <= Number(stats.average) ? 'text-yellow-400 fill-yellow-400 drop-' : 'text-[var(--ease2event-border-base)]'} />
                            ))}
                        </div>
                        <p className="text-xs font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest">{stats.total} Total Reviews</p>

                        <div className="mt-12 space-y-4 pt-8 border-t border-[var(--ease2event-border-subtle)]">
                            {stats.distribution.map((d) => (
                                <div key={d.stars} className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] w-4 tracking-tighter">{d.stars}★</span>
                                    <div className="flex-1 h-2.5 bg-[var(--ease2event-bg-elevated)] rounded-full overflow-hidden border border-[var(--ease2event-border-subtle)]">
                                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${d.percentage}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[var(--ease2event-text-primary)] min-w-[30px]">{d.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--ease2event-bg-surface)] border border-blue-500/20 p-6 rounded-xl space-y-4 relative overflow-hidden group">
                        <div className="absolute -top-6 -right-10 w-32 h-32 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform " />
                        <div className="flex items-center gap-3 text-blue-500">
                            <TrendingUp size={16} />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Growth Insights</h3>
                        </div>
                        <p className="text-sm font-semibold text-[var(--ease2event-text-primary)] leading-relaxed tracking-tight">
                            Replying within <span className="text-blue-500">24 hours</span> increases your conversion probability by <span className="text-emerald-500">15%</span>. Faster responses lead to higher trust.
                        </p>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-[var(--ease2event-bg-elevated)] p-3 rounded-xl border border-[var(--ease2event-border-subtle)] overflow-hidden">
                        <div className="flex bg-[var(--ease2event-bg-surface)] p-1.5 rounded-xl w-full sm:w-auto border border-[var(--ease2event-border-subtle)] overflow-x-auto scrollbar-hide">
                            {['all', 'positive', 'negative', 'no_reply'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`cursor-pointer px-4 md:px-6 py-2.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase transition-all tracking-widest whitespace-nowrap ${filter === t
                                        ? 'bg-[var(--ease2event-brand-primary)] text-white '
                                        : 'text-[var(--ease2event-text-muted)] hover:text-[var(--ease2event-text-primary)]'}`}
                                >
                                    {(() => {
                                        const labels: { [key: string]: string } = {
                                            all: 'All Reviews',
                                            positive: 'Positive',
                                            negative: 'Critical',
                                            no_reply: 'Pending Reply'
                                        };
                                        return labels[t] || t;
                                    })()}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full sm:max-w-xs group px-2 sm:px-0">
                            <Search className="absolute left-4 sm:left-3 top-1/2 -translate-y-1/2 text-[var(--ease2event-text-secondary)] group-focus-within:text-[var(--ease2event-brand-primary)] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-[var(--ease2event-brand-primary)]/10 text-[var(--ease2event-text-primary)] outline-none placeholder-[var(--ease2event-text-secondary)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="card-minimal p-6 rounded-xl border-[var(--ease2event-border-base)] space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4 items-center">
                                            <Skeleton className="w-16 h-12 rounded-2xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="w-32 h-6" />
                                                <Skeleton className="w-24 h-4" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-24 h-8 rounded-xl" />
                                    </div>
                                    <Skeleton className="w-full h-16 rounded-xl" />
                                </div>
                            ))
                        ) : filteredReviews.length === 0 ? (
                            <div className="p-10 text-center bg-[var(--ease2event-bg-surface)] rounded-xl border border-[var(--ease2event-border-subtle)]">
                                <MessageSquare size={32} className="mx-auto text-[var(--ease2event-text-muted)] mb-4" />
                                <h3 className="font-bold text-lg text-[var(--ease2event-text-primary)]">No reviews found</h3>
                                <p className="text-sm text-[var(--ease2event-text-secondary)] mt-2">There are no reviews matching your current filters.</p>
                            </div>
                        ) : (
                            filteredReviews.map((rev: any) => (
                                <div key={rev.id} className="card-minimal p-6 rounded-xl border-[var(--ease2event-border-base)] transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ease2event-brand-primary)]/5 rounded-bl-full translate-x-12 -translate-y-12 transition-transform "></div>

                                    <div className="flex justify-between items-start mb-8 flex-col sm:flex-row gap-4 sm:gap-6">
                                        <div className="flex gap-4 sm:gap-6 items-center">
                                            <div className="relative shrink-0">
                                                {rev.user?.avatar ? (
                                                    <img src={rev.user.avatar} className="w-14 h-14 sm:w-16 sm:h-12 rounded-2xl object-cover border-2 border-[var(--ease2event-border-subtle)] transition-transform" alt={rev.user?.name} />
                                                ) : (
                                                    <div className="w-14 h-14 sm:w-16 sm:h-12 rounded-2xl border-2 border-[var(--ease2event-border-subtle)] bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl uppercase">
                                                        {(rev.user?.name || 'A')[0]}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[var(--ease2event-bg-surface)]"></div>
                                            </div>
                                            <div className="space-y-1.5 min-w-0">
                                                <h4 className="font-bold text-lg sm:text-xl text-[var(--ease2event-text-primary)] tracking-tight truncate max-w-[200px] sm:max-w-full">{rev.user?.name || 'Anonymous User'}</h4>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1 shrink-0">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} size={14} className={s <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--ease2event-border-subtle)]'} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-[var(--ease2event-text-secondary)] font-bold tracking-widest truncate">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="chip-soft-blue px-3 sm:px-5 h-8 sm:h-9 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest border border-blue-500/20 whitespace-nowrap self-start">
                                            Service: {rev.service?.title || 'General'}
                                        </Badge>
                                    </div>

                                    <div className="mb-10 bg-[var(--ease2event-bg-elevated)] p-4 sm:p-5 rounded-xl border border-[var(--ease2event-border-subtle)] relative">
                                        <p className="text-sm sm:text-base text-[var(--ease2event-text-primary)] leading-relaxed font-bold">
                                            "{rev.reviewText}"
                                        </p>
                                    </div>

                                    {rev.vendorReply ? (
                                        <div className="bg-[var(--ease2event-bg-surface)] p-4 sm:p-5 rounded-xl border-l-8 border-[var(--ease2event-brand-primary)] ml-2 sm:ml-6 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Reply size={16} className="text-[var(--ease2event-brand-primary)] shrink-0" />
                                                <p className="text-[10px] font-bold text-[var(--ease2event-brand-primary)] uppercase tracking-widest">Vendor Response</p>
                                            </div>
                                            <p className="text-sm font-bold text-[var(--ease2event-text-secondary)] leading-relaxed">
                                                {rev.vendorReply}
                                            </p>
                                        </div>
                                    ) : replyingTo === rev.id ? (
                                        <div className="mt-8 space-y-5 relative">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your response to the customer..."
                                                className="w-full p-4 sm:p-5 text-sm font-bold bg-[var(--ease2event-bg-elevated)] border-2 border-[var(--ease2event-border-subtle)] rounded-xl outline-none focus:border-[var(--ease2event-brand-primary)]/40 focus:ring-4 focus:ring-[var(--ease2event-brand-primary)]/5 transition-all resize-none shadow-norm text-[var(--ease2event-text-primary)]"
                                                rows={3}
                                                disabled={replyMutation.isPending}
                                            />
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    className="px-5 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest w-full sm:w-auto"
                                                    disabled={replyMutation.isPending}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => handleSendReply(rev.id)} 
                                                    disabled={replyMutation.isPending}
                                                    className="px-6 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-blue-500/20 w-full sm:w-auto"
                                                >
                                                    {replyMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                                    {replyMutation.isPending ? 'Sending...' : 'Send Response'}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setReplyingTo(rev.id); setReplyText(''); }}
                                            className="mt-4 flex items-center gap-3 text-[10px] font-bold text-[var(--ease2event-brand-primary)] hover:text-blue-600 transition-all uppercase tracking-widest group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center transition-transform group-hover:bg-blue-500/20">
                                                <Reply size={14} />
                                            </div>
                                            Reply to Review
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
