
import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Listing, User } from '../types';

interface ListingCardProps {
  listing: Listing;
  seller?: User;
  onView: (id: string) => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, seller, onView, onToggleSave, isSaved }) => {
  const getModeTag = () => {
    switch (listing.mode) {
      case 'buy': return { label: 'Buy', color: 'bg-rose text-white' };
      case 'rent': return { label: 'Rent', color: 'bg-forest text-white' };
      case 'borrow': return { label: 'Borrow', color: 'bg-espresso text-white' };
    }
  };

  const tag = getModeTag();

  return (
    <div className="group relative bg-white border border-hairline overflow-hidden transition-all hover:border-rose/30">
      <div 
        className="aspect-[3/4] overflow-hidden bg-beige cursor-pointer"
        onClick={() => onView(listing.id)}
      >
        <img 
          src={listing.photos[0]} 
          alt={listing.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[0.1] group-hover:grayscale-0" 
        />
        
        <div className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold ${tag.color} z-10 shadow-sm`}>
          {tag.label}
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(listing.id);
        }}
        className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-rose-light transition-colors z-10 border border-hairline"
      >
        <Heart 
          size={16} 
          strokeWidth={1.5} 
          className={isSaved ? 'fill-rose text-rose' : 'text-espresso/40 group-hover:text-espresso'} 
        />
      </button>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 
            className="text-[12px] lg:text-[13px] font-medium leading-tight group-hover:text-rose transition-colors cursor-pointer"
            onClick={() => onView(listing.id)}
          >
            {listing.title}
          </h3>
          <span className="text-[12px] lg:text-[13px] font-serif font-semibold text-espresso">
            ${listing.mode === 'rent' ? `${listing.priceRentPerDay}/day` : listing.mode === 'borrow' ? `Free` : listing.priceBuy}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-rose-light/30">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-espresso/5 border border-hairline overflow-hidden">
              <img src={seller?.avatarUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <span className="text-[9px] lg:text-[10px] text-espresso/50 font-medium tracking-tight">@{seller?.username}</span>
          </div>
          <div className="flex items-center text-espresso/40 space-x-1">
            <MapPin size={10} />
            <span className="text-[8px] lg:text-[9px] uppercase tracking-widest">{listing.location.split(',')[0]}</span>
          </div>
        </div>
      </div>
      
      {/* Decorative Ribbon Accent - More visible rose */}
      <div className="absolute bottom-[-10px] right-[-10px] w-10 h-10 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-4 left-0 w-16 h-[2px] bg-rose rotate-[-45deg] transform"></div>
      </div>
    </div>
  );
};

export default ListingCard;
