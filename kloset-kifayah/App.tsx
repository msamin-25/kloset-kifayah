
import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, MessageThread } from './types';
import { MOCK_USERS, MOCK_LISTINGS } from './mockData';
import Home from './pages/Home';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Profile from './pages/Profile';
import PostListing from './pages/PostListing';
import Messages from './pages/Messages';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import SparkleCursor from './components/SparkleCursor';

export type Page = 'home' | 'login' | 'onboarding' | 'browse' | 'listing' | 'profile' | 'me' | 'post' | 'messages';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [threads, setThreads] = useState<MessageThread[]>([]);

  // Navigation handlers
  const navigateToListing = (id: string) => {
    setActiveListingId(id);
    setCurrentPage('listing');
    window.scrollTo(0, 0);
  };

  const navigateToProfile = (username: string) => {
    setActiveUsername(username);
    setCurrentPage(username === currentUser?.username ? 'me' : 'profile');
    window.scrollTo(0, 0);
  };

  const navigateToMessages = (threadId?: string) => {
    if (threadId) setActiveThreadId(threadId);
    setCurrentPage('messages');
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.id.startsWith('new')) {
      setCurrentPage('onboarding');
    } else {
      setCurrentPage('browse');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleSaveListing = (listingId: string) => {
    if (!currentUser) return;
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        const isSaved = l.savedBy.includes(currentUser.id);
        return {
          ...l,
          savedBy: isSaved 
            ? l.savedBy.filter(id => id !== currentUser.id)
            : [...l.savedBy, currentUser.id]
        };
      }
      return l;
    }));
  };

  const handleFollowUser = (userId: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const isFollowing = u.followers.includes(currentUser.id);
        return {
          ...u,
          followers: isFollowing 
            ? u.followers.filter(id => id !== currentUser.id)
            : [...u.followers, currentUser.id]
        };
      }
      if (u.id === currentUser.id) {
        const isFollowing = u.following.includes(userId);
        return {
          ...u,
          following: isFollowing 
            ? u.following.filter(id => id !== userId)
            : [...u.following, userId]
        };
      }
      return u;
    }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onAuth={() => setCurrentPage('login')} />;
      case 'login':
        return <Login onLogin={handleLogin} users={users} onBack={() => setCurrentPage('home')} />;
      case 'onboarding':
        return <Onboarding step={onboardingStep} onNext={() => onboardingStep < 3 ? setOnboardingStep(s => s + 1) : setCurrentPage('browse')} onSkip={() => setCurrentPage('browse')} />;
      case 'browse':
        return (
          <Browse 
            listings={listings} 
            currentUser={currentUser} 
            users={users}
            onViewListing={navigateToListing}
            onToggleSave={handleSaveListing}
          />
        );
      case 'listing':
        const currentListing = listings.find(l => l.id === activeListingId);
        if (!currentListing) return <div>Listing not found</div>;
        const seller = users.find(u => u.id === currentListing.sellerId);
        return (
          <ListingDetail 
            listing={currentListing} 
            seller={seller} 
            onViewProfile={navigateToProfile} 
            onMessage={() => navigateToMessages()}
            onToggleSave={handleSaveListing}
            isSaved={currentUser ? currentListing.savedBy.includes(currentUser.id) : false}
            isOwnListing={currentUser?.id === currentListing.sellerId}
          />
        );
      case 'profile':
      case 'me':
        const targetUsername = currentPage === 'me' ? currentUser?.username : activeUsername;
        const profileUser = users.find(u => u.username === targetUsername);
        if (!profileUser) return <div>User not found</div>;
        return (
          <Profile 
            user={profileUser} 
            isMe={currentPage === 'me'} 
            listings={listings.filter(l => l.sellerId === profileUser.id)}
            savedListings={listings.filter(l => l.savedBy.includes(profileUser.id))}
            onViewListing={navigateToListing}
            onFollow={() => handleFollowUser(profileUser.id)}
            isFollowing={currentUser ? profileUser.followers.includes(currentUser.id) : false}
          />
        );
      case 'post':
        return (
          <PostListing 
            onSubmit={(newListing) => {
              setListings([newListing, ...listings]);
              navigateToListing(newListing.id);
            }} 
            currentUser={currentUser} 
          />
        );
      case 'messages':
        return <Messages currentUser={currentUser} listings={listings} users={users} />;
      default:
        return <Home onAuth={() => setCurrentPage('login')} />;
    }
  };

  const showShell = currentPage !== 'login' && currentPage !== 'onboarding' && currentPage !== 'home';

  return (
    <div className="flex flex-col min-h-screen w-full">
      <SparkleCursor />
      {showShell && (
        <Header 
          currentUser={currentUser} 
          onNavigate={(page) => {
            if (page === 'me') navigateToProfile(currentUser?.username || '');
            else setCurrentPage(page);
          }} 
          onLogout={handleLogout}
        />
      )}
      
      <main className={`flex-grow flex flex-col w-full ${showShell ? 'pb-24 lg:pb-0 pt-20' : ''}`}>
        {renderPage()}
      </main>

      {showShell && (
        <MobileNav 
          activePage={currentPage}
          onNavigate={(page) => {
            if (page === 'me') navigateToProfile(currentUser?.username || '');
            else setCurrentPage(page);
          }} 
        />
      )}
    </div>
  );
};

export default App;
