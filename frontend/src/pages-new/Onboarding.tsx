
import React from 'react';

interface OnboardingProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ step, onNext, onSkip }) => {
  const content = [
    {
      title: "Discover Modesty",
      desc: "Browse a curated collection of high-quality abayas, hijabs, and more from a global community of modest fashion enthusiasts.",
      img: "https://picsum.photos/seed/on1/800/800"
    },
    {
      title: "Sustainable Style",
      desc: "Buy, sell, rent, or borrow. Our circular marketplace helps you refresh your wardrobe responsibly and beautifully.",
      img: "https://picsum.photos/seed/on2/800/800"
    },
    {
      title: "Community First",
      desc: "Connect with like-minded collectors and designers. Share your style and grow your modest presence.",
      img: "https://picsum.photos/seed/on3/800/800"
    }
  ];

  const current = content[step - 1];

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-6">
      <div className="bg-white border border-hairline w-full max-w-xl relative overflow-hidden">
        {/* Subtle Lace Border Decorative */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20"></div>

        <div className="p-8 lg:p-12 space-y-8">
          <div className="aspect-square bg-beige border border-hairline overflow-hidden">
            <img src={current.img} alt={current.title} className="w-full h-full object-cover grayscale-[0.5]" />
          </div>

          <div className="text-center space-y-4">
            <span className="font-script text-2xl text-espresso tracking-widest">Welcome</span>
            <h2 className="text-3xl font-serif uppercase tracking-widest">{current.title}</h2>
            <p className="text-sm text-espresso/60 leading-relaxed max-w-xs mx-auto">
              {current.desc}
            </p>
          </div>

          <div className="flex flex-col space-y-4 pt-4">
            <button 
              onClick={onNext}
              className="w-full bg-espresso text-white py-4 text-[10px] uppercase tracking-[0.3em] font-bold"
            >
              {step === 3 ? 'Get Started' : 'Continue'}
            </button>
            <div className="flex justify-between items-center px-2">
              <div className="flex space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 w-6 transition-all ${i === step ? 'bg-rose' : 'bg-hairline'}`}></div>
                ))}
              </div>
              <button onClick={onSkip} className="text-[10px] uppercase tracking-widest text-espresso/40 font-bold hover:text-espresso">
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
