
import React, { useState } from 'react';
// Added missing MessageSquare to lucide-react imports
import { Send, Image, MoreHorizontal, ChevronLeft, Search, MessageSquare } from 'lucide-react';
import { User, MessageThread, Listing } from '../types';

interface MessagesProps {
  currentUser: User | null;
  users: User[];
  listings: Listing[];
}

const Messages: React.FC<MessagesProps> = ({ currentUser, users, listings }) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  // Mock threads
  const [threads, setThreads] = useState<MessageThread[]>([
    {
      id: 't1',
      listingId: 'l1',
      participantIds: ['u1', 'u2'],
      messages: [
        { id: 'm1', senderId: 'u2', text: "Hi! Is this still available?", createdAt: new Date().toISOString() },
        { id: 'm2', senderId: 'u1', text: "Yes it is! I can ship it today.", createdAt: new Date().toISOString() },
      ]
    },
    {
      id: 't2',
      listingId: 'l2',
      participantIds: ['u1', 'u3'],
      messages: [
        { id: 'm3', senderId: 'u3', text: "How long is the rental period?", createdAt: new Date().toISOString() },
      ]
    }
  ]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const otherParticipant = activeThread 
    ? users.find(u => u.id === activeThread.participantIds.find(pid => pid !== currentUser?.id))
    : null;
  const threadListing = activeThread ? listings.find(l => l.id === activeThread.listingId) : null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !currentUser) return;

    const newMessage = {
      id: 'm' + Date.now(),
      senderId: currentUser.id,
      text: inputText,
      createdAt: new Date().toISOString()
    };

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId ? { ...t, messages: [...t.messages, newMessage] } : t
    ));
    setInputText('');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 h-[calc(100vh-140px)]">
      <div className="bg-white border border-hairline h-full flex overflow-hidden">
        {/* Thread List */}
        <div className={`w-full lg:w-96 border-r border-hairline flex flex-col ${activeThreadId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-hairline space-y-4">
            <h2 className="text-xl font-serif uppercase tracking-widest">Messages</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
              <input 
                type="text" 
                placeholder="Search conversations" 
                className="w-full bg-beige border border-hairline pl-10 pr-4 py-2 text-[10px] uppercase tracking-widest focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto thin-scrollbar">
            {threads.map(thread => {
              const otherId = thread.participantIds.find(id => id !== currentUser?.id);
              const other = users.find(u => u.id === otherId);
              const listing = listings.find(l => l.id === thread.listingId);
              const lastMsg = thread.messages[thread.messages.length - 1];

              return (
                <div 
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-6 border-b border-hairline cursor-pointer transition-colors flex space-x-4 items-center ${
                    activeThreadId === thread.id ? 'bg-beige' : 'hover:bg-beige/50'
                  }`}
                >
                  <div className="w-12 h-12 bg-white border border-hairline overflow-hidden grayscale">
                    <img src={other?.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-bold uppercase tracking-widest truncate">{other?.displayName}</span>
                      <span className="text-[8px] text-espresso/40 uppercase">12m</span>
                    </div>
                    <p className="text-[10px] text-espresso/60 truncate mt-1">{lastMsg.text}</p>
                    <span className="inline-block mt-2 px-1.5 py-0.5 bg-espresso/5 border border-hairline text-[8px] uppercase tracking-widest text-espresso/40">
                      {listing?.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-grow flex flex-col ${!activeThreadId ? 'hidden lg:flex items-center justify-center bg-beige/30' : 'flex'}`}>
          {activeThreadId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 lg:p-6 border-b border-hairline flex items-center justify-between bg-white">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setActiveThreadId(null)} className="lg:hidden">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-beige border border-hairline overflow-hidden grayscale">
                      <img src={otherParticipant?.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase tracking-widest font-bold">{otherParticipant?.displayName}</span>
                      <span className="block text-[9px] uppercase tracking-widest text-forest">Online</span>
                    </div>
                  </div>
                </div>
                
                {threadListing && (
                  <div className="hidden md:flex items-center space-x-3 px-4 py-2 border border-hairline">
                    <div className="w-8 h-8 bg-beige overflow-hidden">
                      <img src={threadListing.photos[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest font-bold truncate max-w-[100px]">{threadListing.title}</span>
                      <span className="block text-[9px] font-serif font-bold text-rose">${threadListing.mode === 'buy' ? threadListing.priceBuy : threadListing.priceRentPerDay}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Feed */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 thin-scrollbar bg-beige/20">
                <div className="text-center">
                   <span className="text-[8px] uppercase tracking-[0.3em] text-espresso/40 px-4 py-1 border border-hairline bg-white">Conversation Started</span>
                </div>
                
                {activeThread?.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] lg:max-w-[60%] p-4 text-[12px] leading-relaxed border ${
                      msg.senderId === currentUser?.id 
                        ? 'bg-espresso text-white border-espresso' 
                        : 'bg-white text-espresso border-hairline'
                    }`}>
                      {msg.text}
                      <span className={`block text-[8px] mt-2 opacity-40 ${msg.senderId === currentUser?.id ? 'text-right' : 'text-left'}`}>
                        12:45 PM
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-6 border-t border-hairline bg-white">
                <div className="flex items-center space-x-4">
                  <button type="button" className="p-2 hover:bg-beige transition-colors text-espresso/40">
                    <Image size={20} strokeWidth={1.5} />
                  </button>
                  <div className="flex-grow relative">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full bg-beige border border-hairline px-6 py-4 text-sm focus:outline-none focus:border-rose transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={!inputText.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-rose disabled:text-espresso/20 transition-colors"
                    >
                      <Send size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 border border-hairline bg-white mx-auto flex items-center justify-center">
                <MessageSquare size={32} strokeWidth={1} className="text-espresso/20" />
              </div>
              <div>
                <h3 className="text-2xl font-serif uppercase tracking-widest text-espresso/40">Your Inbox</h3>
                <p className="text-[10px] uppercase tracking-widest text-espresso/20 mt-2">Select a conversation to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
