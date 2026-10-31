import React, { useState } from 'react';
import { Map, Search, Calendar, Users, MapPin } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface FilterValues {
    locationInput: string;
    priceRange: number;
    selectedDate: string;
    selectedEventTypes: string[];
    selectedCapacity: string;
    selectedAmenities: string[];
}

interface FilterSidebarProps {
    onApply?: (filters: FilterValues) => void;
    initialFilters?: FilterValues | null;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ onApply, initialFilters }) => {
    const { showToast } = useToast();
    const [priceRange, setPriceRange] = useState(initialFilters?.priceRange || 1000000);
    const [locationInput, setLocationInput] = useState(initialFilters?.locationInput || '');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDate, setSelectedDate] = useState(initialFilters?.selectedDate || '');
    const [dateError, setDateError] = useState<string | null>(null);
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(initialFilters?.selectedEventTypes || []);
    const [selectedCapacity, setSelectedCapacity] = useState(initialFilters?.selectedCapacity || '');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters?.selectedAmenities || []);
    const [isApplying, setIsApplying] = useState(false);

    // Sync internal state when initialFilters changes (e.g. from parent clearing)
    React.useEffect(() => {
        if (initialFilters) {
            setPriceRange(initialFilters.priceRange || 1000000);
            setLocationInput(initialFilters.locationInput || '');
            setSelectedDate(initialFilters.selectedDate || '');
            setSelectedEventTypes(initialFilters.selectedEventTypes || []);
            setSelectedCapacity(initialFilters.selectedCapacity || '');
            setSelectedAmenities(initialFilters.selectedAmenities || []);
            setDateError(null);
        }
    }, [initialFilters]);

    // Major Indian cities for autocomplete
    const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune',
        'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
        'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Ranchi',
        'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi', 'Srinagar',
        'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Gwalior',
        'Jabalpur', 'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Chandigarh', 'Guntur',
        'Guwahati', 'Solapur', 'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh',
        'Tiruppur', 'Gurgaon', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Mira-Bhayandar',
        'Jalgaon', 'Gota', 'Panjim', 'Pondicherry'
    ];

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocationInput(value);
        if (value.length > 0) {
            const filtered = cities.filter(city =>
                city.toLowerCase().startsWith(value.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value) {
            setSelectedDate('');
            setDateError(null);
            return;
        }

        const selectedDateObj = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateObj < today) {
            setDateError('Please select current or future date');
            showToast('Please select current or future date', 'error');
            return;
        }
        setDateError(null);
        setSelectedDate(value);
    };

    const handleEventTypeChange = (type: string) => {
        setSelectedEventTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleAmenityChange = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const handleClearAll = () => {
        setPriceRange(1000000);
        setLocationInput('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedDate('');
        setDateError(null);
        setSelectedEventTypes([]);
        setSelectedCapacity('');
        setSelectedAmenities([]);
        onApply?.({
            locationInput: '',
            priceRange: 1000000,
            selectedDate: '',
            selectedEventTypes: [],
            selectedCapacity: '',
            selectedAmenities: [],
        });
        showToast('All filters cleared', 'success');
    };

    const handleApply = () => {
        if (dateError) {
            showToast('Please fix the errors before applying', 'error');
            return;
        }

        setIsApplying(true);
        
        // Add a small delay for visual feedback of the button click
        setTimeout(() => {
            onApply?.({
                locationInput,
                priceRange,
                selectedDate,
                selectedEventTypes,
                selectedCapacity,
                selectedAmenities,
            });
            setIsApplying(false);
            showToast('Filters applied successfully', 'success');
        }, 100);
    };

    const selectLocation = (city: string) => {
        setLocationInput(city);
        setShowSuggestions(false);
    };

    const openMap = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    window.open(
                        `https://www.google.com/maps/search/event+venues/@${latitude},${longitude},14z`,
                        '_blank'
                    );
                },
                () => {
                    // Fallback: open general event venues search in India
                    window.open(
                        'https://www.google.com/maps/search/event+venues+india/',
                        '_blank'
                    );
                }
            );
        } else {
            window.open('https://www.google.com/maps/search/event+venues+india/', '_blank');
        }
    };

    return (
        <div className="space-y-6 pb-20 relative">
            {/* Map Snippet */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl overflow-hidden relative h-32 border border-blue-100 dark:border-blue-800 cursor-pointer group shadow-sm">
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 group-hover:bg-black/20 transition-colors">
                    <button
                        onClick={openMap}
                        className="bg-white/10 hover:bg-white/30 border-2 border-white text-white px-6 py-2.5 rounded-full text-sm font-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-110 hover:brightness-150 transition-all flex items-center gap-2 backdrop-blur-md"
                    >
                        <Map size={18} className="drop-shadow-lg" />
                        View on Map
                    </button>
                </div>
                <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"
                    alt="Map"
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-opacity group-hover:opacity-70"
                />
            </div>

            {/* Location Filter */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm relative z-20">
                <h3 className="font-extrabold text-neutral-900 dark:text-white mb-3">Location</h3>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search city, region..."
                        value={locationInput}
                        onChange={handleLocationChange}
                        onFocus={() => locationInput.length > 0 && setShowSuggestions(true)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200/80 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm text-neutral-900 dark:text-white transition-all font-medium"
                    />

                    {/* Suggestions List */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {suggestions.map((city, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectLocation(city)}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-neutral-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-3"
                                >
                                    <MapPin size={14} className="opacity-40" />
                                    {city}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Date Picker */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm">
                <h3 className="font-extrabold text-neutral-900 dark:text-white mb-3">Event Date</h3>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className={`w-full pl-10 pr-4 py-3 border ${dateError ? 'border-red-500' : 'border-neutral-200/80 dark:border-slate-700'} bg-neutral-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm text-neutral-900 dark:text-white transition-all font-medium`}
                    />
                </div>
                {dateError && (
                    <p className="mt-2 text-[10px] font-black tracking-wider text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        {dateError}
                    </p>
                )}
            </div>

            {/* Event Type Filter */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm">
                <h3 className="font-extrabold text-neutral-900 dark:text-white mb-4">Event Type</h3>
                <div className="space-y-3.5">
                    {['Wedding', 'Corporate', 'Birthday', 'Private Party', 'Engagement', 'Party'].map((type, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                value={type}
                                checked={selectedEventTypes.includes(type)}
                                onChange={() => handleEventTypeChange(type)}
                                className="h-5 w-5 rounded border-neutral-300 dark:border-slate-600 text-red-500 focus:ring-red-500 transition-all dark:bg-slate-800"
                            />
                            <span className="text-neutral-600 dark:text-slate-300 text-sm group-hover:text-neutral-900 dark:group-hover:text-white transition-colors font-medium">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-neutral-900 dark:text-white">Price Range</h3>
                    <span className="text-sm font-bold text-red-500">Max ₹{priceRange.toLocaleString()}</span>
                </div>
                <div className="px-2">
                    <input
                        type="range"
                        min="5000"
                        max="1000000"
                        step="5000"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-red-500 h-2 bg-neutral-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs font-medium text-neutral-400 mt-2">
                        <span>₹5K</span>
                        <span>₹1M+</span>
                    </div>
                </div>
            </div>

            {/* Guest Capacity Filter */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm">
                <h3 className="font-extrabold text-neutral-900 dark:text-white mb-4">Guest Capacity</h3>
                <div className="space-y-3.5">
                    {[
                        { label: 'Small Intimate', range: '10 - 50 guests' },
                        { label: 'Medium Gathering', range: '50 - 200 guests' },
                        { label: 'Large Celebration', range: '200+ guests' }
                    ].map((cap, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="radio"
                                name="capacity"
                                checked={selectedCapacity === cap.label}
                                onChange={() => setSelectedCapacity(cap.label)}
                                className="h-5 w-5 border-neutral-300 dark:border-slate-600 text-red-500 focus:ring-red-500 transition-all dark:bg-slate-800"
                            />
                            <div className="flex flex-col">
                                <span className="text-neutral-900 dark:text-white text-sm font-medium">{cap.label}</span>
                                <span className="text-neutral-400 text-xs">{cap.range}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Amenities Filter */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-200/60 dark:border-slate-800 shadow-sm mb-6">
                <h3 className="font-extrabold text-neutral-900 dark:text-white mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                    {['Wifi', 'Parking', 'AC', 'Pool', 'Bar', 'Catering', 'Decor', 'Stage'].map((amenity, idx) => (
                        <label key={idx} className="cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedAmenities.includes(amenity)}
                                onChange={() => handleAmenityChange(amenity)}
                                className="hidden peer"
                            />
                            <span className="inline-block px-4 py-2 bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 text-xs font-bold rounded-full peer-checked:bg-red-500 peer-checked:text-white transition-colors border border-transparent peer-checked:border-red-500 hover:bg-neutral-200 dark:hover:bg-slate-700">
                                {amenity}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm tracking-widest rounded-2xl shadow-xl shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isApplying ? 'opacity-70 cursor-not-allowed scale-95' : ''}`}
                >
                    {isApplying ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Search size={18} />
                    )}
                    {isApplying ? 'Applying...' : 'Apply Filters'}
                </button>
                <button
                    onClick={handleClearAll}
                    className="w-full py-4 bg-transparent border-2 border-neutral-100 dark:border-slate-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white  dark: font-bold text-xs tracking-widest rounded-2xl transition-all"
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
