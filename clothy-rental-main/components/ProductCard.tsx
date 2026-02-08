
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col h-full glint-effect">
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
        />
        
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-stone-950/10 group-hover:bg-stone-950/0 transition-colors duration-700"></div>
        
        {/* Modest Badge */}
        {product.isIslamic && (
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-xl flex items-center space-x-2 border border-stone-100 group-hover:-translate-y-1 transition-transform z-10">
             <i className="fa-solid fa-star-and-crescent text-amber-600 text-[10px]"></i>
             <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest">Islamic Curation</span>
          </div>
        )}

        {/* Action Tray */}
        <div className="absolute bottom-6 left-6 right-6 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10">
          <div className="bg-white/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center space-x-2 border border-white/20">
             <button className="flex-1 bg-stone-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-700 transition-all flex items-center justify-center space-x-2">
                <i className="fa-solid fa-plus"></i>
                <span>Quick View</span>
             </button>
             <button className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors group/heart">
                <i className="fa-regular fa-heart group-hover/heart:fa-solid transition-all"></i>
             </button>
          </div>
        </div>
      </div>
      
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1">
            <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.3em]">{product.brand}</p>
            <h3 className="text-2xl font-serif font-bold text-stone-900 leading-tight group-hover:text-amber-700 transition-colors">{product.name}</h3>
          </div>
        </div>
        
        <p className="text-sm text-stone-400 font-medium line-clamp-2 mb-6 leading-relaxed italic">{product.description}</p>
        
        {/* Dual Pricing Section */}
        <div className="mt-auto space-y-4 pt-6 border-t border-stone-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Rent for</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-[10px] text-amber-600 font-black">$</span>
                <span className="text-3xl font-black text-amber-700 tracking-tighter">{product.rentPrice}</span>
                <span className="text-[9px] text-stone-400 font-bold">/{product.rentalPeriod}</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-stone-100"></div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Buy Pre-loved</span>
              <div className="flex items-baseline justify-end space-x-1">
                <span className="text-[10px] text-stone-400 font-black">$</span>
                <span className="text-2xl font-black text-stone-900 tracking-tighter">{product.sellPrice}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
             <div className="flex items-center space-x-1">
               {[1,2,3,4,5].map(s => (
                 <i key={s} className="fa-solid fa-star text-[8px] text-amber-400"></i>
               ))}
               <span className="text-[9px] text-stone-400 font-black ml-1 uppercase">(24)</span>
             </div>
             <div className="flex space-x-1">
                {product.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[8px] px-2 py-0.5 bg-stone-50 rounded text-stone-500 font-bold uppercase tracking-widest">{tag}</span>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
