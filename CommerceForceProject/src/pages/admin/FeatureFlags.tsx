import React, { useEffect, useState } from 'react';
import { FeatureFlag } from '../../shared/types';
import { ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FeatureFlags = () => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/features', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setFeatures);
  }, [token]);

  const toggleFeature = async (key: string, current: boolean) => {
    const next = !current;
    setFeatures(prev => prev.map(f => f.feature_key === key ? { ...f, enabled: next } : f));
    
    await fetch('/api/admin/features/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ key, enabled: next }),
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="border border-[#141414] bg-white/50">
        <div className="grid grid-cols-[1fr_120px] border-b border-[#141414] bg-[#141414] text-[#E4E3E0] p-4 text-[10px] font-mono uppercase tracking-widest">
          <span>Feature Module</span>
          <span className="text-center">Status</span>
        </div>
        
        <div className="divide-y divide-[#141414]">
          {features.map((feature) => (
            <div key={feature.feature_key} className="grid grid-cols-[1fr_120px] items-center p-6 hover:bg-white transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#141414]">{feature.feature_key}</span>
                  <div className="group relative">
                    <Info size={12} className="opacity-30 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono leading-relaxed z-10">
                      {feature.description || 'No description provided for this feature module.'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#141414]/60 font-light">
                  Module ID: {feature.feature_key.toLowerCase()}
                </p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => toggleFeature(feature.feature_key, feature.enabled)}
                  className={`transition-colors ${feature.enabled ? 'text-blue-600' : 'text-[#141414]/20'}`}
                >
                  {feature.enabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-6 border border-dashed border-[#141414]/30 flex gap-4 items-start">
        <Info size={18} className="opacity-50 mt-1" />
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">System Note</h4>
          <p className="text-xs text-[#141414]/60 leading-relaxed">
            Feature flags are applied globally across all client instances. Disabling a core module (like RFQ) will hide all associated UI elements and reject incoming API requests for that module.
          </p>
        </div>
      </div>
    </div>
  );
};
