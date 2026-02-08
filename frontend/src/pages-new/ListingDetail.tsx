import { useState } from 'react';
import { Heart, MapPin, Send, ChevronLeft, Share2, Shield, Calendar, Package, Loader2 } from 'lucide-react';
import { calculateDistance, formatDistance } from '../lib/distance';
import type { Listing, User } from '../types';

interface ListingDetailProps {
  listing: Listing & { photos?: string[] };
  seller?: User;
  currentUserLocation?: { lat: number; lng: number };
  onViewProfile: (username: string) => void;
  onMessage: () => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
  isOwnListing: boolean;
}

export default function ListingDetail({
  listing,
  seller,
  currentUserLocation,
  onViewProfile,
  onMessage,
  onToggleSave,
  isSaved,
  isOwnListing
}: ListingDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // Get photos from listing_images or fallback
  const photos = listing.listing_images?.map(img => img.image_url) ||
    listing.photos ||
    ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800'];

  // Calculate distance if we have coordinates
  const distance = currentUserLocation && listing.latitude && listing.longitude
    ? calculateDistance(currentUserLocation.lat, currentUserLocation.lng, listing.latitude, listing.longitude)
    : undefined;

  // Determine mode and price
  const mode = listing.sell_price ? 'buy' : listing.deposit_amount ? 'borrow' : 'rent';
  const price = mode === 'buy'
    ? listing.sell_price
    : mode === 'borrow'
      ? listing.deposit_amount
      : listing.price_per_day;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-white border border-hairline overflow-hidden relative">
            <img
              src={photos[selectedImage]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />

            {/* Mode Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-beige border border-hairline text-[9px] uppercase tracking-widest font-bold">
              {mode}
            </div>

            {/* Distance Badge */}
            {distance !== undefined && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-espresso/70">
                <MapPin size={10} />
                {formatDistance(distance)}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-20 border overflow-hidden transition-all ${selectedImage === i ? 'border-rose' : 'border-hairline'
                    }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-2xl lg:text-3xl font-serif uppercase tracking-widest">{listing.title}</h1>

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-serif font-bold">${price}</span>
              <span className="text-[11px] uppercase tracking-widest text-espresso/40">
                {mode === 'rent' ? 'per day' : mode === 'borrow' ? 'deposit' : ''}
              </span>
            </div>

            <div className="w-12 h-[1px] bg-rose"></div>
          </div>

          {/* Seller Info */}
          {seller && (
            <div
              className="flex items-center gap-4 p-4 bg-white border border-hairline cursor-pointer hover:border-rose transition-colors"
              onClick={() => onViewProfile(seller.username || seller.email!)}
            >
              <div className="w-12 h-12 bg-beige border border-hairline overflow-hidden">
                <img
                  src={seller.avatar_url || `https://ui-avatars.com/api/?name=${seller.full_name || seller.email}&background=f5f0eb&color=3d3229&size=48`}
                  alt={seller.full_name || ''}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="text-[11px] uppercase tracking-widest font-bold">{seller.full_name || seller.username}</p>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-espresso/40 mt-1">
                  <MapPin size={10} />
                  <span>{seller.location || 'Local'}</span>
                  {distance !== undefined && (
                    <>
                      <span>•</span>
                      <span>{formatDistance(distance)}</span>
                    </>
                  )}
                </div>
              </div>
              {seller.is_verified_email && (
                <div className="flex items-center gap-1 text-forest">
                  <Shield size={14} />
                  <span className="text-[8px] uppercase tracking-widest font-bold">Verified</span>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-hairline">
              <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">Category</span>
              <p className="text-[11px] uppercase tracking-widest font-bold mt-1">{listing.category}</p>
            </div>
            <div className="p-4 bg-white border border-hairline">
              <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">Size</span>
              <p className="text-[11px] uppercase tracking-widest font-bold mt-1">
                {listing.size === 'one_size' ? 'One Size' : listing.size}
              </p>
            </div>
            <div className="p-4 bg-white border border-hairline">
              <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">Condition</span>
              <p className="text-[11px] uppercase tracking-widest font-bold mt-1">
                {listing.condition === 'like_new' ? 'Like New' : listing.condition}
              </p>
            </div>
            <div className="p-4 bg-white border border-hairline">
              <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">Pickup</span>
              <p className="text-[11px] uppercase tracking-widest font-bold mt-1">{listing.location}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-espresso/40 font-bold">Description</span>
            <p className="text-[12px] text-espresso/70 leading-relaxed">{listing.description}</p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {listing.is_modest && (
              <span className="px-3 py-1 bg-forest/10 text-forest text-[8px] uppercase tracking-widest font-bold">
                AI Verified Modest
              </span>
            )}
            {listing.is_cleaned && (
              <span className="px-3 py-1 bg-beige text-[8px] uppercase tracking-widest font-bold">
                Freshly Cleaned
              </span>
            )}
            {listing.is_smoke_free && (
              <span className="px-3 py-1 bg-beige text-[8px] uppercase tracking-widest font-bold">
                Smoke Free
              </span>
            )}
            {listing.is_pet_free && (
              <span className="px-3 py-1 bg-beige text-[8px] uppercase tracking-widest font-bold">
                Pet Free
              </span>
            )}
            {listing.shipping_available && (
              <span className="px-3 py-1 bg-beige text-[8px] uppercase tracking-widest font-bold flex items-center gap-1">
                <Package size={10} /> Shipping Available
              </span>
            )}
          </div>

          {/* Actions */}
          {!isOwnListing && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={onMessage}
                className="flex-grow bg-espresso text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-rose transition-all flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Contact Seller
              </button>
              <button
                onClick={() => onToggleSave(listing.id)}
                className={`p-4 border transition-colors ${isSaved ? 'border-rose bg-rose-light' : 'border-hairline hover:border-rose'
                  }`}
              >
                <Heart size={18} className={isSaved ? 'fill-rose text-rose' : ''} />
              </button>
              <button className="p-4 border border-hairline hover:border-espresso transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}