import { ArrowRight } from 'lucide-react';
import heroImage from '../assets/hero.png';

interface HomeProps {
  onBrowse: () => void;  // Go to browse page without auth
  onAuth: () => void;    // Go to login/signup
}

export default function Home({ onBrowse, onAuth }: HomeProps) {
  return (
    <div className="min-h-screen w-full bg-beige flex flex-col relative overflow-hidden">
      {/* Decorative background touches */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-rose/10 blur-[140px] rounded-full"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-rose/5 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-forest/5 blur-[120px] rounded-full"></div>

      {/* Hero Content */}
      <div className="flex-grow flex flex-col lg:flex-row items-center justify-center max-w-[1400px] mx-auto px-6 lg:px-12 py-10 lg:py-0 gap-10 lg:gap-20 w-full">

        {/* Editorial Image Side */}
        <div className="w-full lg:w-1/2 relative group max-w-md lg:max-w-none">
          <div className="aspect-[3/4] bg-white border border-rose/20 p-3 lg:p-5 relative z-10 overflow-hidden shadow-sm transition-all group-hover:border-rose/40">
            <img
              src={heroImage}
              alt="Kloset Kifayah"
              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 ease-in-out"
            />
            {/* Lace Detail Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 border-[15px] border-double border-white/40"></div>
          </div>

          {/* Ribbon Accents */}
          <div className="absolute top-10 -left-6 w-24 h-1 bg-rose/30 -rotate-[25deg] z-0"></div>
          <div className="absolute bottom-20 -right-6 w-24 h-1 bg-rose/20 rotate-[15deg] z-0"></div>
        </div>

        {/* Text and Actions Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:space-y-12">
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-espresso leading-none flex flex-col">
              <span className="text-2xl md:text-3xl lg:text-4xl font-serif uppercase tracking-[0.5em] opacity-60">Kloset</span>
              <span className="font-script lowercase tracking-[0.05em] text-6xl md:text-7xl lg:text-9xl mt-[-8px] lg:mt-[-24px] animate-gradient-text drop-shadow-sm">kifayah</span>
            </h1>
            <div className="w-20 h-[1px] bg-rose mx-auto lg:mx-0 lg:mt-6"></div>
            <p className="text-xs md:text-sm lg:text-base text-espresso/70 max-w-md leading-relaxed tracking-wide font-light lg:pt-8">
              Your community marketplace for modest fashion.
              Rent, buy, and borrow curated Islamic clothing with AI-powered modesty verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full max-w-sm lg:max-w-none">
            <button
              onClick={onBrowse}
              className="group flex-grow animate-gradient-bg text-white py-4 lg:py-5 px-8 lg:px-10 text-[10px] uppercase tracking-[0.3em] font-bold transition-all flex items-center justify-center gap-3 border border-espresso"
            >
              Start Browsing
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onAuth}
              className="flex-grow border border-rose/30 bg-white text-espresso py-4 lg:py-5 px-8 lg:px-10 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-rose-light transition-all"
            >
              Join Community
            </button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 lg:pt-10 border-t border-hairline w-full">
            <div className="space-y-1 lg:space-y-2">
              <span className="block text-[8px] uppercase tracking-[0.2em] font-bold text-rose">AI Verified</span>
              <span className="block text-[9px] lg:text-[10px] uppercase tracking-widest font-bold">Modest Only</span>
            </div>
            <div className="space-y-1 lg:space-y-2">
              <span className="block text-[8px] uppercase tracking-[0.2em] font-bold text-rose">Local</span>
              <span className="block text-[9px] lg:text-[10px] uppercase tracking-widest font-bold">Community Based</span>
            </div>
            <div className="space-y-1 lg:space-y-2">
              <span className="block text-[8px] uppercase tracking-[0.2em] font-bold text-rose">Flexible</span>
              <span className="block text-[9px] lg:text-[10px] uppercase tracking-widest font-bold">Rent • Buy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Marquee */}
      <div className="py-6 lg:py-8 border-t border-hairline opacity-40 select-none bg-rose-light/20">
        <div className="flex whitespace-nowrap overflow-hidden gap-8 lg:gap-12">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="text-[9px] lg:text-[10px] uppercase tracking-[0.5em] font-bold text-rose">
              Kloset Kifayah • Modest Fashion Marketplace •
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
