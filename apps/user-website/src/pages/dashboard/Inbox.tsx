import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessages } from '../../lib/api';
import { initiateSocketConnection, getSocket } from '@shared/auth/socket';
import { useAuth } from '@shared/auth/AuthContext';
import { Send, Search, CheckCheck, Paperclip, Mail, ArrowLeft, MoreVertical, Phone, Image as ImageIcon } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Inbox: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [selectedThreadId, setSelectedThreadId] = useState<string>('');
    const [messageText, setMessageText] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);

    // Fetch Conversations
    const { data: conversations = [], isLoading: loadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
        retry: false,
    });

    // Fetch Messages for selected thread
    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', selectedThreadId],
        queryFn: () => fetchMessages(selectedThreadId),
        enabled: !!selectedThreadId,
        retry: false,
    });

    // Handle vendorId from URL
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const vendorIdParam = queryParams.get('vendorId');
        if (vendorIdParam) {
            // Find if there's an existing conversation with this vendor
            const existingConvo = conversations.find((c: any) => c.participantIds?.includes(vendorIdParam));
            if (existingConvo) {
                setSelectedThreadId(existingConvo.id);
                setShowMobileChat(true);
            } else {
                // If not, hit API to start conversation
                import('../../lib/api').then(({ startConversation }) => {
                    startConversation(vendorIdParam).then((res: any) => {
                        setSelectedThreadId(res.id);
                        setShowMobileChat(true);
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    }).catch(err => {
                        console.error('Failed to start conversation:', err);
                    });
                });
            }
        }
    }, [location.search, conversations]);



    // Socket Setup
    useEffect(() => {
        if (!user?.id) return;
        const socket = initiateSocketConnection(user.id);

        // Join selected room
        if (selectedThreadId) {
            socket.emit('joinRoom', selectedThreadId);
        }

        socket.on('receiveMessage', (message: any) => {
            if (message.conversationId === selectedThreadId) {
                queryClient.setQueryData(['messages', selectedThreadId], (old: any) => [...(old || []), message]);
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        socket.on('userTyping', (data: { userId: string; userName: string }) => {
            if (data.userId !== user?.id) {
                setTypingUser(data.userName);
            }
        });

        socket.on('userStoppedTyping', (data: { userId: string }) => {
            if (data.userId !== user?.id) {
                setTypingUser(null);
            }
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('userTyping');
            socket.off('userStoppedTyping');
        };
    }, [user?.id, selectedThreadId, queryClient]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedThreadId) return;

        const socket = getSocket();
        if (socket) {
            socket.emit('sendMessage', {
                conversationId: selectedThreadId,
                senderId: user?.id,
                body: messageText,
            });
            socket.emit('stopTyping', { conversationId: selectedThreadId, userId: user?.id });
            setMessageText('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessageText(value);

        if (selectedThreadId && user?.id) {
            const socket = getSocket();
            if (socket) {
                socket.emit('typing', { conversationId: selectedThreadId, userId: user.id, userName: user.name });

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('stopTyping', { conversationId: selectedThreadId, userId: user.id });
                }, 3000);
            }
        }
    };

    const handleBackToList = () => {
        setShowMobileChat(false);
    };

    const selectThread = (id: string) => {
        setSelectedThreadId(id);
        setShowMobileChat(true);
    };

    const filteredConversations = (conversations || []).filter((chat: any) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return chat.title?.toLowerCase().includes(query) || chat.lastMessage?.toLowerCase().includes(query);
    });

    const selectedChat = conversations.find((c: any) => c.id === selectedThreadId);

    if (loadingConversations) {
        return (
            <div className="h-[calc(100vh-180px)] flex gap-6 p-4">
                <Skeleton className="w-80 rounded-2xl" />
                <Skeleton className="flex-1 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-180px)] flex bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-neutral-200/60 dark:border-slate-800 overflow-hidden relative">
            {/* Thread List */}
            <div className={`
                w-full md:w-96 border-r border-neutral-100 dark:border-slate-800 flex flex-col absolute md:relative inset-0 z-10 bg-white dark:bg-slate-900 transition-transform duration-500
                ${showMobileChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
            `}>
                <div className="p-6 border-b border-neutral-50 dark:border-slate-800">
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tighter">Inbox Chat</h2>
                    <div className="flex items-center gap-3 bg-neutral-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-neutral-200/30">
                        <Search size={18} className="text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Filter conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((chat: any) => (
                        <div
                            key={chat.id}
                            onClick={() => selectThread(chat.id)}
                            className={`p-6 flex gap-4 border-b border-neutral-50 dark:border-slate-800/40 cursor-pointer transition-all hover:bg-neutral-50 dark:hover:bg-slate-800/40 relative
                                ${selectedThreadId === chat.id ? 'bg-red-50/50 dark:bg-red-500/5' : ''}
                            `}
                        >
                            {selectedThreadId === chat.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-md" />
                            )}
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-500/20 shrink-0 uppercase">
                                {chat.participantIds.length > 1 ? 'V' : 'M'}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-base font-bold text-neutral-900 dark:text-white truncate">Vendor Partner</h4>
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <p className="text-sm truncate text-neutral-500 font-medium">
                                    {chat.lastMessage || 'Open communication channel...'}
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-neutral-400 p-8 text-center">
                            <Mail size={40} className="mb-3 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No conversations yet</p>
                            <p className="text-xs text-neutral-400 mt-1">Contact a vendor from their profile to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className={`
                flex-1 flex flex-col absolute md:relative inset-0 z-20 bg-white dark:bg-slate-900 transition-transform duration-500
                ${showMobileChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}>
                {selectedThreadId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-neutral-50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBackToList}
                                    className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center font-black text-red-600 dark:text-red-500 shadow-sm border border-red-200 dark:border-red-500/20">
                                    V
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">Vendor Partner</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Syncing</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 text-neutral-400 hover:text-red-500 transition-colors"><Phone size={20} /></button>
                                <button className="p-3 text-neutral-400 hover:text-red-500 transition-colors"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30 dark:bg-slate-950/20">
                            {loadingMessages ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-1/2 rounded-2xl" />
                                    <Skeleton className="h-12 w-1/3 ml-auto rounded-2xl" />
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {messages.map((m: any) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] md:max-w-md px-5 py-3 rounded-[1.5rem] text-sm shadow-sm relative
                                                ${m.senderId === user?.id
                                                    ? 'bg-red-500 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-slate-800 text-neutral-800 dark:text-slate-200 border border-neutral-100 dark:border-slate-700 rounded-bl-none'
                                                }
                                            `}>
                                                <p className="font-medium leading-relaxed">{m.body}</p>
                                                <div className={`flex items-center gap-1 text-[9px] mt-2 font-bold uppercase tracking-widest ${m.senderId === user?.id ? 'text-red-100 justify-end' : 'text-neutral-400'}`}>
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {m.senderId === user?.id && <CheckCheck size={12} className="text-red-100" />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {typingUser && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-none text-[10px] font-black text-red-500 animate-pulse flex items-center gap-2 border border-red-100 dark:border-red-500/10">
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                    <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                    <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                                Node: {typingUser} is typing...
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-slate-800 p-2 rounded-[1.5rem] border border-neutral-200/50 dark:border-slate-700/50 focus-within:ring-4 focus-within:ring-red-500/5 focus-within:border-red-500/20 transition-all">
                                <label className="cursor-pointer p-3 text-neutral-400 hover:text-red-500 transition-colors rounded-xl shrink-0">
                                    <ImageIcon size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={() => toast.success('Image sharing capability ready')} />
                                </label>
                                <button type="button" className="p-3 text-neutral-400 hover:text-red-500 transition-colors rounded-xl shrink-0">
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Execute message transmission..."
                                    value={messageText}
                                    onChange={handleInputChange}
                                    className="flex-1 bg-transparent border-none outline-none py-2 text-sm font-bold text-neutral-800 dark:text-white"
                                />
                                <button type="submit" disabled={!messageText.trim()} className="p-3.5 bg-red-500 text-white rounded-xl  active:scale-95 shadow-lg shadow-red-500/30 transition-all disabled:opacity-30 disabled: shrink-0">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-10 bg-neutral-50/30 dark:bg-slate-950/20">
                        <div className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-slate-700 mb-8 transform hover:scale-110 transition-transform duration-1000">
                            <Send size={48} className="text-red-500" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter mb-2">Ready to Connect?</h3>
                        <p className="text-sm opacity-40">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
