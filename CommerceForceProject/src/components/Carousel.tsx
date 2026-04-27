import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { CarouselImage } from '../shared/types';

interface CarouselProps {
  images: (string | CarouselImage)[];
  autoPlay?: boolean;
  interval?: number;
  height?: string;
  onNavigate?: (path: string) => void;
}

export const Carousel: React.FC<CarouselProps> = ({ 
  images, 
  autoPlay = true, 
  interval = 5000,
  height = "h-[500px]",
  onNavigate
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

    const normalizedImages: CarouselImage[] = images.map(img => {
      const data = typeof img === 'string' ? { url: img } : img;
      if (data.url && !data.url.startsWith('http') && !data.url.startsWith('/') && !data.url.startsWith('data:')) {
        data.url = `/${data.url}`;
      }
      return data;
    }).filter(img => img.url && img.url.trim() !== '');

  useEffect(() => {
    if (!autoPlay || normalizedImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
    }, interval);

    return () => clearInterval(timer);
  }, [normalizedImages.length, autoPlay, interval]);

  if (!normalizedImages || normalizedImages.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));

  const currentImage = normalizedImages[currentIndex];

  return (
    <div className={`relative w-full ${height} rounded-[40px] overflow-hidden group shadow-2xl`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <motion.img
            src={currentImage.url}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 bg-black/30" />
          
          {(currentImage.title || currentImage.subtitle) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              {currentImage.title && (
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
                >
                  {currentImage.title}
                </motion.h2>
              )}
              {currentImage.subtitle && (
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-white/80 max-w-2xl mb-8"
                >
                  {currentImage.subtitle}
                </motion.p>
              )}
              {currentImage.cta_text && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => currentImage.cta_link && onNavigate?.(currentImage.cta_link)}
                  className="px-8 py-4 bg-[var(--primary-color)] text-white rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-xl"
                >
                  {currentImage.cta_text}
                  <ArrowRight size={20} />
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {normalizedImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-10"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {normalizedImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white w-8' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
