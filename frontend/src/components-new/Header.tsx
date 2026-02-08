import { Search, LogOut } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-rose-light h-20">
      <div className="hidden lg:flex items-center justify-between h-full px-8 max-w-[1600px] mx-auto">
        <div
          className="cursor-pointer group flex items-baseline space-x-3"
          onClick={() => onNavigate('browse')}
        >
          <span className="text-[10px] font-serif tracking-[0.5em] uppercase text-espresso/40">Kloset</span>
          <span className="text-rose font-script text-4xl lowercase tracking-wider group-hover:text-espresso transition-colors">kifayah</span>
        </div>

        <nav className="flex space-x-12">
          <button
            onClick={() => onNavigate('browse')}
            className="uppercase tracking-[0.2em] text-[10px] font-semibold hover:text-rose transition-colors relative group"
          >
            Browse
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose group-hover:w-full transition-all"></span>
          </button>
          {currentUser && (
            <>
              <button
                onClick={() => onNavigate('post')}
                className="uppercase tracking-[0.2em] text-[10px] font-semibold hover:text-rose transition-colors relative group"
              >
                Post Listing
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose group-hover:w-full transition-all"></span>
              </button>
              <button
                onClick={() => onNavigate('messages')}
                className="uppercase tracking-[0.2em] text-[10px] font-semibold hover:text-rose transition-colors relative group"
              >
                Messages
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose group-hover:w-full transition-all"></span>
              </button>
              <button
                onClick={() => onNavigate('me')}
                className="uppercase tracking-[0.2em] text-[10px] font-semibold hover:text-rose transition-colors relative group"
              >
                Profile
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose group-hover:w-full transition-all"></span>
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-6">
          <button className="p-2 hover:bg-rose-light transition-colors text-espresso/70">
            <Search size={18} strokeWidth={1.5} />
          </button>
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogout}
                className="p-2 hover:bg-rose-light transition-colors text-espresso/70"
                title="Logout"
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
              <div
                className="w-8 h-8 bg-espresso/5 border border-rose/20 overflow-hidden cursor-pointer hover:border-rose transition-colors"
                onClick={() => onNavigate('me')}
              >
                <img
                  src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.full_name || currentUser.email}&background=f5f0eb&color=3d3229&size=40`}
                  alt={currentUser.full_name || ''}
                  className="w-full h-full object-cover grayscale hover:grayscale-0"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="bg-espresso text-white px-6 py-2 uppercase tracking-widest text-[10px] font-semibold hover:bg-rose transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between h-full px-6">
        <div className="flex items-baseline space-x-2" onClick={() => onNavigate('browse')}>
          <span className="text-[10px] font-serif tracking-widest uppercase text-espresso/40">Kloset</span>
          <span className="text-rose font-script text-3xl lowercase tracking-wider">kifayah</span>
        </div>
        <div className="flex items-center space-x-4">
          <Search size={20} strokeWidth={1.5} className="text-espresso/60" />
          {currentUser ? (
            <div
              className="w-8 h-8 bg-espresso/5 border border-hairline overflow-hidden"
              onClick={() => onNavigate('me')}
            >
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.full_name || 'User'}&background=f5f0eb&color=3d3229&size=40`}
                alt="Avatar"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="uppercase tracking-widest text-[10px] font-semibold text-rose hover:text-espresso transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Editorial Banner */}
      <div className="absolute -bottom-[2px] left-0 right-0 h-[1px] bg-rose/20"></div>

      <div className="absolute -bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-espresso text-white px-4 py-1 text-[8px] uppercase tracking-[0.3em] font-medium border border-rose shadow-sm">
          AI Verified Modest Fashion
        </div>
      </div>
    </header>
  );
}
