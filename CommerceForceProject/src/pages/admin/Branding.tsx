import React, { useEffect, useState, useRef } from 'react';
import { BrandingConfig } from '../../shared/types';
import { Save, Globe, Palette, Type, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Branding = () => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/branding', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setConfig);
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !config) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/branding/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.logoUrl) {
        setConfig({ ...config, logo_url: data.logoUrl });
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    await fetch('/api/admin/branding', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config),
    });
    setSaving(false);
  };

  if (!config) return null;

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="border border-[#141414] p-8 space-y-6 bg-white/50">
            <div className="flex items-center gap-2 mb-2">
              <Type size={16} className="opacity-50" />
              <h3 className="font-serif italic text-lg">Identity</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={config.company_name}
                  onChange={e => setConfig({ ...config, company_name: e.target.value })}
                  className="w-full bg-transparent border-b border-[#141414] py-2 text-sm focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">
                  Primary Domain
                </label>
                <div className="flex items-center gap-2 text-sm opacity-50">
                  <Globe size={14} />
                  <span>{config.domain}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="border border-[#141414] p-8 space-y-6 bg-white/50">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={16} className="opacity-50" />
              <h3 className="font-serif italic text-lg">Visual Style</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-12 h-12 bg-transparent border border-[#141414] p-1 cursor-pointer"
                  />
                  <span className="font-mono text-xs uppercase">{config.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">
                  Logo URL
                </label>
                <div className="space-y-4">
                  {config.logo_url && (
                    <div className="w-20 h-20 border border-[#141414] p-2 bg-white flex items-center justify-center">
                      <img src={config.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Logo URL (https://...)"
                    value={config.logo_url || ''}
                    onChange={e => setConfig({ ...config, logo_url: e.target.value })}
                    className="w-full bg-transparent border-b border-[#141414] py-2 text-sm focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-medium hover:bg-[#141414]/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Preview Section */}
      <div className="mt-12 border-t border-[#141414] pt-12">
        <h3 className="font-serif italic text-sm uppercase tracking-widest opacity-50 mb-8">Live Preview</h3>
        <div className="border border-[#141414] p-12 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-16 h-16 flex items-center justify-center text-white font-serif italic text-2xl"
              style={{ backgroundColor: config.primary_color }}
            >
              {config.company_name.charAt(0)}
            </div>
            <span className="text-2xl font-serif italic text-[#141414]">{config.company_name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
