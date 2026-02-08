import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// No props needed now as we removed the toggle
export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setShowAuthModal(false);
            }
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowUserMenu(false);
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${scrolled
                ? 'bg-white/80 backdrop-blur-2xl border-b border-stone-200 py-3 shadow-2xl shadow-stone-900/5'
                : 'bg-transparent py-8'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-4 group">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl group-hover:rotate-12 bg-emerald-700 shadow-emerald-900/20`}>
                                <i className={`fa-solid fa-star-and-crescent text-white text-2xl`}></i>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-3xl font-serif font-bold tracking-tight transition-colors duration-700 ${scrolled ? 'text-stone-900' : 'text-white'
                                    }`}>Kloset Kifayah</span>
                                <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-colors duration-700 text-emerald-500`}>Rental Marketplace</span>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <div className={`hidden lg:flex items-center space-x-12 font-black text-[10px] uppercase tracking-[0.25em] transition-colors duration-700 ${scrolled ? 'text-stone-600' : 'text-stone-300'
                            }`}>
                            <Link to="/create-listing" className="hover:text-amber-500 transition-all flex flex-col items-center group">
                                <span>Rent Out</span>
                                <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
                            </Link>
                            <Link to="/#marketplace" className="hover:text-amber-500 transition-all flex flex-col items-center group">
                                <span>Browse</span>
                                <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
                            </Link>
                            <Link to="/profile?tab=favorites" className="hover:text-amber-500 transition-all flex flex-col items-center group">
                                <span>Favorites</span>
                                <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
                            </Link>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center space-x-2 transition-colors duration-700 ${scrolled ? 'text-stone-800' : 'text-white'
                            }`}>
                            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-stone-500/10 transition-colors group">
                                <i className="fa-solid fa-search text-base group-hover:scale-110 transition-transform"></i>
                            </button>

                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-stone-500/10 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-emerald-600 text-white`}>
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`text-xs font-medium hidden sm:block ${scrolled ? 'text-stone-600' : 'text-stone-200'}`}>
                                            {user.email?.split('@')[0]}
                                        </span>
                                        <i className={`fa-solid fa-chevron-down text-xs ${scrolled ? 'text-stone-400' : 'text-stone-300'}`}></i>
                                    </button>

                                    {/* User Dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-100 py-2 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-stone-100">
                                                <p className="font-bold text-stone-900">{user.email?.split('@')[0]}</p>
                                                <p className="text-xs text-stone-500">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 transition-colors text-stone-700"
                                            >
                                                <i className="fa-solid fa-user w-5"></i>
                                                <span className="font-medium">My Profile</span>
                                            </Link>
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 transition-colors text-stone-700"
                                            >
                                                <i className="fa-solid fa-heart w-5"></i>
                                                <span className="font-medium">Favorites</span>
                                            </Link>
                                            <Link
                                                to="/create-listing"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 transition-colors text-stone-700"
                                            >
                                                <i className="fa-solid fa-plus w-5"></i>
                                                <span className="font-medium">Create Listing</span>
                                            </Link>
                                            <div className="border-t border-stone-100 mt-2 pt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 w-full"
                                                >
                                                    <i className="fa-solid fa-sign-out w-5"></i>
                                                    <span className="font-medium">Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-stone-500/10 transition-colors group"
                                >
                                    <i className="fa-solid fa-user text-base group-hover:scale-110 transition-transform"></i>
                                </button>
                            )}

                            <Link
                                to="/profile"
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg group bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white`}
                            >
                                <i className="fa-solid fa-bag-shopping text-base group-hover:scale-110 transition-transform"></i>
                                <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-4 ring-stone-900 transition-transform group-hover:scale-110">0</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Click outside to close user menu */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                />
            )}

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <i className="fa-solid fa-times text-xl"></i>
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 block">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        placeholder="name@example.com"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 block">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70"
                                >
                                    {loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => {
                                        setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                        setError(null);
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                                >
                                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                                </button>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    </div>
                </div>
            )}
        </>
    );
}
