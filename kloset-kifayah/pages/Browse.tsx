
import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown, Grid, LayoutList, Search, X } from 'lucide-react';
import { Listing, User, Category, ListingMode } from '../types';
import ListingCard from '../components/ListingCard';

interface BrowseProps {
  listings: Listing[];
  currentUser: User | null;
  users: User[];
  onViewListing: (id: string) => void;
  onToggleSave: (id: string) => void;
}

const Browse: React.FC<BrowseProps> = ({ listings, currentUser, users, onViewListing, onToggleSave }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<ListingMode | 'all'>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = useMemo(() => {
    let result = [...listings];
    
    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(l => 
        l.title.toLowerCase().includes(query) || 
        l.description.toLowerCase().includes(query) ||
        l.category.toLowerCase().includes(query)
      );
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    // Mode Filter
    if (selectedMode !== 'all') {
      result = result.filter(l => l.mode === selectedMode);
    }

    // Ranking logic: followed sellers first
    if (currentUser) {
      result.sort((a, b) => {
        const aFollowed = currentUser.following.includes(a.sellerId);
        const bFollowed = currentUser.following.includes(b.sellerId);
        if (aFollowed && !bFollowed) return -1;
        if (!aFollowed && bFollowed) return 1;
        return 0;
      });
    }

    if (sortBy === 'price-low') result.sort((a, b) => (a.priceBuy || 0) - (b.priceBuy || 0));
    if (sortBy === 'price-high') result.sort((a, b) => (b.priceBuy || 0) - (a.priceBuy || 0));
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [listings, selectedCategory, selectedMode, currentUser, sortBy, searchQuery]);

  const categories: Category[] = ['hijab', 'abaya', 'thobe', 'dress', 'other'];
  const modes: ListingMode[] = ['buy', 'rent', 'borrow'];

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 space-y-6 lg:space-y-0 border-b border-hairline pb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif tracking-widest uppercase">Explore</h2>
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-espresso/40 font-bold">
            <span>{filteredListings.length} Curated Items</span>
            <span>•</span>
            <span className="text-rose">Global Community</span>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          {/* Search Input - Desktop integrated */}
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
            </select>
          </div>
          <div className="hidden lg:flex items-center space-x-2">
             <Grid size={16} strokeWidth={1.5} className="text-espresso cursor-pointer" />
             <LayoutList size={16} strokeWidth={1.5} className="text-espresso/20 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Mobile Search - Only visible on small screens */}
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

          <section className="hidden lg:block space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-hairline pb-2">Suggested Sellers</h4>
            <div className="space-y-4">
              {users.slice(0, 3).map(user => (
                <div key={user.id} className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-8 h-8 bg-white border border-hairline overflow-hidden">
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest">@{user.username}</span>
                    <span className="text-[8px] uppercase tracking-widest text-espresso/40">{user.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Product Feed */}
        <div className="flex-grow space-y-12">
          {/* For You Row */}
          {!searchQuery && selectedCategory === 'all' && selectedMode === 'all' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-hairline pb-2">
                <span className="font-script text-3xl lg:text-4xl text-rose">For You</span>
                <span className="text-[9px] uppercase tracking-widest text-espresso/40">Recently Viewed</span>
              </div>
              <div className="flex overflow-x-auto thin-scrollbar pb-6 space-x-4 -mx-4 px-4 lg:mx-0 lg:px-0">
                {listings.slice(0, 5).map(listing => (
                  <div key={listing.id} className="min-w-[200px] lg:min-w-[280px]">
                    <ListingCard 
                      listing={listing} 
                      seller={users.find(u => u.id === listing.sellerId)} 
                      onView={onViewListing}
                      onToggleSave={onToggleSave}
                      isSaved={currentUser ? listing.savedBy.includes(currentUser.id) : false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-12">
            {filteredListings.length > 0 ? (
              filteredListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  seller={users.find(u => u.id === listing.sellerId)} 
                  onView={onViewListing}
                  onToggleSave={onToggleSave}
                  isSaved={currentUser ? listing.savedBy.includes(currentUser.id) : false}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <p className="font-serif italic text-2xl text-espresso/20">No items found in this selection</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSelectedMode('all'); setSearchQuery(''); }}
                  className="text-[10px] uppercase tracking-widest font-bold text-rose underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
