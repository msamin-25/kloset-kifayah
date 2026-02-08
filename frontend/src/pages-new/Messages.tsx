import { useState, useEffect } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Conversation, Message } from '../types';

interface MessagesProps {
  currentUser: User;
  listings: any[];
  users: User[];
}

export default function Messages({ currentUser }: MessagesProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
                    *,
                    listing:listings(*),
                    messages(*)
                `)
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, [currentUser.id]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation,
      sender_id: currentUser.id,
      content: newMessage.trim()
    });

    if (!error) {
      setNewMessage('');
      // Refresh messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-rose border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-serif uppercase tracking-widest mb-8">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
        {/* Conversation List */}
        <div className="lg:col-span-1 border border-hairline bg-white">
          <div className="p-4 border-b border-hairline">
            <span className="text-[10px] uppercase tracking-widest font-bold text-espresso/60">
              {conversations.length} Conversations
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[11px] text-espresso/40">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 text-left hover:bg-beige transition-colors ${selectedConversation === conv.id ? 'bg-beige' : ''
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-beige border border-hairline overflow-hidden flex-shrink-0">
                      {conv.listing?.listing_images?.[0]?.image_url ? (
                        <img
                          src={conv.listing.listing_images[0].image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-espresso/40">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[11px] uppercase tracking-widest font-bold line-clamp-1">
                        {conv.listing?.title || 'Unknown Listing'}
                      </p>
                      <p className="text-[10px] text-espresso/40 line-clamp-1">
                        {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 border border-hairline bg-white flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 ${msg.sender_id === currentUser.id
                        ? 'bg-espresso text-white'
                        : 'bg-beige'
                      }`}>
                      <p className="text-[12px]">{msg.content}</p>
                      <p className="text-[8px] mt-1 opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-hairline flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow bg-beige border border-hairline px-4 py-3 text-[12px] focus:outline-none focus:border-rose transition-colors"
                />
                <button
                  type="submit"
                  className="bg-espresso text-white p-3 hover:bg-rose transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-[11px] text-espresso/40 uppercase tracking-widest">
                Select a conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
