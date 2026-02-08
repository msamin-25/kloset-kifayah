import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MOCK_LISTINGS } from '../data/mockData';
import { getListing } from '../lib/api';
import { useUser } from '../context/UserContext';
import type { Listing } from '../types';

export default function ListingDetail() {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showRentForm, setShowRentForm] = useState(false);
    const [showBuyForm, setShowBuyForm] = useState(false);
    const [rentalDays, setRentalDays] = useState(1);

    const { isFavorite, addFavorite, removeFavorite } = useUser();
    const favorited = id ? isFavorite(id) : false;

    const handleFavoriteClick = () => {
        if (!id) return;
        if (favorited) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    };

    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true);
            try {
                if (id) {
                    const data = await getListing(id);
                    setListing(data);
                }
            } catch (error) {
                // Fallback to mock data
                const mockListing = MOCK_LISTINGS.find(l => l.id === id);
                setListing(mockListing || null);
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">Listing Not Found</h1>
                <Link to="/" className="text-amber-700 hover:underline font-medium">
                    ← Back to Home
                </Link>
            </div>
        );
    }

    const images = listing.listing_images?.length > 0
        ? listing.listing_images
        : [{ id: '1', listing_id: listing.id, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800', display_order: 0 }];

    const rentalTotal = listing.price_per_day * rentalDays;
    const depositAmount = listing.deposit_amount || 0;

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Back Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-stone-600 hover:text-amber-700 transition-colors font-medium"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back to Marketplace</span>
                    </Link>
                    <button
                        onClick={handleFavoriteClick}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${favorited
                                ? 'bg-rose-500 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-500'
                            }`}
                    >
                        <i className={`${favorited ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                        <span className="font-bold text-sm">{favorited ? 'Saved' : 'Save'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* Image Gallery */}
                        <div className="space-y-6">
                            {/* Main Image */}
                            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-stone-100 relative">
                                <img
                                    src={images[selectedImage]?.image_url}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                                {listing.is_modest && (
                                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-xl flex items-center space-x-2 border border-stone-100">
                                        <i className="fa-solid fa-star-and-crescent text-amber-600 text-[10px]"></i>
                                        <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest">Modest</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                                <div className="flex space-x-4 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-amber-600 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="lg:py-8">
                            {/* Brand & Category */}
                            <div className="flex items-center space-x-3 mb-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-700">
                                    {listing.brand || listing.category}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                                <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                                    {listing.condition.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-5xl font-serif font-bold text-stone-900 leading-tight mb-6">
                                {listing.title}
                            </h1>

                            {/* Description */}
                            <p className="text-lg text-stone-500 leading-relaxed mb-10">
                                {listing.description || 'A beautiful piece for your collection. This item has been carefully curated for our marketplace.'}
                            </p>

                            {/* Pricing Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                {/* Rent Card */}
                                <div className={`rounded-3xl p-8 border transition-all cursor-pointer ${showRentForm
                                        ? 'bg-amber-700 text-white border-amber-700 shadow-xl'
                                        : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 hover:shadow-lg'
                                    }`}
                                    onClick={() => { setShowRentForm(true); setShowBuyForm(false); }}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${showRentForm ? 'text-amber-200' : 'text-amber-700'}`}>Rent For</span>
                                    <div className="flex items-baseline space-x-1 mb-2">
                                        <span className={`text-lg font-black ${showRentForm ? 'text-amber-300' : 'text-amber-600'}`}>$</span>
                                        <span className={`text-5xl font-black tracking-tighter ${showRentForm ? 'text-white' : 'text-amber-700'}`}>{listing.price_per_day}</span>
                                        <span className={`text-sm font-bold ${showRentForm ? 'text-amber-200' : 'text-amber-600'}`}>/day</span>
                                    </div>
                                    <p className={`text-sm ${showRentForm ? 'text-amber-100' : 'text-amber-700/70'}`}>
                                        Min {listing.min_rental_days} day{listing.min_rental_days > 1 ? 's' : ''} •
                                        Max {listing.max_rental_days} days
                                    </p>
                                </div>

                                {/* Buy Card */}
                                {listing.sell_price && (
                                    <div className={`rounded-3xl p-8 border transition-all cursor-pointer ${showBuyForm
                                            ? 'bg-stone-900 text-white border-stone-900 shadow-xl'
                                            : 'bg-gradient-to-br from-stone-50 to-stone-100/50 border-stone-200/50 hover:shadow-lg'
                                        }`}
                                        onClick={() => { setShowBuyForm(true); setShowRentForm(false); }}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${showBuyForm ? 'text-stone-400' : 'text-stone-500'}`}>Buy Pre-loved</span>
                                        <div className="flex items-baseline space-x-1 mb-2">
                                            <span className={`text-lg font-black ${showBuyForm ? 'text-stone-400' : 'text-stone-400'}`}>$</span>
                                            <span className={`text-5xl font-black tracking-tighter ${showBuyForm ? 'text-white' : 'text-stone-900'}`}>{listing.sell_price}</span>
                                        </div>
                                        <p className={`text-sm ${showBuyForm ? 'text-stone-400' : 'text-stone-500'}`}>
                                            Own this piece forever
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Rent Form */}
                            {showRentForm && (
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-100 mb-10 animate-in slide-in-from-bottom duration-300">
                                    <h3 className="text-lg font-bold text-stone-900 mb-6">Complete Your Rental</h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-stone-700 mb-3">Rental Duration</label>
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => setRentalDays(Math.max(listing.min_rental_days, rentalDays - 1))}
                                                    className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                                                >
                                                    <i className="fa-solid fa-minus"></i>
                                                </button>
                                                <div className="text-center">
                                                    <span className="text-4xl font-black text-stone-900">{rentalDays}</span>
                                                    <span className="text-stone-500 ml-2">day{rentalDays > 1 ? 's' : ''}</span>
                                                </div>
                                                <button
                                                    onClick={() => setRentalDays(Math.min(listing.max_rental_days, rentalDays + 1))}
                                                    className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                                                >
                                                    <i className="fa-solid fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-stone-100 pt-6 space-y-3">
                                            <div className="flex justify-between text-stone-600">
                                                <span>${listing.price_per_day} × {rentalDays} days</span>
                                                <span className="font-bold">${rentalTotal}</span>
                                            </div>
                                            {depositAmount > 0 && (
                                                <div className="flex justify-between text-stone-600">
                                                    <span>Security Deposit (refundable)</span>
                                                    <span className="font-bold">${depositAmount}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-lg font-bold text-stone-900 pt-3 border-t border-stone-100">
                                                <span>Total</span>
                                                <span className="text-amber-700">${rentalTotal + depositAmount}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => alert(`Rental request submitted!\n\n${rentalDays} days @ $${listing.price_per_day}/day = $${rentalTotal}\nDeposit: $${depositAmount}\nTotal: $${rentalTotal + depositAmount}`)}
                                            className="w-full bg-amber-700 hover:bg-amber-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg"
                                        >
                                            Request Rental
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Buy Form */}
                            {showBuyForm && listing.sell_price && (
                                <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-100 mb-10 animate-in slide-in-from-bottom duration-300">
                                    <h3 className="text-lg font-bold text-stone-900 mb-6">Complete Your Purchase</h3>

                                    <div className="space-y-6">
                                        <div className="bg-stone-50 rounded-2xl p-6">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={images[0]?.image_url}
                                                    alt={listing.title}
                                                    className="w-20 h-20 rounded-xl object-cover"
                                                />
                                                <div>
                                                    <h4 className="font-bold text-stone-900">{listing.title}</h4>
                                                    <p className="text-sm text-stone-500">{listing.brand || listing.category}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-stone-100 pt-6 space-y-3">
                                            <div className="flex justify-between text-stone-600">
                                                <span>Item Price</span>
                                                <span className="font-bold">${listing.sell_price}</span>
                                            </div>
                                            <div className="flex justify-between text-stone-600">
                                                <span>Platform Fee (5%)</span>
                                                <span className="font-bold">${(Number(listing.sell_price) * 0.05).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold text-stone-900 pt-3 border-t border-stone-100">
                                                <span>Total</span>
                                                <span>${(Number(listing.sell_price) * 1.05).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => alert(`Purchase confirmed!\n\nItem: ${listing.title}\nTotal: $${(Number(listing.sell_price) * 1.05).toFixed(2)}`)}
                                            className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg"
                                        >
                                            Complete Purchase
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="border-t border-stone-100 pt-10 space-y-8">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Item Details</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {listing.size && (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Size</span>
                                            <span className="text-lg font-semibold text-stone-900">{listing.size}</span>
                                        </div>
                                    )}
                                    {listing.color && (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Color</span>
                                            <span className="text-lg font-semibold text-stone-900">{listing.color}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Category</span>
                                        <span className="text-lg font-semibold text-stone-900 capitalize">{listing.category}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Location</span>
                                        <span className="text-lg font-semibold text-stone-900">{listing.location}</span>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-3">
                                    {listing.is_cleaned && (
                                        <span className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                                            <i className="fa-solid fa-check"></i>
                                            <span>Professionally Cleaned</span>
                                        </span>
                                    )}
                                    {listing.is_smoke_free && (
                                        <span className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                            <i className="fa-solid fa-ban-smoking"></i>
                                            <span>Smoke Free</span>
                                        </span>
                                    )}
                                    {listing.is_pet_free && (
                                        <span className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                                            <i className="fa-solid fa-paw"></i>
                                            <span>Pet Free</span>
                                        </span>
                                    )}
                                    {listing.women_only_pickup && (
                                        <span className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-xs font-bold">
                                            <i className="fa-solid fa-venus"></i>
                                            <span>Women-Only Pickup</span>
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                {listing.tags && listing.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {listing.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
