import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { MOCK_LISTINGS } from '../data/mockData';
import type { Listing } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type TabType = 'favorites' | 'listings' | 'purchases' | 'rentals';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabType) || 'favorites';
    const { favorites, myListings, purchases, rentals } = useUser();

    const setActiveTab = (tab: TabType) => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Get favorite listings from mock data
    const favoriteListings = MOCK_LISTINGS.filter(l => favorites.includes(l.id));

    const tabs = [
        { id: 'favorites' as TabType, label: 'Favorites', count: favoriteListings.length, icon: 'fa-heart' },
        { id: 'listings' as TabType, label: 'My Listings', count: myListings.length, icon: 'fa-tag' },
        { id: 'purchases' as TabType, label: 'Purchases', count: purchases.length, icon: 'fa-shopping-bag' },
        { id: 'rentals' as TabType, label: 'Rentals', count: rentals.length, icon: 'fa-calendar' },
    ];

    const getActiveListings = (): Listing[] => {
        switch (activeTab) {
            case 'favorites': return favoriteListings;
            case 'listings': return myListings;
            case 'purchases': return purchases;
            case 'rentals': return rentals;
            default: return [];
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-user text-4xl text-stone-400"></i>
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">Sign In Required</h1>
                    <p className="text-stone-500 mb-8">Please sign in to view your profile, favorites, and listings.</p>
                    <Link
                        to="/"
                        className="inline-block bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all"
                    >
                        Go to Home & Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-stone-400 hover:text-white transition-colors font-medium mb-8"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back to Marketplace</span>
                    </Link>

                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-4xl font-bold shadow-xl">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold mb-2">{user.email?.split('@')[0]}</h1>
                            <p className="text-stone-400">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-stone-200 bg-white sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto py-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-amber-700 text-white shadow-lg'
                                    : 'text-stone-500 hover:bg-stone-100'
                                    }`}
                            >
                                <i className={`fa-solid ${tab.icon}`}></i>
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-stone-100'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Create Listing CTA */}
                {activeTab === 'listings' && (
                    <Link
                        to="/create-listing"
                        className="block mb-10 bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 text-white hover:from-amber-700 hover:to-amber-800 transition-all shadow-xl group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">List a New Item</h3>
                                <p className="text-amber-100">Sell or rent out your fashion pieces</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-plus text-2xl"></i>
                            </div>
                        </div>
                    </Link>
                )}

                {getActiveListings().length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
                            <i className={`fa-solid ${tabs.find(t => t.id === activeTab)?.icon} text-4xl text-stone-300`}></i>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4">
                            No {activeTab === 'favorites' ? 'Favorites' : activeTab === 'listings' ? 'Listings' : activeTab === 'purchases' ? 'Purchases' : 'Rentals'} Yet
                        </h3>
                        <p className="text-stone-500 mb-8 max-w-md mx-auto">
                            {activeTab === 'favorites' && "Browse the marketplace and heart items you love to save them here."}
                            {activeTab === 'listings' && "Start selling or renting your fashion pieces to the community."}
                            {activeTab === 'purchases' && "Items you buy will appear here."}
                            {activeTab === 'rentals' && "Items you rent will appear here."}
                        </p>
                        <Link
                            to={activeTab === 'listings' ? '/create-listing' : '/'}
                            className="inline-block bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all"
                        >
                            {activeTab === 'listings' ? 'Create Listing' : 'Browse Marketplace'}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {getActiveListings().map(listing => (
                            <Link
                                key={listing.id}
                                to={`/listing/${listing.id}`}
                                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img
                                        src={listing.listing_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800'}
                                        alt={listing.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-6">
                                    <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">{listing.brand || listing.category}</p>
                                    <h4 className="font-serif font-bold text-lg text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">{listing.title}</h4>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg font-bold text-amber-700">${listing.price_per_day}/day</span>
                                        {listing.sell_price && (
                                            <span className="text-sm text-stone-400">Buy: ${listing.sell_price}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
