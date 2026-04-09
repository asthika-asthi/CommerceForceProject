import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandingConfig } from '../shared/types';

interface BrandingContextType {
  config: BrandingConfig | null;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding');
      const data = await res.json();
      setConfig(data);
      applyBranding(data);
    } catch (err) {
      console.error('Failed to fetch branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyBranding = (config: BrandingConfig) => {
    if (!config) return;

    const root = document.documentElement;
    if (config.primary_color) {
      root.style.setProperty('--primary-color', config.primary_color);
      root.style.setProperty('--primary-color-light', `${config.primary_color}15`);
    }
    if (config.secondary_color) {
      root.style.setProperty('--secondary-color', config.secondary_color);
    }
    if (config.font_family) {
      root.style.setProperty('--font-family', config.font_family);
      document.body.style.fontFamily = `"${config.font_family}", sans-serif`;
    }

    // Apply Background
    if (config.background_style === 'solid') {
      document.body.style.background = config.background_value || '#F9F9F8';
    } else if (config.background_style === 'gradient') {
      document.body.style.background = config.background_value || 'linear-gradient(to bottom right, #F9F9F8, #FFFFFF)';
    } else if (config.background_style === 'image') {
      document.body.style.backgroundImage = `url(${config.background_value})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
    }

    // Favicon
    if (config.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.favicon_url;
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ config, isLoading, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
