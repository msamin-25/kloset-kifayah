import React, { useState } from 'react';
import { User, Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { Settings, Share2, MapPin, Grid, Heart, Check } from 'lucide-react';

interface ProfileProps {
  user: User;
  isMe: boolean;
  listings: Listing[];
  savedListings: Listing[];
  onViewListing: (id: string) => void;
  onFollow: () => void;
  isFollowing: boolean;
}

const Profile: React.FC<ProfileProps> = ({ user, isMe, listings, savedListings, onViewListing, onFollow, isFollowing }) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'reviews'>('listings');
  const [hasShared, setHasShared] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `Kloset Kifayah | ${user.displayName}`,
      text: `View ${user.displayName}'s collection on Kloset Kifayah.`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setHasShared(true);
        setTimeout(() => setHasShared(false), 2000);
      }
    } catch (err) {
      console.debug('Share failed or cancelled', err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-8 mb-20">
        <div className="relative">
          <div className="w-32 h-32 lg:w-48 lg:h-48 bg-white border border-hairline p-1 overflow-hidden">
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover grayscale" />
          </div>
          {isMe && (
            <button className="absolute bottom-2 right-2 p-2 bg-espresso text-white hover:bg-rose transition-colors">
              <Settings size={14} />
            </button>
          )}
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif uppercase tracking-widest">{user.displayName}</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/40">@{user.username}</p>
          </div>
          
          <div className="flex items-center justify-center space-x-3 text-espresso/60">
            <MapPin size={12} />
            <span className="text-[10px] uppercase tracking-widest">{user.location}</span>
          </div>

          <p className="text-sm text-espresso/70 leading-relaxed font-light">
            {user.bio}
          </p>

          <div className="flex items-center justify-center space-x-12 py-4 border-y border-hairline">
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{listings.length}</span>
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Listings</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{user.followers.length}</span>
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Followers</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-serif font-bold">{user.following.length}</span>
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Following</span>
            </div>
          </div>

          <div className="flex space-x-4">
            {isMe ? (
              <div className="flex-grow flex space-x-4">
                <button className="flex-grow border border-hairline py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-beige transition-all">
                  Edit Profile
                </button>
                <button 
                  onClick={handleShare}
                  className="px-6 border border-hairline hover:bg-beige transition-all relative group"
                  title="Share Profile"
                >
                  {hasShared ? <Check size={16} strokeWidth={1.5} className="text-forest" /> : <Share2 size={16} strokeWidth={1.5} />}
                  {hasShared && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-espresso text-white text-[8px] uppercase tracking-widest px-2 py-1 whitespace-nowrap">
                      Link Copied
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onFollow}
                  className={`flex-grow py-4 text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${
                    isFollowing ? 'border border-hairline bg-beige' : 'bg-espresso text-white hover:bg-espresso/90'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={handleShare}
                  className="px-6 border border-hairline hover:bg-beige transition-all relative group"
                  title="Share Profile"
                >
                  {hasShared ? <Check size={16} strokeWidth={1.5} className="text-forest" /> : <Share2 size={16} strokeWidth={1.5} />}
                  {hasShared && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-espresso text-white text-[8px] uppercase tracking-widest px-2 py-1 whitespace-nowrap">
                      Link Copied
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-12">
        <div className="flex items-center justify-center space-x-12 border-b border-hairline">
          {[
            { id: 'listings', label: 'Listings', icon: Grid },
            ...(isMe ? [{ id: 'saved', label: 'Saved Items', icon: Heart }] : []),
            { id: 'reviews', label: 'Reviews', icon: Share2 },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border-b-2 ${
                activeTab === tab.id ? 'border-espresso text-espresso' : 'border-transparent text-espresso/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTab === 'listings' && (
            listings.length > 0 ? (
              listings.map(l => (
                <ListingCard 
                  key={l.id} 
                  listing={l} 
                  onView={onViewListing} 
                  onToggleSave={() => {}} 
                  isSaved={false} 
                  seller={user}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center font-serif italic text-espresso/20 text-xl">
                No listings yet
              </div>
            )
          )}
          
          {activeTab === 'saved' && (
             savedListings.length > 0 ? (
              savedListings.map(l => (
                <ListingCard 
                  key={l.id} 
                  listing={l} 
                  onView={onViewListing} 
                  onToggleSave={() => {}} 
                  isSaved={true} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center font-serif italic text-espresso/20 text-xl">
                Your saved items will appear here
              </div>
            )
          )}

          {activeTab === 'reviews' && (
            <div className="col-span-full py-20 text-center space-y-4">
              <span className="font-script text-3xl text-rose">Under Development</span>
              <p className="font-serif italic text-espresso/20 text-xl">Community feedback coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;