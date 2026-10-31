import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, Info, ArrowLeft, ShieldCheck, MessageSquare, CheckCheck, Sparkles } from 'lucide-react';
import { Button, Badge } from '@ease2event/ui';
import { leadService } from '@ease2event/shared/lib/services/leadService';
import { messageService, Message } from '@ease2event/shared/lib/services/messageService';
import { initiateSocketConnection, getSocket, useAuth } from '@ease2event/shared/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateEasyReply } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const Inbox: React.FC = () => {
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const [activeChat, setActiveChat] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [messageInput, setMessageInput] = useState('');
 const [showMobileChat, setShowMobileChat] = useState(false);
 const [viewMode, setViewMode] = useState<'details' | 'chat'>('details');
 const [conversationId, setConversationId] = useState<string | null>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const [typingUser, setTypingUser] = useState<string | null>(null);

 const { data: apiLeads, isLoading } = useQuery({
 queryKey: ['vendor-leads'],
 queryFn: () => leadService.getVendorLeads().catch(() => []),
 });

 const leads = apiLeads || [];

 const activeLead = leads?.find(lead => lead.id === activeChat);
 const filteredChats = (leads || []).filter(lead =>
 lead.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 lead.notes?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const { data: messages = [], isLoading: loadingMessages } = useQuery({
 queryKey: ['messages', conversationId],
 queryFn: () => conversationId ? messageService.getMessages(conversationId) : Promise.resolve([]),
 enabled: !!conversationId && viewMode === 'chat'
 });

 useEffect(() => {
 if (!user?.id) return;
 const socket = initiateSocketConnection(user.id);

 if (conversationId) {
 socket.emit('joinRoom', conversationId);
 }

 socket.on('receiveMessage', (message: Message) => {
 if (message.conversationId === conversationId) {
 queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => [...(old || []), message]);
 }
 });

 socket.on('userTyping', (data: { userId: string; userName: string }) => {
 if (data.userId !== user?.id) setTypingUser(data.userName);
 });

 socket.on('userStoppedTyping', (data: { userId: string }) => {
 if (data.userId !== user?.id) setTypingUser(null);
 });

 return () => {
 socket.off('receiveMessage');
 socket.off('userTyping');
 socket.off('userStoppedTyping');
 };
 }, [user?.id, conversationId, queryClient]);

 useEffect(() => {
 if (viewMode === 'chat') {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }
 }, [messages, viewMode]);

 const handleChatSelect = async (leadId: string) => {
 setActiveChat(leadId);
 setShowMobileChat(true);
 setViewMode('details');
 setConversationId(null);
 };

 const handleBackToList = () => setShowMobileChat(false);

 const initializeChat = async () => {
 if (!activeLead?.userId) return;
 try {
 const res: any = await messageService.startConversation(activeLead.userId);
 setConversationId(res.id);
 setViewMode('chat');
 } catch (err) {
 console.error('Failed to start conversation:', err);
 }
 };

 const aiReplyMutation = useMutation({
 mutationFn: (inquiry: string) => generateEasyReply(inquiry),
 onSuccess: (data: any) => setMessageInput(data.reply)
 });

 const handleMagicReply = () => {
 const lastCustomerMsg = [...messages].reverse().find(m => m.senderId !== user?.id);
 const inquiryText = lastCustomerMsg?.body || activeLead?.notes || 'Hello, I am interested in your services.';
 aiReplyMutation.mutate(inquiryText);
 };

 const handleSendMessage = (e?: React.FormEvent) => {
 e?.preventDefault();
 if (messageInput.trim() && conversationId) {
 const socket = getSocket();
 if (socket) {
 socket.emit('sendMessage', { conversationId, senderId: user?.id, body: messageInput });
 socket.emit('stopTyping', { conversationId, userId: user?.id });
 setMessageInput('');
 }
 }
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const value = e.target.value;
 setMessageInput(value);
 if (conversationId && user?.id) {
 const socket = getSocket();
 if (socket) {
 socket.emit('typing', { conversationId, userId: user.id, userName: user.name });
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = setTimeout(() => {
 socket.emit('stopTyping', { conversationId, userId: user.id });
 }, 3000);
 }
 }
 };

 return (
 <div className="h-[calc(100vh-12rem)] bg-[var(--ease2event-bg-surface)] rounded-xl border border-[var(--ease2event-border-subtle)] overflow-hidden flex transition-all relative">
 {/* Chat List */}
 <div className={`w-full md:w-96 border-r border-[var(--ease2event-border-subtle)] flex flex-col absolute md:relative inset-0 z-10 bg-[var(--ease2event-bg-surface)] transition-transform ${showMobileChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
 <div className="p-4 md:p-6 border-b border-[var(--ease2event-border-subtle)] bg-[var(--ease2event-bg-elevated)]/50">
 <div className="flex items-center gap-3 bg-[var(--ease2event-bg-surface)] p-1 rounded-2xl border border-[var(--ease2event-border-subtle)] focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
 <div className="pl-3 py-2.5">
 <Search className="text-[var(--ease2event-text-muted)]" size={18} />
 </div>
 <input
 type="text"
 placeholder="Search enquiries..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="flex-1 bg-transparent border-none outline-none text-xs font-bold tracking-widest text-[var(--ease2event-text-primary)] placeholder-[var(--ease2event-text-muted)]"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto scrollbar-hide">
 {isLoading ? (
 <div className="p-5 text-center text-sm font-bold uppercase tracking-widest opacity-40">Searching for enquiries...</div>
 ) : filteredChats.length === 0 ? (
 <div className="p-8 text-center text-xs text-[var(--ease2event-text-secondary)]">
 No customer enquiries yet. Client messages and booking enquiries will appear here.
 </div>
 ) : (
 filteredChats.map((lead, index) => (
 <div
 key={lead.id || index}
 onClick={() => handleChatSelect(lead.id)}
 className={`p-5 mx-3 my-2 rounded-2xl flex gap-4 cursor-pointer transition-all relative border border-transparent ${activeChat === lead.id ? 'bg-[var(--ease2event-bg-elevated)] shadow-md shadow-black/5 border-[var(--ease2event-border-subtle)]' : 'hover:bg-[var(--ease2event-bg-elevated)]/40'}`}
 >
 {activeChat === lead.id && (
 <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 rounded-r-lg bg-[var(--ease2event-brand-primary)]"></div>
 )}
 <div className="relative flex-shrink-0">
 <div className="w-14 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-xl text-white shadow-blue-500/20 uppercase">
 {(lead.user?.name || 'C')[0]}
 </div>
 {lead.aiScore > 75 && (
 <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-[var(--ease2event-bg-surface)] rounded-full flex items-center justify-center text-[8px] text-white font-bold">🔥</span>
 )}
 </div>
 <div className="flex-1 min-w-0 space-y-1">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-lg text-[var(--ease2event-text-primary)] truncate tracking-tight">{lead.user?.name || 'Customer'}</h3>
 <span className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest">{new Date(lead.createdAt).toLocaleDateString()}</span>
 </div>
 <p className={`text-sm tracking-tight truncate ${lead.status === 'pending' ? 'text-[var(--ease2event-text-primary)] font-bold' : 'text-[var(--ease2event-text-secondary)] font-semibold'}`}>
 {lead.notes || 'Enquiry about services...'}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Chat Area */}
 <div className={`flex-1 flex flex-col absolute md:relative inset-0 z-20 bg-[var(--ease2event-bg-surface)] transition-transform ${showMobileChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
 {activeChat ? (
 <>
 {/* Chat Header */}
 <div className="p-4 md:p-5 bg-[var(--ease2event-bg-surface)] border-b border-[var(--ease2event-border-subtle)]">
 <div className="flex items-center justify-between gap-3 bg-[var(--ease2event-bg-elevated)]/50 p-2 md:p-4 rounded-xl border-2 border-[var(--ease2event-border-subtle)] transition-all ">
 <div className="flex items-center gap-3 md:gap-5 min-w-0">
 <button
 onClick={handleBackToList}
 className="md:hidden w-10 h-10 flex items-center justify-center bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] text-[var(--ease2event-text-primary)] hover:bg-[var(--ease2event-bg-elevated)] rounded-xl transition-all shrink-0"
 >
 <ArrowLeft size={18} />
 </button>
 <div className="relative shrink-0">
 <div className="w-10 h-10 md:w-14 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center font-bold text-lg md:text-xl text-white shadow-blue-500/10 uppercase">
 {(activeLead?.user?.name || 'C')[0]}
 </div>
 </div>
 <div className="min-w-0 flex flex-col justify-center">
 <div className="flex items-center gap-1 md:gap-2">
 <h3 className="font-bold text-sm md:text-xl text-[var(--ease2event-text-primary)] tracking-tight uppercase truncate">{activeLead?.user?.name || 'Customer'}</h3>
 <ShieldCheck size={14} className="text-blue-500 shrink-0" />
 </div>
 <p className="text-[8px] md:text-[10px] font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest truncate">
 Status: {activeLead?.status}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {activeLead?.budget && (
 <Badge variant="default" className="px-4 py-2 rounded-full border border-blue-500/20 text-blue-500 bg-white/5 backdrop-blur-md hidden lg:flex">
 ₹{activeLead.budget.toLocaleString()}
 </Badge>
 )}
 </div>
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-hidden flex flex-col relative bg-[var(--ease2event-bg-elevated)]/10">
 <AnimatePresence mode="wait">
 {viewMode === 'details' ? (
 <div
 key="details"
 
 
 
 className="flex-1 p-5 overflow-y-auto"
 >
 <div className="flex justify-center">
 <div className="bg-[var(--ease2event-bg-surface)] border border-[var(--ease2event-border-subtle)] p-5 rounded-xl max-w-xl w-full relative overflow-hidden space-y-5">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
 <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500">Booking Details</h4>
 <div className="grid grid-cols-2 gap-5">
 <div>
 <p className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest mb-1">Target Date</p>
 <p className="text-lg font-bold text-[var(--ease2event-text-primary)]">{activeLead ? new Date(activeLead.eventDate).toLocaleDateString() : 'TBD'}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest mb-1">Guests</p>
 <p className="text-lg font-bold text-[var(--ease2event-text-primary)]">{activeLead?.guestsCount || 'Not specified'}</p>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-bold text-[var(--ease2event-text-secondary)] uppercase tracking-widest">Notes</p>
 <p className="text-sm text-[var(--ease2event-text-secondary)] font-medium leading-relaxed italic border-l-4 border-blue-500 pl-6 py-2 bg-blue-500/5 rounded-r-2xl">
 "{activeLead?.notes || 'No specific notes provided.'}"
 </p>
 </div>
 <div className="pt-6 border-t border-[var(--ease2event-border-subtle)]/50">
 <div className="flex items-start gap-4 text-emerald-500 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
 <ShieldCheck size={16} className="shrink-0 mt-1" />
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest mb-1">AI Recommendation</p>
 <p className="text-xs font-medium leading-relaxed text-emerald-700/80">{activeLead?.aiReasoning}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div
 key="chat"
 
 
 
 className="flex-1 flex flex-col h-full"
 >
 <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
 {loadingMessages ? (
 <div className="flex flex-col gap-4">
 <div className="w-1/2 h-12 bg-gray-200 animate-pulse rounded-2xl" />
 <div className="w-1/3 h-12 bg-gray-200 animate-pulse rounded-2xl self-end" />
 </div>
 ) : (
 messages.map((m: Message, i: number) => (
 <div key={m.id || i} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[85%] md:max-w-md px-5 py-3 rounded-[1.8rem] text-sm ${m.senderId === user?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[var(--ease2event-bg-surface)] text-[var(--ease2event-text-primary)] border border-[var(--ease2event-border-subtle)] rounded-bl-none'}`}>
 <p className="font-semibold leading-relaxed">{m.body}</p>
 <div className={`flex items-center gap-1.5 text-[9px] mt-2 font-bold uppercase tracking-widest ${m.senderId === user?.id ? 'text-blue-100 justify-end' : 'text-[var(--ease2event-text-secondary)]'}`}>
 {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 {m.senderId === user?.id && <CheckCheck size={12} className="text-blue-100" />}
 </div>
 </div>
 </div>
 ))
 )}
 <div ref={messagesEndRef} />
 {typingUser && (
 <div className="flex justify-start">
 <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-none text-xs font-bold text-blue-500 animate-pulse flex items-center gap-2">
 <div className="flex gap-1">
 <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
 <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
 <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
 </div>
 {typingUser} is typing...
 </div>
 </div>
 )}
 </div>

 {/* Message Input */}
 <div className="p-4 md:p-5 bg-[var(--ease2event-bg-surface)] border-t border-[var(--ease2event-border-subtle)]">
 <form onSubmit={handleSendMessage} className="flex items-center gap-3 md:gap-4 bg-[var(--ease2event-bg-elevated)]/50 p-1 md:p-3 rounded-full border border-[var(--ease2event-border-subtle)] focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all ">
 <div className="flex items-center gap-0.5 md:gap-0 pl-2 md:pl-0">
 <button type="button" className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center text-[var(--ease2event-text-muted)] hover:text-blue-500 transition-colors">
 <Paperclip size={18} />
 </button>
 </div>
 <input
 type="text"
 placeholder="Enter response transmission..."
 value={messageInput}
 onChange={handleInputChange}
 className="flex-1 bg-transparent border-none outline-none text-[12px] md:text-base font-bold text-[var(--ease2event-text-primary)] px-1"
 />
 <button
 type="button"
 onClick={handleMagicReply}
 disabled={aiReplyMutation.isPending}
 className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl border transition-all ${aiReplyMutation.isPending ? 'bg-gray-100 opacity-20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white shadow-amber-500/10'}`}
 title="AI Magic Reply"
 >
 {aiReplyMutation.isPending ? <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles size={18} />}
 </button>
 <button
 type="submit"
 disabled={!messageInput.trim()}
 className="p-2 text-blue-600 md:text-white md:bg-blue-600 md:w-14 md:h-10 md:rounded-2xl transition-all md: md:shadow-blue-500/20 hover:scale-110 active:scale-90 flex items-center justify-center shrink-0 mr-2 md:mr-1 disabled:opacity-20"
 >
 <Send size={18} />
 </button>
 </form>
 </div>
 </div>
 )}
 </AnimatePresence>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-[var(--ease2event-text-muted)] bg-[var(--ease2event-bg-elevated)]/30 p-6 relative">
 <div className="absolute inset-0 bg-gradient-to-br from-[var(--ease2event-brand-primary)]/[0.02] to-transparent pointer-events-none" />
 <div className="w-32 h-32 bg-[var(--ease2event-bg-surface)] backdrop-blur-xl border border-[var(--ease2event-border-subtle)] shadow-xl rounded-[40px] flex items-center justify-center mb-8 relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 group-hover:scale-125 transition-transform duration-700" />
 <MessageSquare size={36} className="text-blue-500 relative z-10 drop-shadow-md" />
 </div>
 <p className="text-2xl font-bold text-[var(--ease2event-text-primary)] tracking-tight">Your Enquiries Hub</p>
 <p className="text-sm font-bold tracking-widest text-[var(--ease2event-text-secondary)] mt-3 max-w-sm text-center">Select a conversation from the list to engage with potential clients and finalize details.</p>
 </div>
 )}
 </div>
 </div>
 );
};

export default Inbox;
