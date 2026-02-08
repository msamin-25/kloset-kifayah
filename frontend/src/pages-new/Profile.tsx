import { useState } from 'react';
import { MapPin, Calendar, Heart, Package, Settings, LogOut, Edit3 } from 'lucide-react';
import type { User, Listing } from '../types';

interface ProfileProps {
  user: User;
  isMe: boolean;
  listings: Listing[];
  savedListings: Listing[];
  onViewListing: (id: string) => void;
  onFollow: () => void;
  isFollowing: boolean;
}

export default function Profile({
  user,
  isMe,
  listings,
  savedListings,
  onViewListing,
  onFollow,
  isFollowing
}: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'saved'>('listings');

  const displayListings = activeTab === 'listings' ? listings : savedListings;

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start lg:items-center mb-12 pb-12 border-b border-hairline">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white border border-hairline overflow-hidden">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=f5f0eb&color=3d3229&size=160`}
              alt={user.full_name || ''}
              className="w-full h-full object-cover"
            />
          </div>
          {isMe && (
            <button className="absolute bottom-2 right-2 p-2 bg-white border border-hairline hover:border-rose transition-colors">
              <Edit3 size={14} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-serif uppercase tracking-widest">
              {user.full_name || user.username || 'User'}
            </h1>
            {user.username && (
              <span className="text-[11px] uppercase tracking-widest text-espresso/40">
                @{user.username}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-[12px] text-espresso/70 leading-relaxed max-w-lg">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-widest text-espresso/60">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{user.location}</span>
              </div>
            )}
            {user.created_at && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{listings.length}</span>
              <span className="text-[9px] uppercase tracking-widest text-espresso/40">Listings</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{savedListings.length}</span>
              <span className="text-[9px] uppercase tracking-widest text-espresso/40">Saved</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{user.followers?.length || 0}</span>
              <span className="text-[9px] uppercase tracking-widest text-espresso/40">Followers</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isMe ? (
            <>
              <button className="px-6 py-3 border border-hairline text-[10px] uppercase tracking-widest font-bold hover:border-espresso transition-colors flex items-center gap-2">
                <Settings size={14} />
                Settings
              </button>
            </>
          ) : (
            <button
              onClick={onFollow}
              className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors ${isFollowing
                  ? 'border border-rose text-rose hover:bg-rose-light'
                  : 'bg-espresso text-white hover:bg-rose'
                }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-hairline">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-colors relative ${activeTab === 'listings' ? 'text-espresso' : 'text-espresso/40'
            }`}
        >
          <Package size={16} className="inline mr-2" />
          My Listings
          {activeTab === 'listings' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-colors relative ${activeTab === 'saved' ? 'text-espresso' : 'text-espresso/40'
            }`}
        >
          <Heart size={16} className="inline mr-2" />
          Saved Items
          {activeTab === 'saved' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose"></span>
          )}
        </button>
      </div>

      {/* Listings Grid */}
      {displayListings.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="font-serif italic text-2xl text-espresso/20">
            {activeTab === 'listings' ? 'No listings yet' : 'No saved items'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayListings.map(listing => {
            const imageUrl = listing.listing_images && listing.listing_images.length > 0
              ? listing.listing_images[0].image_url
              : 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400';

            return (
              <div
                key={listing.id}
                className="group cursor-pointer"
                onClick={() => onViewListing(listing.id)}
              >
                <div className="aspect-[3/4] bg-white border border-hairline overflow-hidden relative">
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-colors"></div>
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold group-hover:text-rose transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-[11px] font-serif font-bold">
                    ${listing.sell_price || listing.price_per_day}
                    {!listing.sell_price && <span className="text-espresso/40 font-normal">/day</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}