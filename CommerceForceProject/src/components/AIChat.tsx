import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../context/BrandingContext';
import { Product } from '../shared/types';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export const AIChat = () => {
  const { config } = useBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
        
        // Add welcome message after products are loaded to ensure context is ready
        setMessages([{ 
          role: 'bot', 
          content: `Hi! I'm the ${config?.company_name || 'Store'} AI assistant. I can help you with questions about our products, pricing, or any of the services listed on our site. What can I help you with today?` 
        }]);
      } catch (err) {
        console.error('Failed to fetch products for AI context:', err);
      }
    };
    fetchProducts();
  }, [config?.company_name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const generateSystemInstruction = () => {
    const siteInfo = {
      companyName: config?.company_name || 'Our Store',
      heroTitle: config?.hero_title,
      heroSubtitle: config?.hero_subtitle,
      sections: config?.layout?.map((s: any) => ({
        type: s.type,
        title: s.config?.title,
        items: s.config?.items?.map((item: any) => ({
          title: item.title || item.q || item.name,
          content: item.body || item.a || item.text
        }))
      })),
      products: products.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        price: `${config?.currency_symbol || '£'}${p.base_price.toFixed(2)}`,
        attributes: p.attributes
      }))
    };

    return `You are a helpful AI assistant for ${siteInfo.companyName}. 
Your goal is to answer customer questions about our products and services based on the following website data:

WEBSITE CONTEXT:
- Hero Title: ${siteInfo.heroTitle}
- Hero Subtitle: ${siteInfo.heroSubtitle}
- Site Sections (FAQs, Content, etc.): ${JSON.stringify(siteInfo.sections)}

PRODUCT DATA:
${JSON.stringify(siteInfo.products)}

GUIDELINES:
1. Be polite, professional, and helpful.
2. Only answer based on the provided data. If you don't know the answer, say you don't have that information and suggest contacting support at ${config?.footer_email || 'our support email'}.
3. Do NOT hallucinate product details, features, or prices.
4. If a user asks about product availability or usage, use the descriptions and attributes provided.
5. Keep responses concise and relevant to ${siteInfo.companyName}.
6. Use markdown for formatting (bolding product names, using lists for features).
7. If asked about something not related to the store, politely redirect the user back to store-related topics.`;
  };

  const handleSend = async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      setMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, the AI assistant is not properly configured (API key missing). Please contact the site administrator." }]);
      return;
    }

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: generateSystemInstruction(),
          temperature: 0.7,
        },
      });

      const botResponse = response.text || "I'm sorry, I couldn't process that request. Please try again.";
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting to my brain right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[32px] border border-black/5 shadow-xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-6 bg-[var(--primary-color)] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold">AI Assistant</h3>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Powered by Gemini</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Bot size={48} />
              <div>
                <p className="font-bold">How can I help you today?</p>
                <p className="text-sm">Ask me about our products, pricing, or services.</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--primary-color)] text-white rounded-tr-none' 
                  : 'bg-white border border-black/5 text-black rounded-tl-none shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 size={18} className="animate-spin text-[var(--primary-color)]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-black/5">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[var(--primary-color)] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
