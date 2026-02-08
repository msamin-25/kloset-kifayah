import React, { useState } from 'react';
import { Heart, MessageSquare, ChevronDown, ChevronUp, Share2, MapPin, ShieldCheck, Truck, Check } from 'lucide-react';
import { Listing, User } from '../types';

interface ListingDetailProps {
  listing: Listing;
  seller?: User;
  onViewProfile: (username: string) => void;
  onMessage: () => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
  isOwnListing: boolean;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ 
  listing, seller, onViewProfile, onMessage, onToggleSave, isSaved, isOwnListing 
}) => {
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [hasShared, setHasShared] = useState(false);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Kloset Kifayah | ${listing.title}`,
      text: `Check out this ${listing.category} on Kloset Kifayah.`,
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
      // User cancelled or share failed
      console.debug('Share failed or cancelled', err);
    }
  };

  const sections = [
    { id: 'description', title: 'Description', content: listing.description },
    { id: 'details', title: 'Details', content: `Condition: ${listing.condition}\nSize: ${listing.size}\nCategory: ${listing.category}` },
    { id: 'rules', title: 'Borrowing Rules', content: 'Handle with care. Professional dry clean only before return. Late fees apply if returned after 3 days of borrowing period.' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-white border border-hairline overflow-hidden">
            <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square bg-white border border-hairline cursor-pointer hover:border-espresso/40 transition-colors">
                <img src={`https://picsum.photos/seed/thumb${i}${listing.id}/400/400`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-10 lg:sticky lg:top-32">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-serif uppercase tracking-wider mb-2">{listing.title}</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-serif font-bold">
                    ${listing.mode === 'rent' ? `${listing.priceRentPerDay}/day` : listing.mode === 'borrow' ? `Deposit: $${listing.depositBorrow}` : listing.priceBuy}
                  </span>
                  <span className="px-2 py-0.5 bg-beige border border-hairline text-[8px] uppercase tracking-widest font-bold">
                    {listing.mode}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleShare}
                  className="p-2 border border-hairline hover:bg-beige transition-colors relative group"
                  title="Share Listing"
                >
                  {hasShared ? <Check size={18} strokeWidth={1.5} className="text-forest" /> : <Share2 size={18} strokeWidth={1.5} />}
                  {hasShared && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-espresso text-white text-[8px] uppercase tracking-widest px-2 py-1 whitespace-nowrap">
                      Link Copied
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => onToggleSave(listing.id)}
                  className="p-2 border border-hairline hover:bg-beige transition-colors"
                >
                  <Heart size={18} strokeWidth={1.5} className={isSaved ? 'fill-rose text-rose' : ''} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-y border-hairline">
            <div className="text-center space-y-1">
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Condition</span>
              <span className="block text-[10px] uppercase tracking-widest font-bold">{listing.condition}</span>
            </div>
            <div className="text-center space-y-1">
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Size</span>
              <span className="block text-[10px] uppercase tracking-widest font-bold">{listing.size}</span>
            </div>
            <div className="text-center space-y-1">
              <span className="block text-[8px] uppercase tracking-widest text-espresso/40 font-bold">Shipping</span>
              <span className="block text-[10px] uppercase tracking-widest font-bold">{listing.shippingAvailable ? 'Available' : 'Local Only'}</span>
            </div>
          </div>

          <div className="space-y-4">
            {!isOwnListing && (
              <button 
                onClick={onMessage}
                className="w-full bg-espresso text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-espresso/90 transition-all flex items-center justify-center space-x-2"
              >
                <MessageSquare size={16} />
                <span>Message Seller</span>
              </button>
            )}
            
            <div className="p-6 bg-white border border-hairline flex items-center justify-between">
              <div 
                className="flex items-center space-x-4 cursor-pointer group"
                onClick={() => seller && onViewProfile(seller.username)}
              >
                <div className="w-12 h-12 bg-beige border border-hairline overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                  <img src={seller?.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-widest font-bold">@{seller?.username}</span>
                  <span className="block text-[9px] uppercase tracking-widest text-espresso/40">{seller?.location}</span>
                </div>
              </div>
              {!isOwnListing && (
                <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose hover:underline">
                  Follow
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map(sec => (
              <div key={sec.id} className="border-b border-hairline">
                <button 
                  onClick={() => toggleSection(sec.id)}
                  className="w-full py-4 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-left"
                >
                  {sec.title}
                  {openSection === sec.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {openSection === sec.id && (
                  <div className="pb-6 text-[12px] text-espresso/70 leading-relaxed whitespace-pre-line">
                    {sec.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-6 pt-4">
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest text-espresso/40">
              <ShieldCheck size={14} className="text-forest" />
              <span>Buyer Protection</span>
            </div>
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest text-espresso/40">
              <Truck size={14} />
              <span>Ships in 24-48h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      <div className="mt-24 pt-12 border-t border-hairline">
        <h2 className="text-2xl font-serif uppercase tracking-widest mb-12">Similar Pieces</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mock Similar Items */}
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="aspect-[3/4] bg-white border border-hairline overflow-hidden">
                <img src={`https://picsum.photos/seed/sim${i}/600/800`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-widest font-bold">Evening Kaftan</span>
                <span className="block text-serif font-bold text-[12px]">$120</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;