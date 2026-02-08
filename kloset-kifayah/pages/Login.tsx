
import React, { useState } from 'react';
import { User } from '../types';
import { ChevronLeft, MapPin, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, onBack }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      const newUser: User = {
        id: 'new-' + Math.random().toString(36).substr(2, 9),
        username: username || 'new_collector',
        displayName: displayName || 'New Collector',
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
        location: location || 'Global',
        bio: 'Just joined Kloset Kifayah community.',
        followers: [],
        following: []
      };
      onLogin(newUser);
    } else {
      const demoUser = users.find(u => u.username === 'modest_muse') || users[0];
      onLogin(demoUser);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Simple reverse geocoding mock or placeholder
          // In a real app, you'd call a Geocoding API here
          const { latitude, longitude } = position.coords;
          // For demo purposes, we'll set a plausible string
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)} (Detected)`);
          
          // Optional: Fetch actual city name if an API key was available
          // const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=...`);
          // const data = await res.json();
          // setLocation(data.results[0].formatted_address);
        } catch (err) {
          console.error(err);
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
        alert("Location access denied. Please enter your location manually.");
      }
    );
  };

  return (
    <div className="min-h-screen w-full bg-beige flex flex-col items-center justify-center px-4 py-8 lg:py-12 relative overflow-y-auto">
      <button 
        onClick={isSignup ? () => setIsSignup(false) : onBack}
        className="fixed top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-espresso/40 hover:text-rose transition-colors z-50"
      >
        <ChevronLeft size={16} />
        {isSignup ? 'Back to Login' : 'Back'}
      </button>

      {/* Decorative Ribbon Accent */}
      <div className="fixed top-0 right-0 w-32 h-32 pointer-events-none opacity-20">
        <div className="absolute top-10 right-[-20px] w-48 h-[1px] bg-rose rotate-[45deg]"></div>
        <div className="absolute top-14 right-[-20px] w-48 h-[1px] bg-rose rotate-[45deg]"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-rose/10 p-8 lg:p-12 space-y-8 shadow-sm relative z-10 transition-all duration-500">
        <div className="text-center space-y-1 lg:space-y-2">
          <h1 className="text-[10px] lg:text-xs font-serif tracking-[0.5em] uppercase text-espresso/30">
            {isSignup ? 'Join The' : 'Welcome To'}
          </h1>
          <p className="text-espresso font-script text-5xl lg:text-6xl tracking-[0.05em] lowercase">kifayah</p>
          <div className="w-10 h-[1px] bg-rose mx-auto mt-4"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-espresso/60">Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-rose-light/10 border border-hairline px-4 py-3 text-sm focus:outline-none focus:border-rose transition-colors"
                    placeholder="Amina Khan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-espresso/60">Username</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-rose-light/10 border border-hairline px-4 py-3 text-sm focus:outline-none focus:border-rose transition-colors"
                    placeholder="amina_k"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-espresso/60">Your Location</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-rose-light/10 border border-hairline pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-rose transition-colors"
                    placeholder="City, Country"
                  />
                  <button 
                    type="button"
                    onClick={handleDetectLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-rose transition-colors"
                    title="Detect Current Location"
                  >
                    {isDetecting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  </button>
                </div>
                <p className="text-[8px] uppercase tracking-widest text-espresso/30 italic">Used for local trade and delivery estimates</p>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-espresso/60">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-rose-light/10 border border-hairline px-4 py-3 text-sm focus:outline-none focus:border-rose transition-colors"
              placeholder="amina@example.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-espresso/60">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-rose-light/10 border border-hairline px-4 py-3 text-sm focus:outline-none focus:border-rose transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-espresso text-white py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-rose transition-all shadow-md mt-4"
          >
            {isSignup ? 'Create Account' : 'Continue'}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-hairline"></div>
          <span className="flex-shrink mx-4 text-[9px] uppercase tracking-widest text-espresso/40">or</span>
          <div className="flex-grow border-t border-hairline"></div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => {
              // Simulating google login via existing submit logic
              const demoUser = users.find(u => u.username === 'modest_muse') || users[0];
              onLogin(demoUser);
            }}
            className="w-full border border-hairline py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-rose-light/40 transition-all flex items-center justify-center space-x-2"
          >
            <span>Continue with Google</span>
          </button>
          
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-center text-[10px] uppercase tracking-widest font-semibold text-rose hover:underline transition-all"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need an account? Create one'}
          </button>
        </div>
      </div>
      
      <footer className="mt-8 lg:mt-12 text-[10px] uppercase tracking-[0.2em] text-espresso/30 pb-4">
        Carefully curated modesty since 2024
      </footer>
    </div>
  );
};

export default Login;
