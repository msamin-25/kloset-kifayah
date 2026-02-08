import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddressInput from '../components/AddressInput';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignup) {
        // Validate location
        if (!location) {
          setError('Please select your location');
          setIsLoading(false);
          return;
        }

        // Sign up with Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName,
              username: username,
            }
          }
        });

        if (signUpError) throw signUpError;

        // Check for duplicate email (Supabase returns user with empty identities, no session)
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return;
        }

        if (!data.session) {
          setError('Account created but could not sign in automatically. Please try signing in.');
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // Create/update profile with location using upsert (non-blocking)
          supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: displayName,
              username: username,
              location: location,
              latitude: latitude,
              longitude: longitude
            }, { onConflict: 'id' })
            .then(({ error: profileError }) => {
              if (profileError) {
                console.error('Profile upsert error:', profileError);
              }
            });

          onLogin();
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        onLogin();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (addr: string, lat?: number, lng?: number) => {
    setLocation(addr);
    setLatitude(lat);
    setLongitude(lng);
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

        {error && (
          <div className="bg-rose/10 border border-rose/30 text-rose text-[11px] px-4 py-3 rounded">
            {error}
          </div>
        )}



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
                <AddressInput
                  value={location}
                  onChange={handleLocationChange}
                  required
                />
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
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-espresso text-white py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-rose transition-all shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
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
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-center text-[10px] uppercase tracking-widest font-semibold text-rose hover:underline transition-all"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need an account? Create one'}
          </button>
        </div>
      </div>

      <footer className="mt-8 lg:mt-12 text-[10px] uppercase tracking-[0.2em] text-espresso/30 pb-4">
        Kloset Kifayah
      </footer>
    </div>
  );
}
