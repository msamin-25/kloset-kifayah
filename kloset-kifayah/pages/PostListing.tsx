
import React, { useState } from 'react';
import { Camera, X, Plus, Info } from 'lucide-react';
import { User, Listing, Category, ListingMode, Size, Condition } from '../types';

interface PostListingProps {
  onSubmit: (listing: Listing) => void;
  currentUser: User | null;
}

const PostListing: React.FC<PostListingProps> = ({ onSubmit, currentUser }) => {
  const [formData, setFormData] = useState<Partial<Listing>>({
    title: '',
    category: 'abaya',
    mode: 'buy',
    size: 'M',
    condition: 'new',
    description: '',
    location: currentUser?.location || '',
    shippingAvailable: true,
  });

  const categories: Category[] = ['hijab', 'abaya', 'thobe', 'dress', 'other'];
  const modes: ListingMode[] = ['buy', 'rent', 'borrow'];
  const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'one size'];
  const conditions: Condition[] = ['new', 'like new', 'good', 'worn'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const newListing: Listing = {
      ...formData as any,
      id: 'l' + Date.now(),
      sellerId: currentUser.id,
      photos: ['https://picsum.photos/seed/newpost/800/800'],
      createdAt: new Date().toISOString(),
      savedBy: []
    };
    
    onSubmit(newListing);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-12">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-serif uppercase tracking-widest">Post a New Piece</h1>
        <p className="text-rose font-script text-2xl">Share your wardrobe</p>
        <div className="w-12 h-[1px] bg-hairline mx-auto mt-6"></div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left: Photos and Visuals */}
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold">Product Photos</label>
            <div className="aspect-[3/4] bg-white border border-dashed border-hairline flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-beige transition-colors group">
              <div className="p-4 bg-beige border border-hairline group-hover:border-rose/40">
                <Camera size={32} strokeWidth={1} className="text-espresso/40" />
              </div>
              <div className="text-center">
                <span className="block text-[10px] uppercase tracking-widest font-bold">Add up to 6 photos</span>
                <span className="block text-[8px] uppercase tracking-widest text-espresso/40 mt-1">High resolution editorial style preferred</span>
              </div>
              <input type="file" className="hidden" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-white border border-hairline flex items-center justify-center">
                  <Plus size={16} className="text-hairline" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-forest/5 border border-forest/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Info size={16} className="text-forest" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-forest">Selling Tip</span>
            </div>
            <p className="text-[11px] text-forest/70 leading-relaxed italic">
              "Clear, naturally lit photos with a minimal background sell 3x faster. Showcase textures and details like embroidery or lace."
            </p>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Vintage Chiffon Hijab in Dusk"
                className="w-full bg-transparent border-b border-hairline py-3 text-sm focus:outline-none focus:border-espresso transition-colors font-serif text-xl"
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Category</label>
                <select 
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Mode</label>
                <select 
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as ListingMode })}
                >
                  {modes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">
                {formData.mode === 'buy' ? 'Selling Price ($)' : formData.mode === 'rent' ? 'Daily Rate ($)' : 'Refundable Deposit ($)'}
              </label>
              <input 
                type="number" 
                required
                placeholder="0.00"
                className="w-full bg-white border border-hairline p-3 text-sm focus:outline-none"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (formData.mode === 'buy') setFormData({...formData, priceBuy: val});
                  else if (formData.mode === 'rent') setFormData({...formData, priceRentPerDay: val});
                  else setFormData({...formData, depositBorrow: val});
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Size</label>
                <select 
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value as Size })}
                >
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Condition</label>
                <select 
                  className="w-full bg-white border border-hairline p-3 text-[11px] uppercase tracking-widest focus:outline-none"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                >
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-espresso/60">Description</label>
              <textarea 
                rows={4}
                required
                placeholder="Describe the fabric, fit, and any special features..."
                className="w-full bg-white border border-hairline p-4 text-[12px] focus:outline-none focus:border-rose transition-colors leading-relaxed"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold">Shipping Available</span>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, shippingAvailable: !formData.shippingAvailable })}
                  className={`w-12 h-6 border border-hairline relative transition-colors ${formData.shippingAvailable ? 'bg-forest' : 'bg-white'}`}
                >
                  <div className={`absolute top-0.5 h-4.5 w-4.5 bg-white border border-hairline transition-all ${formData.shippingAvailable ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-espresso text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-espresso/90 transition-all shadow-xl"
          >
            Post Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostListing;
