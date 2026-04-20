import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, HelpCircle, Search } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { STATIC_FAQS } from '../constants/faqData';

export const FAQ = () => {
  const { config } = useBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = STATIC_FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#141414]/40 mb-6"
        >
          <HelpCircle size={12} />
          Knowledge Base
        </motion.div>
        <h1 className="text-5xl font-serif italic text-[#141414] mb-6">Frequently Asked Questions</h1>
        <p className="text-sm opacity-60 max-w-xl mx-auto leading-relaxed">
          Everything you need to know about our products, services, and policies. Can't find what you're looking for? Reach out to our dedicated support team.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12 max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/20" size={18} />
        <input 
          type="text"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-2xl shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] transition-all text-sm"
        />
      </div>

      <div className="space-y-12">
        {filteredFaqs.map((category, catIdx) => (
          <div key={catIdx} className="space-y-6">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-[#141414]/30 border-b border-[#141414]/5 pb-4">
              {category.category}
            </h3>
            <div className="grid gap-3">
              {category.items.map((item, itemIdx) => {
                const id = `${catIdx}-${itemIdx}`;
                const isOpen = openItems.includes(id);
                return (
                  <div 
                    key={id}
                    className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${isOpen ? 'border-[#141414]/20 shadow-lg' : 'border-[#141414]/5 hover:border-[#141414]/10'}`}
                  >
                    <button 
                      onClick={() => toggleItem(id)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left group"
                    >
                      <span className={`text-sm font-bold tracking-tight transition-colors ${isOpen ? 'text-[var(--primary-color)]' : 'text-[#141414]'}`}>
                        {item.question}
                      </span>
                      <ChevronDown size={18} className={`text-[#141414]/30 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--primary-color)]' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-6 pb-6 text-sm leading-relaxed text-[#141414]/60 border-t border-[#141414]/5 pt-4 bg-[#f9f9f9]/50">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Support CTA */}
      <div className="mt-20 p-10 bg-[#141414] rounded-[32px] text-center text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
        <HelpCircle size={40} className="mx-auto mb-6 text-[var(--primary-color)] opacity-50" />
        <h3 className="text-2xl font-serif italic mb-4">Still have questions?</h3>
        <p className="text-sm opacity-60 mb-8 max-w-sm mx-auto tracking-wide"> Our team is ready to help you with any specific queries you may have.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/contact-us"
            className="px-8 py-3 bg-[var(--primary-color)] text-white text-xs font-mono uppercase tracking-[0.2em] font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--primary-color)]/20"
          >
            Contact Support
          </a>
          <a 
            href="/contact"
            className="px-8 py-3 bg-white/5 border border-white/10 text-white text-xs font-mono uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-white/10 transition-all"
          >
            Support Center
          </a>
        </div>
      </div>
    </div>
  );
};
