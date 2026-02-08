import { useState, useEffect, useRef } from 'react';
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
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!inputRef.current) return;

        const initAutocomplete = () => {
            if (!window.google?.maps?.places) return;

            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current!, {
                types: ['address'],
                fields: ['formatted_address', 'geometry'],
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.formatted_address || '';
                    onChange(address, lat, lng);
                    setError(null);
                }
            });
        };

        // Google Maps API might still be loading
        if (window.google?.maps?.places) {
            initAutocomplete();
        } else {
            const interval = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(interval);
                    initAutocomplete();
                }
            }, 200);
            return () => clearInterval(interval);
        }
    }, [onChange]);

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
                                onChange(address, latitude, longitude);
                                if (inputRef.current) {
                                    inputRef.current.value = address;
                                }
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
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={value}
                    placeholder={placeholder}
                    required={required}
                    onChange={(e) => {
                        // If user clears the input, reset
                        if (!e.target.value) {
                            onChange('', undefined, undefined);
                        }
                    }}
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

            {/* Error message */}
            {error && (
                <p className="mt-1 text-[10px] text-rose font-medium">{error}</p>
            )}
        </div>
    );
}
