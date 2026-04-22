import React, { useState } from 'react';
import { ElementStyles, ResponsiveStyles, ComponentStyles } from '../../shared/types';
import { Monitor, Tablet, Smartphone, Palette, Type, Layout, Grid as GridIcon, Image as ImageIcon, Trash2, RotateCcw } from 'lucide-react';

interface StyleEditorProps {
  styles: ComponentStyles;
  onChange: (styles: ComponentStyles) => void;
  showGridOptions?: boolean;
}

type Viewport = 'mobile' | 'tablet' | 'desktop';

export const StyleEditor: React.FC<StyleEditorProps> = ({ styles, onChange, showGridOptions }) => {
  const [activeViewport, setActiveViewport] = useState<Viewport>('desktop');
  const [activeCategory, setActiveCategory] = useState<'container' | 'title' | 'subtitle' | 'button' | 'card' | 'grid'>('container');

  const updateStyle = (category: keyof ComponentStyles, field: keyof ElementStyles, value: any) => {
    const newStyles = { ...styles };
    if (!newStyles[category]) newStyles[category] = {};
    const categoryStyles = newStyles[category] as ResponsiveStyles;
    
    if (!categoryStyles[activeViewport]) categoryStyles[activeViewport] = {};
    (categoryStyles[activeViewport] as any)[field] = value;
    
    onChange(newStyles);
  };

  const updateGrid = (field: string, value: any) => {
    const newStyles = { ...styles };
    if (!newStyles.grid) newStyles.grid = {};
    if (!newStyles.grid[activeViewport]) newStyles.grid[activeViewport] = {};
    (newStyles.grid[activeViewport] as any)[field] = value;
    onChange(newStyles);
  };

  const getStyleValue = (category: keyof ComponentStyles, field: keyof ElementStyles) => {
    const categoryStyles = styles[category] as ResponsiveStyles;
    return categoryStyles?.[activeViewport]?.[field] ?? '';
  };

  const getGridValue = (field: string) => {
    return styles.grid?.[activeViewport]?.[field] ?? '';
  };

  const ViewportButton = ({ type, icon: Icon }: { type: Viewport, icon: any }) => (
    <button
      onClick={() => setActiveViewport(type)}
      className={`p-2 rounded-lg transition-all ${activeViewport === type ? 'bg-black text-white' : 'hover:bg-black/5'}`}
      title={type.charAt(0).toUpperCase() + type.slice(1)}
    >
      <Icon size={18} />
    </button>
  );

  const CategoryButton = ({ id, label, icon: Icon }: { id: typeof activeCategory, label: string, icon: any }) => (
    <button
      onClick={() => setActiveCategory(id)}
      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
        activeCategory === id ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="space-y-6 bg-white border border-black/10 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-4">
          <h4 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
            <Palette size={18} className="text-blue-600" /> Advanced Styles
          </h4>
          <div className="h-4 w-px bg-black/10" />
          <div className="flex gap-1">
            <ViewportButton type="desktop" icon={Monitor} />
            <ViewportButton type="tablet" icon={Tablet} />
            <ViewportButton type="mobile" icon={Smartphone} />
          </div>
        </div>
        <button 
          onClick={() => onChange({})}
          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
        >
          <RotateCcw size={12} /> Reset Section Styles
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryButton id="container" label="Container" icon={Layout} />
        <CategoryButton id="title" label="Title" icon={Type} />
        <CategoryButton id="subtitle" label="Subtitle" icon={Type} />
        <CategoryButton id="button" label="Button" icon={Palette} />
        <CategoryButton id="card" label="Cards" icon={Layout} />
        {showGridOptions && <CategoryButton id="grid" label="Grid" icon={GridIcon} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {activeCategory !== 'grid' ? (
          <>
            {/* Colors */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Colors & Bg</h5>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={getStyleValue(activeCategory, 'textColor') || '#000000'}
                    onChange={e => updateStyle(activeCategory, 'textColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getStyleValue(activeCategory, 'textColor')}
                    onChange={e => updateStyle(activeCategory, 'textColor', e.target.value)}
                    className="flex-1 bg-black/5 px-3 rounded-lg text-xs font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={getStyleValue(activeCategory, 'backgroundColor') || '#ffffff'}
                    onChange={e => updateStyle(activeCategory, 'backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getStyleValue(activeCategory, 'backgroundColor')}
                    onChange={e => updateStyle(activeCategory, 'backgroundColor', e.target.value)}
                    className="flex-1 bg-black/5 px-3 rounded-lg text-xs font-mono"
                    placeholder="transparent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Bg Image URL</label>
                <input
                  type="text"
                  value={getStyleValue(activeCategory, 'backgroundImage')}
                  onChange={e => updateStyle(activeCategory, 'backgroundImage', e.target.value)}
                  className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Typography</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold opacity-60">Font Size (px)</label>
                  <input
                    type="number"
                    value={getStyleValue(activeCategory, 'fontSize')}
                    onChange={e => updateStyle(activeCategory, 'fontSize', parseInt(e.target.value))}
                    className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold opacity-60">Weight</label>
                  <select
                    value={getStyleValue(activeCategory, 'fontWeight')}
                    onChange={e => updateStyle(activeCategory, 'fontWeight', e.target.value)}
                    className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                  >
                    <option value="">Default</option>
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra Bold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Text Align</label>
                <select
                  value={getStyleValue(activeCategory, 'textAlign')}
                  onChange={e => updateStyle(activeCategory, 'textAlign', e.target.value)}
                  className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                >
                  <option value="">Default</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Spacing (Padding / Margin)</h5>
              <div className="grid grid-cols-2 gap-2">
                {['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'].map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[8px] font-bold opacity-40 uppercase">{field}</label>
                    <input
                      type="number"
                      value={getStyleValue(activeCategory, field as any)}
                      onChange={e => updateStyle(activeCategory, field as any, parseInt(e.target.value))}
                      className="w-full bg-black/5 px-2 py-1 rounded text-xs font-bold"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Border Radius (px)</label>
                <input
                  type="number"
                  value={getStyleValue(activeCategory, 'borderRadius')}
                  onChange={e => updateStyle(activeCategory, 'borderRadius', parseInt(e.target.value))}
                  className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Grid specific options */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Grid Layout</h5>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={getGridValue('columns')}
                  onChange={e => updateGrid('columns', parseInt(e.target.value))}
                  className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-60">Gap (px)</label>
                <input
                  type="number"
                  value={getGridValue('gap')}
                  onChange={e => updateGrid('gap', parseInt(e.target.value))}
                  className="w-full bg-black/5 px-3 py-2 rounded-lg text-xs font-bold"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
