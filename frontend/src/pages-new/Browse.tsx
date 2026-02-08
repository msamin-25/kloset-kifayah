import { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, Grid, LayoutList, Search, X, MapPin } from 'lucide-react';
import { supabaseRestSelect } from '../lib/supabase';
import { calculateDistance, formatDistance } from '../lib/distance';
import type { Listing, User, Category, ListingMode } from '../types';
import ListingCard from '../components-new/ListingCard';

interface BrowseProps {
  currentUser: User | null;
  onViewListing: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export default function Browse({ currentUser, onViewListing, onToggleSave }: BrowseProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [savedListings, setSavedListings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<ListingMode | 'all'>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch listings from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch listings with images (direct REST to avoid AbortError)
      const { data: listingsData, error: listingsError } = await supabaseRestSelect('listings', {
        select: '*, listing_images(*)',
        filters: { status: 'eq.active', is_approved: 'eq.true' },
        order: 'created_at.desc',
      });

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
      } else {
        setListings(listingsData || []);
      }

      // Fetch profiles for seller info
      const { data: profilesData } = await supabaseRestSelect('profiles', {
        select: '*',
      });

      if (profilesData) {
        setUsers(profilesData as User[]);
      }

      // Fetch user's saved listings if logged in
      if (currentUser) {
        const { data: favoritesData } = await supabaseRestSelect('favorites', {
          select: 'listing_id',
          filters: { user_id: `eq.${currentUser.id}` },
        });

        if (favoritesData) {
          setSavedListings(favoritesData.map((f: any) => f.listing_id));
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [currentUser]);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(l =>
        l.title.toLowerCase().includes(query) ||
        (l.description?.toLowerCase().includes(query)) ||
        l.category.toLowerCase().includes(query)
      );
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.category === selectedCategory);
    }

    // Mode Filter
    if (selectedMode !== 'all') {
      result = result.filter(l => {
        if (selectedMode === 'buy') return l.sell_price;
        if (selectedMode === 'rent') return l.price_per_day > 0;
        if (selectedMode === 'borrow') return l.deposit_amount;
        return true;
      });
    }

    // Add distance if user has location
    if (currentUser?.latitude && currentUser?.longitude) {
      result = result.map(l => ({
        ...l,
        distance: l.latitude && l.longitude
          ? calculateDistance(currentUser.latitude!, currentUser.longitude!, l.latitude, l.longitude)
          : undefined
      }));
    }

    // Sorting
    if (sortBy === 'price-low') result.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0));
    if (sortBy === 'price-high') result.sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0));
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (sortBy === 'distance' && currentUser?.latitude) {
      result.sort((a, b) => ((a as any).distance || 999) - ((b as any).distance || 999));
    }

    return result;
  }, [listings, selectedCategory, selectedMode, currentUser, sortBy, searchQuery]);

  const categories: Category[] = ['hijab', 'abaya', 'thobe', 'dress', 'jewelry', 'decor', 'other'];
  const modes: ListingMode[] = ['buy', 'rent', 'borrow'];

  const getSeller = (ownerId: string) => users.find(u => u.id === ownerId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] uppercase tracking-widest text-espresso/40">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 space-y-6 lg:space-y-0 border-b border-hairline pb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif tracking-widest uppercase">Explore</h2>
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-espresso/40 font-bold">
            <span>{filteredListings.length} Curated Items</span>
            <span>•</span>
            <span className="text-rose">Community</span>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          {/* Search Input */}
          <div className="hidden md:flex items-center border-b border-espresso/20 py-1 relative w-64 group focus-within:border-rose transition-colors">
            <Search size={14} className="text-espresso/40 group-focus-within:text-rose" />
            <input
              type="text"
              placeholder="SEARCH PIECES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[10px] uppercase tracking-[0.2em] font-bold px-3 focus:outline-none w-full placeholder:text-espresso/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-espresso/40 hover:text-espresso">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2 border-b border-espresso pb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold">Sort By:</span>
            <select
              className="bg-transparent text-[10px] uppercase tracking-widest font-bold focus:outline-none appearance-none pr-4 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              {currentUser?.latitude && <option value="distance">Nearest First</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden mb-8 relative">
        <div className="flex items-center border border-hairline bg-white p-3 space-x-3">
          <Search size={16} className="text-espresso/40" />
          <input
            type="text"
            placeholder="SEARCH PIECES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[10px] uppercase tracking-[0.2em] font-bold focus:outline-none w-full placeholder:text-espresso/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-espresso/40">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 space-y-10">
          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-hairline pb-2">Categories</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-[11px] uppercase tracking-widest py-1 text-left transition-colors ${selectedCategory === 'all' ? 'text-rose font-bold' : 'text-espresso/60'}`}
              >
                All Pieces
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] uppercase tracking-widest py-1 text-left transition-colors ${selectedCategory === cat ? 'text-rose font-bold' : 'text-espresso/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-hairline pb-2">Mode</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <button
                onClick={() => setSelectedMode('all')}
                className={`text-[11px] uppercase tracking-widest py-1 text-left transition-colors ${selectedMode === 'all' ? 'text-rose font-bold' : 'text-espresso/60'}`}
              >
                All Modes
              </button>
              {modes.map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`text-[11px] uppercase tracking-widest py-1 text-left transition-colors ${selectedMode === mode ? 'text-rose font-bold' : 'text-espresso/60'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {filteredListings.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p className="font-serif italic text-2xl text-espresso/20">No items found in this selection</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedMode('all'); setSearchQuery(''); }}
                className="text-[10px] uppercase tracking-widest font-bold text-rose underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-12">
              {filteredListings.map(listing => {
                const seller = getSeller(listing.owner_id);
                const distance = (listing as any).distance;

                return (
                  <div key={listing.id} className="relative">
                    <ListingCard
                      listing={listing}
                      seller={seller}
                      onView={onViewListing}
                      onToggleSave={onToggleSave}
                      isSaved={savedListings.includes(listing.id)}
                    />
                    {/* Distance badge */}
                    {distance !== undefined && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-espresso/70">
                        <MapPin size={10} />
                        {formatDistance(distance)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
