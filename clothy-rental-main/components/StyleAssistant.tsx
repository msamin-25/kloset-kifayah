
import React, { useState, useRef, useEffect } from 'react';
import { getFashionAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';

const StyleAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Salam! I am ClothyAI, your personal modest style consultant. Looking for the perfect rental or a pre-loved gem today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const aiResponse = await getFashionAdvice(userMsg, messages);
    
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-80 sm:w-96 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-stone-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
              </div>
              <span className="font-bold">ClothyAI Stylist</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-amber-400"><i className="fa-solid fa-times"></i></button>
          </div>
          
          <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-stone-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user' 
                  ? 'bg-amber-700 text-white rounded-tr-none' 
                  : 'bg-white border border-stone-200 text-stone-700 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-none px-4 py-2 text-sm italic">
                  Typing...
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-stone-100 flex space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for rental styling tips..."
              className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/20"
            />
            <button 
              onClick={handleSend}
              className="bg-stone-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-amber-700 transition"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-stone-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xl group-hover:rotate-12 transition-transform"></i>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </button>
      )}
    </div>
  );
};

export default StyleAssistant;
