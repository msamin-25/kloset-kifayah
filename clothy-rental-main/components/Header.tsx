
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onToggleIslamic: (val: boolean) => void;
  isIslamicOnly: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleIslamic, isIslamicOnly }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
      scrolled 
      ? 'bg-white/80 backdrop-blur-2xl border-b border-stone-200 py-3 shadow-2xl shadow-stone-900/5' 
      : 'bg-transparent py-8'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl group-hover:rotate-12 ${
              isIslamicOnly 
              ? 'bg-emerald-700 shadow-emerald-900/20' 
              : 'bg-amber-700 shadow-amber-900/20 group-hover:bg-stone-900'
            }`}>
              <i className={`fa-solid ${isIslamicOnly ? 'fa-star-and-crescent' : 'fa-vest'} text-white text-2xl`}></i>
            </div>
            <div className="flex flex-col">
              <span className={`text-3xl font-serif font-bold tracking-tight transition-colors duration-700 ${
                scrolled ? 'text-stone-900' : 'text-white'
              }`}>Clothy</span>
              <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-colors duration-700 ${isIslamicOnly ? 'text-emerald-500' : 'text-amber-500'}`}>Haus Boutique</span>
            </div>
          </div>

          {/* Navigation */}
          <div className={`hidden lg:flex items-center space-x-12 font-black text-[10px] uppercase tracking-[0.25em] transition-colors duration-700 ${
            scrolled ? 'text-stone-600' : 'text-stone-300'
          }`}>
            <a href="#" className="hover:text-amber-500 transition-all flex flex-col items-center group">
               <span>Rent</span>
               <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
            </a>
            <a href="#" className="hover:text-amber-500 transition-all flex flex-col items-center group">
               <span>Pre-loved</span>
               <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
            </a>
            <a href="#" className="hover:text-amber-500 transition-all flex flex-col items-center group">
               <span>Magazine</span>
               <div className="w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
            </a>
            <div className="h-4 w-[1px] bg-stone-400/20"></div>
            <button 
              onClick={() => onToggleIslamic(!isIslamicOnly)}
              className={`px-8 py-3 rounded-full border transition-all flex items-center space-x-3 relative overflow-hidden group shadow-xl ${
                isIslamicOnly 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/30 scale-105' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              } ${scrolled && !isIslamicOnly ? 'text-stone-600 border-stone-200 bg-stone-50 hover:bg-stone-100' : ''}`}
            >
              <i className={`fa-solid fa-star-and-crescent text-xs transition-transform group-hover:rotate-12 ${isIslamicOnly ? 'animate-pulse' : 'text-amber-500'}`}></i>
              <span className="relative z-10">Modest Collection</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>

          {/* Actions */}
          <div className={`flex items-center space-x-2 transition-colors duration-700 ${
            scrolled ? 'text-stone-800' : 'text-white'
          }`}>
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-stone-500/10 transition-colors group">
                <i className="fa-solid fa-search text-base group-hover:scale-110 transition-transform"></i>
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-stone-500/10 transition-colors group">
                <i className="fa-solid fa-user text-base group-hover:scale-110 transition-transform"></i>
            </button>
            <button className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg group ${
              isIslamicOnly ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-amber-600 hover:bg-stone-900 shadow-amber-600/20'
            } text-white`}>
              <i className="fa-solid fa-bag-shopping text-base group-hover:scale-110 transition-transform"></i>
              <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-4 ring-stone-900 transition-transform group-hover:scale-110">2</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
