import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Plus, Mail as MailIcon, MessageSquare, Phone, ChevronRight, FileText, CheckCircle, Clock, Send, ArrowLeft, Loader2, Wallet, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askSupportAI, fetchWalletOverview } from '@/lib/api';
import { useRazorpay } from '@/hooks/useRazorpay';

export const Payments: React.FC = () => {
    const { openCheckout, loading } = useRazorpay();
    const [walletBalance, setWalletBalance] = useState(0);
    const [referrals, setReferrals] = useState<{ id: string | number; name: string; date: string; reward: string; status: string }[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        fetchWalletOverview()
            .then((res: any) => {
                const bal = res?.data?.balance ?? res?.balance ?? 0;
                setWalletBalance(bal);
                const txns = res?.data?.transactions ?? res?.transactions ?? [];
                if (Array.isArray(txns) && txns.length > 0) {
                    setTransactions(txns);
                }
            })
            .catch(() => {});
    }, []);

    const referralCode = 'E2EREF9876';

    const handlePayNow = (txn: any) => {
        openCheckout(txn.numericAmount, {
            description: `Payment for ${txn.vendor}`,
            receiptId: txn.id,
            onSuccess: () => {
                setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, status: 'Completed' } : t));
                toast.success('Your booking is now confirmed!');
            }
        });
    };

    const handleAddFunds = () => {
        openCheckout(1000, {
            description: 'Add Funds to Ease2Event Wallet',
            receiptId: `ADD-${Date.now()}`,
            onSuccess: () => {
                setWalletBalance(prev => prev + 1000);
                setTransactions(prev => [
                    { id: `TXN-W${Date.now().toString().slice(-3)}`, date: new Date().toISOString().split('T')[0], amount: '₹1,000', status: 'Completed', vendor: 'Wallet Deposit', numericAmount: 1000, type: 'Wallet Credit' },
                    ...prev
                ]);
                toast.success('₹1,000 added to your wallet!');
            }
        });
    };

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralCode);
        toast.success('Referral code copied to clipboard!');
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet & Financials</h2>
                <p className="text-gray-500">Manage your virtual balance, cashback, referral rewards, and transactions.</p>
            </div>

            {/* Top Cards: Wallet & Referral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-red-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase tracking-wider font-bold opacity-80">Ease2Event Wallet Balance</p>
                            <h3 className="text-4xl font-black mt-2">₹{walletBalance.toLocaleString()}</h3>
                        </div>
                        <Wallet size={32} className="opacity-80" />
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handleAddFunds}
                            className="px-6 py-3 bg-white text-red-600 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors shadow-lg"
                        >
                            Add Funds
                        </button>
                    </div>
                </div>

                {/* Referral Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                            <Sparkles size={20} />
                            <h4 className="font-bold text-sm uppercase tracking-wider">Refer & Earn</h4>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-slate-400">Share your referral link. You and your friend both earn ₹500 cashback upon their first event booking!</p>
                    </div>
                    
                    <div className="flex gap-3 items-center mt-6">
                        <div className="bg-neutral-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-neutral-200 dark:border-slate-700 font-mono font-bold text-sm tracking-wider flex-1 text-neutral-800 dark:text-white">
                            {referralCode}
                        </div>
                        <button
                            onClick={handleCopyReferral}
                            className="px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs uppercase"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* Referrals list & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Referrals Tracking */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Referrals Progress</h3>
                    <div className="space-y-3">
                        {referrals.length === 0 ? (
                            <p className="py-6 text-center text-xs text-neutral-400">
                                No referral invites yet. Share your code to earn rewards!
                            </p>
                        ) : (
                            referrals.map(ref => (
                                <div key={ref.id} className="flex justify-between items-center py-2.5 border-b border-neutral-100 dark:border-slate-800 last:border-0">
                                    <div>
                                        <p className="text-sm font-bold text-neutral-800 dark:text-white">{ref.name}</p>
                                        <p className="text-xs text-neutral-400">{ref.date}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                        ref.status === 'Earned' 
                                            ? 'bg-green-50 text-green-600 dark:bg-green-500/10' 
                                            : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10'
                                    }`}>
                                        {ref.reward} ({ref.status})
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Transaction history */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Transaction History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-slate-800 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                    <th className="pb-3">Reference ID</th>
                                    <th className="pb-3">Recipient/Source</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 text-sm">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                                            No transactions recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(txn => (
                                        <tr key={txn.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/20">
                                            <td className="py-4 font-mono font-semibold text-neutral-700 dark:text-slate-300">{txn.id}</td>
                                            <td className="py-4 font-semibold text-neutral-900 dark:text-white">
                                                {txn.vendor}
                                                <span className="block text-[10px] text-neutral-400 font-bold uppercase mt-0.5">{txn.type}</span>
                                            </td>
                                            <td className="py-4 font-black text-neutral-900 dark:text-white">{txn.amount}</td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                    txn.status === 'Completed'
                                                        ? 'bg-green-50 text-green-600 dark:bg-green-500/10'
                                                        : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10'
                                                }`}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                {txn.status === 'Pending' ? (
                                                    <button
                                                        onClick={() => handlePayNow(txn)}
                                                        className="px-3.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold"
                                                    >
                                                        Pay Now
                                                    </button>
                                                ) : (
                                                    <button className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase">
                                                        <Download size={14} /> Print
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const DigitalInvites: React.FC = () => {
    const templates = [
        { id: 1, title: 'Royal Gold', category: 'Wedding', color: 'bg-amber-100 dark:bg-amber-900/30' },
        { id: 2, title: 'Modern Minimal', category: 'Corporate', color: 'bg-slate-100 dark:bg-slate-800' },
        { id: 3, title: 'Floral Elegance', category: 'Party', color: 'bg-pink-100 dark:bg-pink-900/30' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Invitations</h2>
                    <p className="text-gray-500">Select a template and share beautifully crafted invites.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800  transition-all cursor-pointer">
                        <div className={`h-40 w-full ${template.color} flex items-center justify-center`}>
                            <FileText size={48} className="text-gray-400/50 dark:text-slate-500/50" />
                        </div>
                        <div className="p-4">
                            <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">{template.category}</span>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{template.title}</h3>
                            <button className="mt-4 w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                Customize <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Support: React.FC = () => {
    const [isChatting, setIsChatting] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm your Airion AI Assistant. How can I help you plan your event today?", sender: 'support', time: 'Just now' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userMsg = inputValue;
        const newUserMessage = {
            id: Date.now(),
            text: userMsg,
            sender: 'user',
            time: 'Just now'
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const result = await askSupportAI(userMsg) as any;
            const aiResponse = result?.response || result?.data?.response || "I'm sorry, I encountered a brief neural glitch. Could you repeat that?";

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: aiResponse,
                sender: 'support',
                time: 'Just now'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "My apologies, I'm having trouble connecting to my central knowledge base. Please try again in a moment.",
                sender: 'support',
                time: 'Just now'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isChatting) {
        return (
            <div className="max-w-2xl mx-auto h-[550px] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="p-5 bg-gradient-to-r from-red-500 to-red-600 text-white flex justify-between items-center shadow-lg relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">AI</div>
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-lg">Airion Assistant</h3>
                            <div className="flex items-center gap-1.5 opacity-90">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Neural Network Active</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsChatting(false)} className="px-4 py-2 bg-black/10 hover:bg-black/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <ArrowLeft size={14} /> Exit
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30 dark:bg-slate-950/20">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm relative transition-all ${msg.sender === 'user'
                                ? 'bg-red-500 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-none'
                                }`}>
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 block ${msg.sender === 'user' ? 'text-red-100' : 'text-gray-400'}`}>
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-[1.5rem] rounded-tl-none border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                                <Loader2 size={16} className="text-red-500 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse">Assistant is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Ask me anything about your event..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                            className="h-14 px-6 rounded-2xl bg-neutral-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium pr-12"
                        />
                    </div>
                    <Button type="submit" disabled={!inputValue.trim() || isTyping} className="h-14 w-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-xl shadow-red-500/20  active:scale-95 transition-all shrink-0">
                        <Send size={20} />
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h2>
                <p className="text-gray-500">Need assistance? We're here to help you coordinate your perfect event.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Live Chat</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Talk to our event support specialists instantly for immediate resolution.</p>
                    <Button
                        onClick={() => setIsChatting(true)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl w-full"
                    >
                        Start Chat
                    </Button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="grid gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-600 dark:text-gray-300">
                                <Phone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Call Us</h4>
                                <p className="text-sm text-gray-500">+91 1800-Ease2event (Toll Free)</p>
                                <p className="text-xs text-gray-400 mt-1">Mon-Sun, 9:00 AM - 9:00 PM</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-600 dark:text-gray-300">
                                <MailIcon size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Email Support</h4>
                                <p className="text-sm text-gray-500">support@ease2event.com</p>
                                <p className="text-xs text-gray-400 mt-1">We typically reply within 24 hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Terms: React.FC = () => (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-neutral-800 dark:text-slate-200 transition-colors duration-300">
        {/* Compact Banner Header */}
        <div className="bg-gradient-to-b from-neutral-50/90 to-white dark:from-slate-900/70 dark:to-slate-950 border-b border-neutral-200/50 dark:border-slate-800/80 py-6 sm:py-9 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <FileText size={11} />
                    Legal Terms
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    Terms of Service
                </h1>
                <p className="text-[11px] sm:text-xs text-neutral-400 dark:text-slate-400 font-medium">
                    Effective: March 2026 • Rules and guidelines for using Ease2event.
                </p>
            </div>
        </div>

        {/* Compact Cards Container */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4">
            {/* Intro Alert Box */}
            <div className="p-3.5 sm:p-4 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/10 dark:border-red-500/20 text-xs sm:text-sm text-neutral-700 dark:text-slate-300 leading-relaxed font-medium">
                Welcome to Ease2event. By accessing or using our platform, you agree to be bound by these terms. If you do not agree to all terms, please refrain from using the platform.
            </div>

            {/* Section 1 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">1</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Use of Service
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    You agree to use Ease2event only for lawful purposes related to event planning and execution. Any fraudulent activities, including fake bookings or dummy vendor profiles, will result in immediate termination of your account and access privileges.
                </p>
            </div>

            {/* Section 2 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">2</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        User Responsibilities
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. You must notify us immediately of any unauthorized use or security breach.
                </p>
            </div>

            {/* Section 3 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">3</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Limitation of Liability
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    Ease2event acts as a platform bridging users and vendors. We are not liable for quality disputes between parties, though we provide dedicated resolution support services to facilitate fair outcomes.
                </p>
            </div>
        </div>
    </div>
);

export const Privacy: React.FC = () => (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-neutral-800 dark:text-slate-200 transition-colors duration-300">
        {/* Compact Banner Header */}
        <div className="bg-gradient-to-b from-neutral-50/90 to-white dark:from-slate-900/70 dark:to-slate-950 border-b border-neutral-200/50 dark:border-slate-800/80 py-6 sm:py-9 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Shield size={11} />
                    Data Protection
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    Privacy Policy
                </h1>
                <p className="text-[11px] sm:text-xs text-neutral-400 dark:text-slate-400 font-medium">
                    Effective: March 2026 • How Ease2event respects and protects your data.
                </p>
            </div>
        </div>

        {/* Compact Cards Container */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4">
            {/* Intro Alert Box */}
            <div className="p-3.5 sm:p-4 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/10 dark:border-red-500/20 text-xs sm:text-sm text-neutral-700 dark:text-slate-300 leading-relaxed font-medium">
                Your privacy is paramount at Ease2event. We are committed to protecting your personal data and maintaining full transparency across our event platform.
            </div>

            {/* Section 1 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">1</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Data Collection
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    We collect essential identity parameters including phone numbers, emails, and event preferences to synthesize a personalized experience and facilitate direct coordination with verified service providers.
                </p>
            </div>

            {/* Section 2 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">2</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Security Protocols
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    We implement end-to-end encryption and industry-standard security safeguards for all sensitive transactions, communications, and data storage within our registry.
                </p>
            </div>

            {/* Section 3 */}
            <div className="p-4 sm:p-5 bg-neutral-50/50 dark:bg-slate-900/40 rounded-2xl border border-neutral-200/60 dark:border-slate-800/80 shadow-xs space-y-2 transition-colors hover:border-red-500/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">3</span>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Data Usage
                    </h2>
                </div>
                <p className="text-xs sm:text-sm font-normal text-neutral-600 dark:text-slate-300 leading-relaxed sm:leading-6 sm:pl-8">
                    Your data is exclusively used for event orchestration and portal synchronization. We do not sell identity telemetry or personal information to external entities.
                </p>
            </div>
        </div>
    </div>
);
