import React from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { MapPin, Navigation } from 'lucide-react';
import type { Event } from '../types';

// Coordinates for major locations
const LOCATION_COORDINATES: Record<string, [number, number]> = {
    'Mumbai': [19.0760, 72.8777],
    'Bangalore': [12.9716, 77.5946],
    'Jaipur': [26.9124, 75.7873],
    'Rajasthan': [26.9124, 75.7873],
    'South Delhi': [28.5244, 77.2323],
    'Delhi': [28.6139, 77.2090],
    'Goa': [15.2993, 74.1240],
    'Pune': [18.5204, 73.8567],
    'Gurgaon': [28.4595, 77.0266],
    'Hyderabad': [17.3850, 78.4867],
    'Kolkata': [22.5726, 88.3639],
    'Chennai': [13.0827, 80.2707],
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // Center of India

interface MapViewProps {
    vendors: Event[];
}

const MapView: React.FC<MapViewProps> = ({ vendors }) => {
    const center = vendors.length > 0 && vendors[0].location
        ? (LOCATION_COORDINATES[vendors[0].location] || DEFAULT_CENTER)
        : DEFAULT_CENTER;

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-airbnb relative">
            <Map 
                height={undefined} 
                defaultCenter={center} 
                defaultZoom={5}
                boxClassname="pigeon-filters"
            >
                {vendors.map((vendor, idx) => {
                    const coords = LOCATION_COORDINATES[vendor.location] || [
                        DEFAULT_CENTER[0] + (Math.random() - 0.5) * 5,
                        DEFAULT_CENTER[1] + (Math.random() - 0.5) * 5
                    ];

                    return (
                        <Overlay key={vendor.id} anchor={coords} offset={[60, 20]}>
                            <div className="group relative">
                                <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-xl border border-neutral-200 dark:border-slate-700 cursor-pointer transform transition-all duration-300 hover:scale-110 hover:z-50 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-xs font-black text-neutral-900 dark:text-white whitespace-nowrap">
                                        {vendor.price.split(' ')[1] || vendor.price}
                                    </span>
                                </div>
                                
                                {/* Info Card on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-neutral-100 dark:border-slate-800">
                                        <img src={vendor.image} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{vendor.title}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-neutral-500">{vendor.location}</span>
                                            <span className="text-[10px] font-black text-red-500">★ {vendor.rating}</span>
                                        </div>
                                    </div>
                                    <div className="w-3 h-3 bg-white dark:bg-slate-900 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-neutral-100 dark:border-slate-800"></div>
                                </div>
                            </div>
                        </Overlay>
                    );
                })}
            </Map>

            {/* Float Floating Info */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <Navigation size={16} fill="white" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Live Map Active</p>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">{vendors.length} Vendors Found</p>
                </div>
            </div>
        </div>
    );
};

export default MapView;
