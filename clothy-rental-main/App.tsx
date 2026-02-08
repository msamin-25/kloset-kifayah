
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import StyleAssistant from './components/StyleAssistant';
import { MOCK_PRODUCTS } from './data/mockData';
import { Category } from './types';

const App: React.FC = () => {
  const [isIslamicOnly, setIsIslamicOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Object.values(Category)];

  useEffect(() => {
    if (isIslamicOnly) {
      document.body.classList.add('modest-mode-active');
    } else {
      document.body.classList.remove('modest-mode-active');
    }
  }, [isIslamicOnly]);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchIslamic = isIslamicOnly ? p.isIslamic : true;
      const matchCategory = selectedCategory === 'All' ? true : p.category === selectedCategory;
      return matchIslamic && matchCategory;
    });
  }, [isIslamicOnly, selectedCategory]);

  const featuredModest = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => p.isIslamic).slice(0, 3);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-1000 selection:bg-amber-100 selection:text-amber-900 ${isIslamicOnly ? 'bg-emerald-50/20' : 'bg-stone-50'}`}>
      <Header onToggleIslamic={setIsIslamicOnly} isIslamicOnly={isIslamicOnly} />

      {/* Hero Section */}
      <section className="relative h-[800px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 transition-opacity duration-1000">
          <img 
            src={isIslamicOnly 
              ? "https://images.unsplash.com/photo-1621112904887-419379ce6824?auto=format&fit=crop&q=80&w=2000" 
              : "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000"
            } 
            className="w-full h-full object-cover object-top scale-105 animate-[pulse_15s_ease-in-out_infinite]"
            alt="Hero Background"
          />
          <div className={`absolute inset-0 transition-all duration-1000 ${
            isIslamicOnly 
            ? 'bg-gradient-to-r from-emerald-950/95 via-emerald-950/40 to-transparent' 
            : 'bg-gradient-to-r from-stone-950/90 via-stone-950/40 to-transparent'
          }`}></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-left duration-700 transition-colors ${
              isIslamicOnly ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <i className={`fa-solid ${isIslamicOnly ? 'fa-star-and-crescent' : 'fa-sparkles'} animate-spin-slow`}></i>
              <span>{isIslamicOnly ? 'Boutique Islamic Collection' : 'Shared Luxury Wardrobe'}</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-bold text-white mb-8 leading-tight font-serif animate-in fade-in slide-in-from-bottom duration-1000">
              {isIslamicOnly ? (
                <>Art of <span className="text-emerald-400 italic">Modesty</span></>
              ) : (
                <>Fine <span className="sparkle-text italic">Clothy</span> Haus</>
              )}
            </h1>
            
            <p className="text-xl text-stone-300 mb-12 max-w-xl font-light leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              {isIslamicOnly 
                ? "Rent the finest Abayas, Burkahs, and Panjabis for your next event. Authentic modest couture, reimagined for the modern world."
                : "The premier platform for high-end fashion rentals. Experience the thrill of luxury rotation or acquire pre-loved treasures with a touch of magic."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
              <button className={`group relative px-14 py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-2xl w-full sm:w-auto overflow-hidden ${
                isIslamicOnly ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-amber-700 hover:bg-amber-600 text-white'
              }`}>
                <span className="relative z-10 flex items-center justify-center">
                  Browse Rentals
                  <i className="fa-solid fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <button className="glass-morphism text-white px-14 py-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/20 transition w-full sm:w-auto border border-white/40 flex items-center justify-center">
                Buy Pre-loved
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Floaties */}
        <div className="absolute bottom-20 right-20 hidden lg:block animate-bounce duration-[3000ms]">
            <div className={`p-8 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-1000 ${isIslamicOnly ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Weekly Rental</p>
                <p className="text-3xl font-serif font-bold text-white mb-4">Start from $12</p>
                <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
            </div>
        </div>
      </section>

      {/* Featured Showcase for Modest Mode */}
      {isIslamicOnly && (
        <section className="py-32 bg-stone-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                <div className="max-w-xl">
                    <h2 className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-6">The Islamic Boutique</h2>
                    <h3 className="text-5xl md:text-6xl font-serif text-white font-bold leading-tight">Masterpieces of <br/><span className="italic text-emerald-400">Grace</span></h3>
                </div>
                <button className="hidden md:flex items-center space-x-2 text-white text-xs font-black uppercase tracking-[0.3em] hover:text-emerald-400 transition-colors pb-4">
                    <span>View All Collections</span>
                    <i className="fa-solid fa-arrow-right"></i>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featuredModest.map((item, idx) => (
                <div key={item.id} className="group relative overflow-hidden rounded-[3rem] aspect-[3/4] animate-in zoom-in duration-1000 shadow-2xl" style={{animationDelay: `${idx * 200}ms`}}>
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/20 to-transparent flex flex-col justify-end p-12">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-3">{item.brand}</p>
                    <h4 className="text-3xl font-serif text-white font-bold mb-6">{item.name}</h4>
                    <div className="flex items-center justify-between">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
                            <span className="text-white text-xs font-black uppercase tracking-widest">Rent: ${item.rentPrice}</span>
                        </div>
                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-900 hover:bg-emerald-400 hover:text-white transition-all">
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Marketplace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 space-y-10 lg:space-y-0">
          <div className="max-w-2xl">
            <div className={`flex items-center space-x-4 mb-6 transition-colors duration-1000 ${isIslamicOnly ? 'text-emerald-600' : 'text-amber-600'}`}>
              <div className={`h-[2px] w-16 transition-colors duration-1000 ${isIslamicOnly ? 'bg-emerald-600' : 'bg-amber-600'}`}></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">The Collective Catalogue</span>
            </div>
            <h2 className="text-6xl font-bold text-stone-900 font-serif leading-[1.1]">
              {isIslamicOnly ? "Heritage & Modesty" : "Luxe Shared Wardrobe"}
            </h2>
            <p className="text-stone-500 mt-6 text-xl font-light leading-relaxed">
              {isIslamicOnly 
                ? "Browse our exclusive selection of artisanal modesty pieces available for circular luxury."
                : "Explore our hand-picked high-end fashion catalog. Rent for a moment, own for a lifetime."
              }
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 p-2 bg-white shadow-xl shadow-stone-900/5 rounded-full border border-stone-100">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-10 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-500 ${
                  selectedCategory === cat 
                  ? 'bg-stone-900 text-white shadow-2xl shadow-stone-900/40 scale-105' 
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20">
          {filteredProducts.map((product, idx) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${idx * 150}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </main>

      {/* Sustainable Impact Section */}
      <section className={`py-32 overflow-hidden relative transition-all duration-1000 ${isIslamicOnly ? 'bg-emerald-900' : 'bg-stone-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-24">
              <div className="lg:w-1/2 relative">
                  <div className="absolute -inset-10 bg-white/5 rounded-full blur-[100px] animate-pulse"></div>
                  <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000" className="relative z-10 rounded-[4rem] shadow-2xl object-cover h-[600px] w-full border border-white/10" alt="Sustainable Fashion" />
                  <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white p-8 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] z-20 flex flex-col justify-center text-center rotate-6 group hover:rotate-0 transition-transform">
                      <p className={`text-5xl font-black mb-3 transition-colors duration-1000 ${isIslamicOnly ? 'text-emerald-700' : 'text-amber-700'}`}>Eco</p>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">First Certification</p>
                  </div>
              </div>
              <div className="lg:w-1/2">
                  <span className={`text-[11px] font-black uppercase tracking-[0.5em] mb-8 block transition-colors duration-1000 ${isIslamicOnly ? 'text-emerald-400' : 'text-amber-500'}`}>Our Sustainable Promise</span>
                  <h2 className="text-6xl font-bold font-serif text-white mb-10 leading-[1.1]">The Cycle of <br/><span className="italic text-amber-500">Tajdeed</span>.</h2>
                  <p className="text-stone-300 text-xl mb-12 leading-relaxed font-light">Shared luxury is the ultimate act of sustainability. By renting, we extend the soul of every garment and honor the resources of our world. Join the circular modest movement.</p>
                  <div className="grid grid-cols-2 gap-8 mb-16">
                      <div className="space-y-2">
                        <h5 className="font-black text-white text-sm uppercase tracking-widest">0% Waste</h5>
                        <p className="text-sm text-stone-500">Packaging is 100% compostable silk-blend.</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-black text-white text-sm uppercase tracking-widest">Ethical Loop</h5>
                        <p className="text-sm text-stone-500">Every piece inspected and certified pre-loved.</p>
                      </div>
                  </div>
                  <button className={`text-white px-12 py-5 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-xl hover:-translate-y-1 ${isIslamicOnly ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-amber-700 hover:bg-amber-600'}`}>Learn About The Cycle</button>
              </div>
          </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-stone-950 text-stone-400 pt-32 pb-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-24">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 transition-colors duration-1000 ${isIslamicOnly ? 'bg-emerald-700' : 'bg-amber-700'}`}>
                <i className={`fa-solid ${isIslamicOnly ? 'fa-star-and-crescent' : 'fa-vest'} text-white text-4xl`}></i>
            </div>
            <h4 className="text-6xl font-serif font-bold text-white mb-6">Clothy Collective</h4>
            <p className="max-w-xl text-stone-500 text-lg leading-relaxed font-medium">The world's premier circle for circular modest fashion. Wear, share, and experience luxury without the compromise.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-16 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-stone-800">
            <p className="col-span-2 md:col-span-1">© 2024 Clothy Collective Haus.</p>
            <a href="#" className="hover:text-stone-400 transition-colors">Sustainability Policy</a>
            <a href="#" className="hover:text-stone-400 transition-colors">Member Terms</a>
            <a href="#" className="hover:text-stone-400 transition-colors">Buyer Escrow</a>
          </div>
        </div>
      </footer>

      <StyleAssistant />
    </div>
  );
};

export default App;
