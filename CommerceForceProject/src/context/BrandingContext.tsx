import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

  const fetchBranding = useCallback(async () => {
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
  }, []);

  const applyBranding = (config: BrandingConfig) => {
    if (!config) return;

    const root = document.documentElement;
    const primary = config.primary_color || '#1A56DB';
    const secondary = config.secondary_color || '#4B5563';

    root.style.fontSize = `${config.base_font_size || 16}px`;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-color-light', `${primary}15`);
    
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--secondary-color-light', `${secondary}15`);

    if (config.font_family) {
      root.style.setProperty('--font-family', config.font_family);
      document.body.style.fontFamily = `"${config.font_family}", sans-serif`;
    }

    // Apply Font Sizes
    root.style.setProperty('--base-font-size', `${config.base_font_size || 16}px`);
    root.style.setProperty('--hero-font-size', `${config.hero_font_size || 48}px`);
    root.style.setProperty('--heading-font-size', `${config.heading_font_size || 32}px`);
    root.style.setProperty('--content-font-size', `${config.content_font_size || 16}px`);

    // Navigation Customization
    root.style.setProperty('--nav-font-family', config.nav_font_family || config.font_family || 'Inter');
    root.style.setProperty('--nav-text-color', config.nav_text_color || '#141414');
    root.style.setProperty('--sidebar-font-size', `${config.sidebar_font_size || 14}px`);
    root.style.setProperty('--sidebar-font-weight', config.sidebar_font_weight || '500');
    root.style.setProperty('--top-nav-font-size', `${config.top_nav_font_size || 12}px`);
    root.style.setProperty('--top-nav-font-weight', config.top_nav_font_weight || '500');
    root.style.setProperty('--nav-heading-color', config.nav_heading_color || config.secondary_color || '#4B5563');
    root.style.setProperty('--nav-heading-font-weight', config.nav_heading_font_weight || '700');

    // Apply Background
    document.body.style.backgroundColor = '';
    document.body.style.backgroundImage = '';
    document.body.style.background = '';

    if (config.background_style === 'solid') {
      document.body.style.backgroundColor = config.background_value || '#F9F9F8';
    } else if (config.background_style === 'gradient') {
      document.body.style.background = config.background_value || 'linear-gradient(to bottom right, #F9F9F8, #FFFFFF)';
    } else if (config.background_style === 'image') {
      document.body.style.backgroundImage = `url(${config.background_value})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    } else {
      document.body.style.backgroundColor = '#F9F9F8';
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

    // Dynamic Title
    if (config.company_name) {
      document.title = config.company_name;
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    if (config) {
      applyBranding(config);
    }
  }, [config]);

  const contextValue = useMemo(() => ({ 
    config, 
    isLoading, 
    refreshBranding: fetchBranding 
  }), [config, isLoading, fetchBranding]);

  return (
    <BrandingContext.Provider value={contextValue}>
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
