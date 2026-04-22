import { useState, useEffect } from 'react';
import { ResponsiveStyles, ElementStyles } from '../shared/types';

export const useResponsiveStyle = (responsiveStyles?: ResponsiveStyles) => {
  const [screen, setScreen] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setScreen('mobile');
      else if (window.innerWidth < 1024) setScreen('tablet');
      else setScreen('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!responsiveStyles) return {};

  const base = responsiveStyles.desktop || {};
  const current = screen === 'mobile' ? responsiveStyles.mobile : 
                  screen === 'tablet' ? responsiveStyles.tablet : 
                  responsiveStyles.desktop;

  // Merge with desktop as base
  const combined: ElementStyles = { ...base, ...current };
  
  return {
    color: combined.textColor,
    backgroundColor: combined.backgroundColor,
    backgroundImage: combined.backgroundImage ? `url(${combined.backgroundImage})` : undefined,
    backgroundPosition: combined.backgroundPosition,
    backgroundSize: combined.backgroundSize,
    backgroundRepeat: combined.backgroundRepeat,
    fontSize: typeof combined.fontSize === 'number' ? `${combined.fontSize}px` : combined.fontSize,
    fontWeight: combined.fontWeight,
    fontFamily: combined.fontFamily,
    paddingTop: typeof combined.paddingTop === 'number' ? `${combined.paddingTop}px` : combined.paddingTop,
    paddingRight: typeof combined.paddingRight === 'number' ? `${combined.paddingRight}px` : combined.paddingRight,
    paddingBottom: typeof combined.paddingBottom === 'number' ? `${combined.paddingBottom}px` : combined.paddingBottom,
    paddingLeft: typeof combined.paddingLeft === 'number' ? `${combined.paddingLeft}px` : combined.paddingLeft,
    marginTop: typeof combined.marginTop === 'number' ? `${combined.marginTop}px` : combined.marginTop,
    marginRight: typeof combined.marginRight === 'number' ? `${combined.marginRight}px` : combined.marginRight,
    marginBottom: typeof combined.marginBottom === 'number' ? `${combined.marginBottom}px` : combined.marginBottom,
    marginLeft: typeof combined.marginLeft === 'number' ? `${combined.marginLeft}px` : combined.marginLeft,
    borderRadius: typeof combined.borderRadius === 'number' ? `${combined.borderRadius}px` : combined.borderRadius,
    borderWidth: typeof combined.borderWidth === 'number' ? `${combined.borderWidth}px` : combined.borderWidth,
    borderColor: combined.borderColor,
    textAlign: combined.textAlign,
    display: combined.display,
    opacity: combined.opacity,
    gap: typeof combined.gap === 'number' ? `${combined.gap}px` : combined.gap,
  };
};
