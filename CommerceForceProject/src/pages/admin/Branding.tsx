import React, { useEffect, useState, useRef } from 'react';
import { BrandingConfig, LayoutSection } from '../../shared/types';
import { Save, Globe, Palette, Type, Upload, Loader2, Layout, Image as ImageIcon, MousePointer2, Layers, MessageSquare, HelpCircle, Star, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Tab = 'identity' | 'visuals' | 'hero' | 'sections' | 'footer';

export const Branding = () => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [layout, setLayout] = useState<LayoutSection[]>([]);
  
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/branding', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.layout_config) {
          try {
            setLayout(JSON.parse(data.layout_config));
          } catch (e) {
            setLayout([]);
          }
        }
      });
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        layout_config: JSON.stringify(layout)
      };
      await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig),
      });
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to save branding:', err);
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: LayoutSection['type']) => {
    const newSection: LayoutSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      enabled: true,
      config: getDefaultConfig(type)
    };
    setLayout([...layout, newSection]);
  };

  const getDefaultConfig = (type: LayoutSection['type']) => {
    switch (type) {
      case 'features': return { title: 'Our Features', items: [{ title: 'Fast', desc: 'Very fast' }] };
      case 'promotions': return { title: 'Seasonal Sale', subtitle: 'Up to 50% off on all electronics', buttonText: 'Shop Sale', link: '/products', variant: 'dark', tag: 'Limited Time' };
      case 'content': return { title: 'About Us', body: 'We are a great company.' };
      case 'testimonials': return { title: 'What Clients Say', items: [{ name: 'John Doe', text: 'Amazing!' }] };
      case 'faq': return { title: 'FAQ', items: [{ q: 'How?', a: 'Like this.' }] };
      case 'cta': return { title: 'Ready?', buttonText: 'Get Started', link: '/products' };
      default: return {};
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setLayout(newLayout);
  };

  const removeSection = (id: string) => {
    setLayout(layout.filter(s => s.id !== id));
  };

  if (!config) return null;

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
        activeTab === id 
          ? 'bg-[#141414] text-white shadow-lg' 
          : 'bg-white text-[#141414]/60 hover:bg-gray-50 border border-black/5'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl pb-20">
      <div className="flex flex-wrap gap-3 mb-8">
        <TabButton id="identity" label="Identity" icon={Globe} />
        <TabButton id="visuals" label="Visuals" icon={Palette} />
        <TabButton id="hero" label="Hero" icon={ImageIcon} />
        <TabButton id="sections" label="Sections" icon={Layers} />
        <TabButton id="footer" label="Footer" icon={Layout} />
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {activeTab === 'identity' && (
          <div className="border border-[#141414] p-8 space-y-6 bg-white/50 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
              <Type size={18} className="text-blue-600" />
              <h3 className="font-bold text-xl uppercase tracking-tight">Identity & Typography</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Company Name</label>
                <input
                  type="text"
                  value={config.company_name}
                  onChange={e => setConfig({ ...config, company_name: e.target.value })}
                  className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Font Family</label>
                <select
                  value={config.font_family || 'Inter'}
                  onChange={e => setConfig({ ...config, font_family: e.target.value })}
                  className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="Inter">Inter (Modern Sans)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="Outfit">Outfit (Geometric)</option>
                  <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Logos & Favicon</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Logo URL"
                    value={config.logo_url || ''}
                    onChange={e => setConfig({ ...config, logo_url: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Favicon URL"
                    value={config.favicon_url || ''}
                    onChange={e => setConfig({ ...config, favicon_url: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="border border-[#141414] p-8 space-y-6 bg-white/50 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={18} className="text-blue-600" />
              <h3 className="font-bold text-xl uppercase tracking-tight">Visual Style</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-full h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Secondary Color</label>
                    <input
                      type="color"
                      value={config.secondary_color || '#000000'}
                      onChange={e => setConfig({ ...config, secondary_color: e.target.value })}
                      className="w-full h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Button Style</label>
                  <div className="flex gap-4">
                    {['rounded', 'square', 'pill'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setConfig({ ...config, button_style: style as any })}
                        className={`flex-1 py-3 border rounded-xl text-sm font-bold capitalize transition-all ${
                          config.button_style === style ? 'bg-black text-white border-black' : 'bg-white border-black/10'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Background Style</label>
                  <select
                    value={config.background_style || 'solid'}
                    onChange={e => setConfig({ ...config, background_style: e.target.value as any })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Background Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Background Value</label>
                  <input
                    type="text"
                    placeholder={config.background_style === 'image' ? 'Image URL' : config.background_style === 'gradient' ? 'linear-gradient(...)' : 'Hex Color'}
                    value={config.background_value || ''}
                    onChange={e => setConfig({ ...config, background_value: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="border border-[#141414] p-8 space-y-6 bg-white/50 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={18} className="text-blue-600" />
              <h3 className="font-bold text-xl uppercase tracking-tight">Hero Section</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Headline</label>
                  <input
                    type="text"
                    value={config.hero_title || ''}
                    onChange={e => setConfig({ ...config, hero_title: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Tagline</label>
                  <textarea
                    value={config.hero_subtitle || ''}
                    onChange={e => setConfig({ ...config, hero_subtitle: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Hero Media URL (Image/Video)</label>
                  <input
                    type="text"
                    value={config.hero_image_url || ''}
                    onChange={e => setConfig({ ...config, hero_image_url: e.target.value })}
                    className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">CTA Button Text</label>
                    <input
                      type="text"
                      value={config.hero_cta_text || ''}
                      onChange={e => setConfig({ ...config, hero_cta_text: e.target.value })}
                      className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">CTA Button Link</label>
                    <input
                      type="text"
                      value={config.hero_cta_link || ''}
                      onChange={e => setConfig({ ...config, hero_cta_link: e.target.value })}
                      className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <h3 className="font-bold text-xl uppercase tracking-tight">Page Layout</h3>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => addSection('features')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add Features</button>
                <button type="button" onClick={() => addSection('products')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add Products</button>
                <button type="button" onClick={() => addSection('promotions')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add Promo</button>
                <button type="button" onClick={() => addSection('content')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add Content</button>
                <button type="button" onClick={() => addSection('testimonials')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add Testimonials</button>
                <button type="button" onClick={() => addSection('faq')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add FAQ</button>
                <button type="button" onClick={() => addSection('cta')} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Add CTA</button>
              </div>
            </div>

            <div className="space-y-4">
              {layout.map((section, index) => (
                <div key={section.id} className="border border-[#141414] p-6 bg-white/50 rounded-2xl shadow-sm flex gap-6">
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => moveSection(index, 'up')} className="p-1 hover:bg-black/5 rounded"><ChevronUp size={16} /></button>
                    <div className="flex-1 flex items-center justify-center text-black/20"><GripVertical size={16} /></div>
                    <button type="button" onClick={() => moveSection(index, 'down')} className="p-1 hover:bg-black/5 rounded"><ChevronDown size={16} /></button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black text-white rounded">{section.type}</span>
                        <input
                          type="text"
                          value={section.config.title || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.title = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="font-bold text-sm bg-transparent border-none focus:outline-none"
                          placeholder="Section Title"
                        />
                      </div>
                      <button type="button" onClick={() => removeSection(section.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 size={16} /></button>
                    </div>

                    {section.type === 'promotions' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={section.config.subtitle || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.subtitle = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Subtitle"
                        />
                        <input
                          type="text"
                          value={section.config.tag || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.tag = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Tag (e.g. Limited Time)"
                        />
                        <input
                          type="text"
                          value={section.config.buttonText || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.buttonText = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Button Text"
                        />
                        <input
                          type="text"
                          value={section.config.link || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.link = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Button Link"
                        />
                        <select
                          value={section.config.variant || 'dark'}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.variant = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                        >
                          <option value="dark">Dark Variant</option>
                          <option value="light">Light Variant</option>
                        </select>
                        <input
                          type="text"
                          value={section.config.image || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.image = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Image URL"
                        />
                      </div>
                    )}

                    {section.type === 'content' && (
                      <textarea
                        value={section.config.body || ''}
                        onChange={e => {
                          const newLayout = [...layout];
                          newLayout[index].config.body = e.target.value;
                          setLayout(newLayout);
                        }}
                        className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm focus:outline-none min-h-[100px]"
                        placeholder="Content body..."
                      />
                    )}

                    {section.type === 'cta' && (
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={section.config.buttonText || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.buttonText = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Button Text"
                        />
                        <input
                          type="text"
                          value={section.config.link || ''}
                          onChange={e => {
                            const newLayout = [...layout];
                            newLayout[index].config.link = e.target.value;
                            setLayout(newLayout);
                          }}
                          className="w-full bg-white border border-[#141414]/10 px-4 py-3 rounded-xl text-sm"
                          placeholder="Button Link"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {layout.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-black/5 rounded-[40px] opacity-40">
                  No custom sections added yet.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end sticky bottom-8 z-10">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-10 py-4 bg-[#141414] text-[#E4E3E0] rounded-2xl font-bold hover:bg-black transition-all shadow-2xl disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving Changes...' : 'Publish Branding'}
          </button>
        </div>
      </form>
    </div>
  );
};
