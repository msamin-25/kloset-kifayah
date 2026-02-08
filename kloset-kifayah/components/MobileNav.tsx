
import React from 'react';
import { Home, PlusSquare, MessageSquare, User } from 'lucide-react';

interface MobileNavProps {
  activePage: string;
  onNavigate: (page: any) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activePage, onNavigate }) => {
  const tabs = [
    { id: 'browse', icon: Home, label: 'Browse' },
    { id: 'post', icon: PlusSquare, label: 'Post' },
    { id: 'messages', icon: MessageSquare, label: 'Chat' },
    { id: 'me', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-beige border-t border-hairline h-20 px-6 flex items-center justify-between z-50">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex flex-col items-center space-y-1 ${
            activePage === id ? 'text-rose' : 'text-espresso/40'
          }`}
        >
          <Icon size={22} strokeWidth={activePage === id ? 2 : 1.5} />
          <span className="text-[8px] uppercase tracking-widest font-bold">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
