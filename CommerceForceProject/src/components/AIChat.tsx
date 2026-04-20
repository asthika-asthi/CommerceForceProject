import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../context/BrandingContext';
import { Product } from '../shared/types';
import { STATIC_FAQS } from '../constants/faqData';

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
          content: `Hi! I'm the ${config?.company_name || 'Store'} AI assistant. I can help you with questions about our products, pricing, or any of our site services. What can I help you with today?` 
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
  }, [messages, isOpen]);

  const generateSystemInstruction = () => {
    const siteInfo = {
      companyName: config?.company_name || 'Our Store',
      heroTitle: config?.hero_title,
      heroSubtitle: config?.hero_subtitle,
      generalFaqs: STATIC_FAQS,
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

    return `You are a highly intelligent and helpful AI Brand Ambassador for ${siteInfo.companyName}. 
Your goal is to provide exceptional customer service by answering questions about our products, services, and company policies based on the specific website data provided below.

WEBSITE CONTEXT:
- Brand Mission: ${siteInfo.heroTitle} - ${siteInfo.heroSubtitle}
- General Polices & FAQs: ${JSON.stringify(siteInfo.generalFaqs)}
- Site Knowledge Base (Specific Sections): ${JSON.stringify(siteInfo.sections)}

PRODUCT CATALOGUE:
${JSON.stringify(siteInfo.products)}

INTERACTION GUIDELINES:
1. CUSTOMER FOCUS: Be polite, professional, and enthusiastically represent ${siteInfo.companyName}.
2. ACCURACY: Only answer based on the provided data. If asked about a product or policy not in the context, check the FAQs in the context. If still unknown, say: "I don't have specific details on that right now, but I'd be happy to connect you with our human support team at ${config?.footer_email || 'our support email'}."
3. NO HALLUCINATIONS: Never invent features, prices, or specifications that aren't explicitly listed in the PRODUCT DATA.
4. PRODUCT EXPERTISE: When asked about a product, mention its price, category, and key features. Use the 'attributes' field to provide technical details.
5. FORMATTING: Use clear Markdown. Use **bold** for product names and prices. Use bulleted lists for feature breakdowns.
6. CONTEXTUAL AWARENESS: If a user asks general business questions (e.g., shipping, returns), refer to the 'Site Knowledge Base' provided in the context.
7. SCOPE: Maintain focus on ${siteInfo.companyName}. If a user tries to discuss unrelated topics, politely bring the conversation back to how you can help them with your company's offerings.`;
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
        model: "gemini-1.5-flash",
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
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-[var(--primary-color)] text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare size={24} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--primary-color)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-28 right-8 z-[100] w-[400px] max-w-[calc(100vw-4rem)] bg-white rounded-[32px] border border-black/5 shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[calc(100vh-10rem)]"
          >
            {/* Header */}
            <div className="p-6 bg-[var(--primary-color)] text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold">AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Online & Ready</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar"
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
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[var(--primary-color)] text-white rounded-tr-none shadow-md shadow-[var(--primary-color)]/20' 
                      : 'bg-white border border-black/5 text-black rounded-tl-none shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-1 h-1 bg-[var(--primary-color)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1 h-1 bg-[var(--primary-color)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1 h-1 bg-[var(--primary-color)] rounded-full animate-bounce" />
                    </div>
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
                  className="flex-1 bg-gray-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-[var(--primary-color)] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary-color)]/20"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[10px] text-center text-black/30 mt-3 font-medium">
                AI can make mistakes. Please verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
