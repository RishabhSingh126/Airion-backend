import React from 'react';
import { useVendorPackageInquiries } from '../hooks/usePackages';
import { Package, Calendar, Phone, Mail, User } from 'lucide-react';

const PackageInquiries = () => {
    const { data: inquiries = [], isLoading } = useVendorPackageInquiries();

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="fade-in pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assigned Package Inquiries</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">Customers who inquired about a package and were assigned to you by admin.</p>
            </div>

            {inquiries.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Inquiries Yet</h3>
                    <p className="text-gray-500">You haven't been assigned any package inquiries yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(inquiries) && inquiries.map((inq: any) => (
                        <div key={inq.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">{inq.status}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{inq.package?.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">{inq.package?.description}</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                <div className="flex items-center gap-3 text-sm">
                                    <User size={16} className="text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">{inq.customerName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="text-gray-600 dark:text-slate-300">{inq.customerEmail}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone size={16} className="text-gray-400" />
                                    <span className="text-gray-600 dark:text-slate-300">{inq.customerPhone}</span>
                                </div>
                                {inq.eventDate && (
                                    <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span className="text-gray-600 dark:text-slate-300 font-medium">Event: {inq.eventDate}</span>
                                    </div>
                                )}
                            </div>
                            
                            {inq.message && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 italic">"{inq.message}"</p>
                                </div>
                            )}

                            <div className="mt-6">
                                <a 
                                    href={`tel:${inq.customerPhone}`}
                                    className="block w-full py-3 text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    Contact Customer
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PackageInquiries;
