import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressInputProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function AddressInput({
    value,
    onChange,
    placeholder = 'Start typing your address...',
    required = false,
    className = ''
}: AddressInputProps) {
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Create a new session token
    const getSessionToken = useCallback(() => {
        if (!sessionTokenRef.current && window.google?.maps?.places) {
            sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
        return sessionTokenRef.current;
    }, []);

    // Fetch suggestions using the new AutocompleteSuggestion API
    const fetchSuggestions = useCallback(async (input: string) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (!window.google?.maps?.places?.AutocompleteSuggestion) {
            // Fallback: just use the text input without autocomplete
            return;
        }

        try {
            const request: google.maps.places.AutocompleteRequest = {
                input,
                sessionToken: getSessionToken() || undefined,
            };

            const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            setSuggestions(results || []);
            setShowSuggestions((results || []).length > 0);
        } catch (err) {
            console.error('Autocomplete error:', err);
            setSuggestions([]);
        }
    }, [getSessionToken]);

    // Handle text input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        if (!val) {
            onChange('', undefined, undefined);
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Debounce autocomplete requests
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    // Handle selecting a suggestion
    const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
        setShowSuggestions(false);
        setSuggestions([]);

        const placePrediction = suggestion.placePrediction;
        if (!placePrediction) return;

        const displayText = placePrediction.text?.toString() || '';
        setInputValue(displayText);

        try {
            // Fetch full place details for lat/lng
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['location', 'formattedAddress'] });

            const lat = place.location?.lat();
            const lng = place.location?.lng();
            const address = place.formattedAddress || displayText;

            setInputValue(address);
            onChange(address, lat, lng);
            setError(null);

            // Reset session token after a place is selected
            sessionTokenRef.current = null;
        } catch (err) {
            console.error('Place details error:', err);
            // Still use the text even if we can't get coordinates
            onChange(displayText, undefined, undefined);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsDetecting(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Reverse geocode to get address
                if (window.google?.maps) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results, status) => {
                            setIsDetecting(false);
                            if (status === 'OK' && results && results[0]) {
                                const address = results[0].formatted_address;
                                setInputValue(address);
                                onChange(address, latitude, longitude);
                            } else {
                                onChange('', latitude, longitude);
                                setError('Could not determine address. Please type it manually.');
                            }
                        }
                    );
                } else {
                    setIsDetecting(false);
                    onChange('', latitude, longitude);
                }
            },
            (err) => {
                setIsDetecting(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setError('Location access denied. Please type your address.');
                } else {
                    setError('Could not detect location. Please type your address.');
                }
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    placeholder={placeholder}
                    required={required}
                    onChange={handleInputChange}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full bg-white border border-hairline px-4 py-3 pr-10 text-sm focus:outline-none focus:border-rose transition-colors"
                />

                <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-rose transition-colors p-1"
                    title="Detect my location"
                >
                    {isDetecting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <MapPin size={16} />
                    )}
                </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-hairline mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => {
                        const text = suggestion.placePrediction?.text?.toString() || '';
                        return (
                            <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="px-4 py-3 text-sm hover:bg-beige cursor-pointer border-b border-hairline last:border-b-0 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-espresso/30 flex-shrink-0" />
                                    <span>{text}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-1 text-[10px] text-rose font-medium">{error}</p>
            )}
        </div>
    );
}
