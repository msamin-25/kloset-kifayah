import { Home, Search, PlusSquare, MessageSquare, User, LogIn } from 'lucide-react';
import type { User as UserType } from '../types';

interface MobileNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  currentUser?: UserType | null;
}

export default function MobileNav({ activePage, onNavigate, currentUser }: MobileNavProps) {
  // Different nav items based on auth state
  const navItems = currentUser ? [
    { page: 'browse', icon: Home, label: 'Home' },
    { page: 'search', icon: Search, label: 'Search' },
    { page: 'post', icon: PlusSquare, label: 'Post' },
    { page: 'messages', icon: MessageSquare, label: 'Messages' },
    { page: 'me', icon: User, label: 'Profile' },
  ] : [
    { page: 'browse', icon: Home, label: 'Home' },
    { page: 'search', icon: Search, label: 'Search' },
    { page: 'login', icon: LogIn, label: 'Sign In' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-beige/95 backdrop-blur-sm border-t border-rose-light h-20 z-50">
      <div className="flex items-center justify-around h-full px-4 max-w-lg mx-auto">
        {navItems.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`flex flex-col items-center space-y-1 p-2 ${activePage === page ? 'text-rose' : 'text-espresso/40'
              }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-widest font-bold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
