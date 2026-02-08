import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { Listing } from '../types';
import { MOCK_LISTINGS } from '../data/mockData';
import { supabase, supabaseRestSelect, supabaseRestInsert, supabaseRestDelete } from '../lib/supabase';

interface UserContextType {
    favorites: string[];
    addFavorite: (listingId: string) => Promise<void>;
    removeFavorite: (listingId: string) => Promise<void>;
    isFavorite: (listingId: string) => boolean;
    myListings: Listing[];
    purchases: Listing[];
    rentals: Listing[];
    loadingFavorites: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true);

    // Mock data for demo - in production this would come from backend
    const [myListings] = useState<Listing[]>(() => {
        return MOCK_LISTINGS.slice(0, 2);
    });

    const [purchases] = useState<Listing[]>(() => {
        return MOCK_LISTINGS.slice(5, 6);
    });

    const [rentals] = useState<Listing[]>(() => {
        return MOCK_LISTINGS.slice(3, 4);
    });

    // Initialize user and fetch favorites
    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Fetch from Supabase (direct REST to avoid AbortError)
                    const { data } = await supabaseRestSelect('favorites', {
                        select: 'listing_id',
                        filters: { user_id: `eq.${session.user.id}` },
                    });

                    if (data) {
                        setFavorites(data.map((f: any) => f.listing_id));
                    }
                } else {
                    // Fallback to localStorage for guests
                    const saved = localStorage.getItem('ibtikar_favorites');
                    if (saved) setFavorites(JSON.parse(saved));
                }
            } catch (err) {
                console.error('UserContext init error:', err);
            } finally {
                setLoadingFavorites(false);
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const { data } = await supabaseRestSelect('favorites', {
                        select: 'listing_id',
                        filters: { user_id: `eq.${session.user.id}` },
                    });
                    if (data) setFavorites(data.map((f: any) => f.listing_id));
                } else {
                    setFavorites([]);
                }
            } catch (err) {
                console.error('UserContext auth state change error:', err);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync to localStorage for guests
    useEffect(() => {
        if (!user) {
            localStorage.setItem('ibtikar_favorites', JSON.stringify(favorites));
        }
    }, [favorites, user]);

    const addFavorite = async (listingId: string) => {
        // Optimistic update
        setFavorites(prev => [...prev, listingId]);

        if (user) {
            await supabaseRestInsert('favorites', {
                user_id: user.id,
                listing_id: listingId
            });
        }
    };

    const removeFavorite = async (listingId: string) => {
        // Optimistic update
        setFavorites(prev => prev.filter(id => id !== listingId));

        if (user) {
            // Use direct REST delete to avoid AbortError
            await supabaseRestDelete('favorites', {
                user_id: `eq.${user.id}`,
                listing_id: `eq.${listingId}`,
            }).catch(() => { /* ignore delete errors */ });
        }
    };

    const isFavorite = (listingId: string) => favorites.includes(listingId);

    return (
        <UserContext.Provider value={{
            favorites,
            addFavorite,
            removeFavorite,
            isFavorite,
            myListings,
            purchases,
            rentals,
            loadingFavorites
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
