import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

export const Carousel: React.FC<CarouselProps> = ({ 
  images, 
  autoPlay = true, 
  interval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const validImages = images.filter(img => img && img.trim() !== '');

  useEffect(() => {
    if (!autoPlay || validImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    }, interval);

    return () => clearInterval(timer);
  }, [validImages.length, autoPlay, interval]);

  if (!validImages || validImages.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));

  return (
    <div className="relative w-full h-[500px] rounded-[40px] overflow-hidden group shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={validImages[currentIndex]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-black/20" />

      {validImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {validImages.map((_, i) => (
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
