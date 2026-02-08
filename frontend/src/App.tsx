import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserProvider, useUser } from './context/UserContext';
import type { User } from './types';

// Pages
import Home from './pages-new/Home';
import Login from './pages-new/Login';
import Browse from './pages-new/Browse';
import ListingDetail from './pages-new/ListingDetail';
import Profile from './pages-new/Profile';
import PostListing from './pages-new/PostListing';
import Messages from './pages-new/Messages';

// Components
import Header from './components-new/Header';
import MobileNav from './components-new/MobileNav';
import SparkleCursor from './components-new/SparkleCursor';

function AppContent() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { addFavorite, removeFavorite, isFavorite } = useUser();

    // Auth state listener
    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Fetch full profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setCurrentUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            ...profile
                        });
                    } else {
                        // Profile not created yet — use basic info from session
                        setCurrentUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name,
                            username: session.user.user_metadata?.username,
                        });
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // Timeout fallback: if init hangs for 10s, stop loading anyway
        const timeout = setTimeout(() => setIsLoading(false), 10000);
        init().then(() => clearTimeout(timeout));

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setCurrentUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            ...profile
                        });
                    } else {
                        // Profile not found yet (may still be creating) — set basic user info
                        setCurrentUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name,
                            username: session.user.user_metadata?.username,
                        });
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error('Auth state change error:', err);
                // Still set basic user info if we have a session
                if (session?.user) {
                    setCurrentUser({
                        id: session.user.id,
                        email: session.user.email || '',
                    });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = () => {
        navigate('/browse');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        navigate('/');
    };

    const handleNavigate = (page: string) => {
        switch (page) {
            case 'home': navigate('/'); break;
            case 'browse': navigate('/browse'); break;
            case 'post': navigate('/post'); break;
            case 'messages': navigate('/messages'); break;
            case 'me': navigate('/profile'); break;
            case 'login': navigate('/login'); break;
            default: navigate('/browse');
        }
    };

    const handleToggleSave = async (listingId: string) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (isFavorite(listingId)) {
            await removeFavorite(listingId);
        } else {
            await addFavorite(listingId);
        }
    };

    const handleViewListing = (id: string) => {
        navigate(`/listing/${id}`);
    };

    const handleListingCreated = (listingId: string) => {
        navigate(`/listing/${listingId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-beige">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] uppercase tracking-widest text-espresso/40">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-beige">
            <SparkleCursor />

            <Routes>
                {/* Routes without header */}
                <Route
                    path="/"
                    element={<Home onBrowse={() => navigate('/browse')} onAuth={() => navigate('/login')} />}
                />
                <Route
                    path="/login"
                    element={<Login onLogin={handleLogin} onBack={() => navigate('/')} />}
                />

                {/* Routes with header */}
                <Route
                    path="/browse"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <Browse
                                currentUser={currentUser}
                                onViewListing={handleViewListing}
                                onToggleSave={handleToggleSave}
                            />
                        </WithShell>
                    }
                />
                <Route
                    path="/listing/:id"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <ListingDetailWrapper
                                currentUser={currentUser}
                                onToggleSave={handleToggleSave}
                                onViewProfile={(username) => navigate(`/profile/${username}`)}
                                onMessage={() => navigate('/messages')}
                            />
                        </WithShell>
                    }
                />
                <Route
                    path="/post"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <PostListing
                                onSubmit={handleListingCreated}
                                currentUserId={currentUser?.id || null}
                                currentUserLocation={currentUser?.location}
                            />
                        </WithShell>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <ProfileWrapper currentUser={currentUser} isMe={true} onViewListing={handleViewListing} />
                        </WithShell>
                    }
                />
                <Route
                    path="/profile/:username"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <ProfileWrapper currentUser={currentUser} isMe={false} onViewListing={handleViewListing} />
                        </WithShell>
                    }
                />
                <Route
                    path="/messages"
                    element={
                        <WithShell currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout}>
                            <MessagesWrapper currentUser={currentUser} />
                        </WithShell>
                    }
                />
            </Routes>
        </div>
    );
}

// Shell wrapper for pages with header and mobile nav
function WithShell({
    children,
    currentUser,
    onNavigate,
    onLogout
}: {
    children: React.ReactNode;
    currentUser: User | null;
    onNavigate: (page: string) => void;
    onLogout: () => void;
}) {
    return (
        <>
            <Header currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />
            <main className="flex-grow flex flex-col w-full pb-24 lg:pb-0 pt-20">
                {children}
            </main>
            <MobileNav activePage="browse" onNavigate={onNavigate} currentUser={currentUser} />
        </>
    );
}

// Listing Detail Wrapper to fetch listing data
function ListingDetailWrapper({
    currentUser,
    onToggleSave,
    onViewProfile,
    onMessage
}: {
    currentUser: User | null;
    onToggleSave: (id: string) => void;
    onViewProfile: (username: string) => void;
    onMessage: () => void;
}) {
    const [listing, setListing] = useState<any>(null);
    const [seller, setSeller] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isFavorite } = useUser();

    // Get listing ID from URL
    const listingId = window.location.pathname.split('/').pop();

    useEffect(() => {
        const fetchListing = async () => {
            if (!listingId) return;

            const { data: listingData } = await supabase
                .from('listings')
                .select(`*, listing_images (*)`)
                .eq('id', listingId)
                .single();

            if (listingData) {
                setListing(listingData);

                // Fetch seller
                const { data: sellerData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', listingData.owner_id)
                    .single();

                if (sellerData) {
                    setSeller(sellerData as User);
                }
            }
            setIsLoading(false);
        };

        fetchListing();
    }, [listingId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-espresso/40">Listing not found</p>
            </div>
        );
    }

    return (
        <ListingDetail
            listing={listing}
            seller={seller || undefined}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
            onToggleSave={onToggleSave}
            isSaved={isFavorite(listing.id)}
            isOwnListing={currentUser?.id === listing.owner_id}
        />
    );
}

// Profile Wrapper
function ProfileWrapper({
    currentUser,
    isMe,
    onViewListing
}: {
    currentUser: User | null;
    isMe: boolean;
    onViewListing: (id: string) => void;
}) {
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userListings, setUserListings] = useState<any[]>([]);
    const [savedListings, setSavedListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { favorites } = useUser();

    useEffect(() => {
        const fetchProfile = async () => {
            if (isMe && currentUser) {
                setProfileUser(currentUser);

                // Fetch user's listings
                const { data: listings } = await supabase
                    .from('listings')
                    .select(`*, listing_images (*)`)
                    .eq('owner_id', currentUser.id);

                setUserListings(listings || []);

                // Fetch saved listings
                if (favorites.length > 0) {
                    const { data: saved } = await supabase
                        .from('listings')
                        .select(`*, listing_images (*)`)
                        .in('id', favorites);

                    setSavedListings(saved || []);
                }
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [isMe, currentUser, favorites]);

    if (isLoading || !profileUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Profile
            user={profileUser}
            isMe={isMe}
            listings={userListings}
            savedListings={savedListings}
            onViewListing={onViewListing}
            onFollow={() => { }}
            isFollowing={false}
        />
    );
}

// Messages Wrapper
function MessagesWrapper({ currentUser }: { currentUser: User | null }) {
    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-espresso/40">Please log in to view messages</p>
            </div>
        );
    }

    return <Messages currentUser={currentUser} listings={[]} users={[]} />;
}

// Main App with providers
export default function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <AppContent />
            </UserProvider>
        </BrowserRouter>
    );
}
