import { Heart, MapPin } from 'lucide-react';
import type { Listing, User } from '../types';

interface ListingCardProps {
  listing: Listing;
  seller?: User;
  onView: (id: string) => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
  distance?: number;
}

export default function ListingCard({ listing, seller, onView, onToggleSave, isSaved, distance }: ListingCardProps) {
  // Get the first image URL
  const imageUrl = listing.listing_images && listing.listing_images.length > 0
    ? listing.listing_images[0].image_url
    : 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800';

  // Determine listing mode and price display
  const mode = listing.sell_price ? 'buy' : listing.deposit_amount ? 'borrow' : 'rent';
  const priceDisplay = mode === 'buy'
    ? `$${listing.sell_price}`
    : mode === 'borrow'
      ? `Deposit: $${listing.deposit_amount}`
      : `$${listing.price_per_day}/day`;

  return (
    <div className="group cursor-pointer space-y-4">
      {/* Image Container */}
      <div
        className="aspect-[3/4] bg-white border border-hairline overflow-hidden relative"
        onClick={() => onView(listing.id)}
      >
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Mode Badge */}
        <div className="absolute top-4 right-4 px-2 py-1 bg-beige border border-hairline text-[8px] uppercase tracking-widest font-bold">
          {mode}
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(listing.id);
          }}
          className="absolute bottom-4 right-4 p-2 bg-white/80 hover:bg-white transition-colors border border-hairline"
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            className={isSaved ? 'fill-rose text-rose' : 'text-espresso/40'}
          />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-colors pointer-events-none" />
      </div>

      {/* Info */}
      <div className="space-y-2" onClick={() => onView(listing.id)}>
        {/* Seller Info */}
        {seller && (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-beige border border-hairline overflow-hidden">
              <img
                src={seller.avatar_url || `https://ui-avatars.com/api/?name=${seller.full_name || seller.email}&background=f5f0eb&color=3d3229&size=40`}
                alt=""
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
              />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">
              @{seller.username || seller.email?.split('@')[0]}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-[11px] uppercase tracking-widest font-bold group-hover:text-rose transition-colors line-clamp-1">
          {listing.title}
        </h3>

        {/* Price & Location */}
        <div className="flex items-center justify-between">
          <span className="font-serif font-bold text-[14px]">{priceDisplay}</span>
          {listing.location && (
            <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-espresso/40">
              <MapPin size={10} />
              <span className="line-clamp-1 max-w-[100px]">{listing.location}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-espresso/40">
          <span>{listing.category}</span>
          <span>•</span>
          <span>{listing.size === 'one_size' ? 'One Size' : listing.size}</span>
          <span>•</span>
          <span>{listing.condition === 'like_new' ? 'Like New' : listing.condition}</span>
        </div>
      </div>
    </div>
  );
}
