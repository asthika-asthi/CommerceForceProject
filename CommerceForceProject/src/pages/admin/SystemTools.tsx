import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileJson, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  HardDrive
} from 'lucide-react';

export const SystemTools = () => {
  const { token } = useAuth();
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingCsv(true);
    setCsvResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/import/products/csv', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCsvResult(data);
      } else {
        setError(data.error || 'Failed to process CSV');
      }
    } catch (err) {
      setError('Network error uploading CSV');
    } finally {
      setIsUploadingCsv(false);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingJson(true);
    setJsonResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/import/config/master', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setJsonResult(data);
        // Refresh page to apply branding changes
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(data.error || 'Failed to process JSON');
      }
    } catch (err) {
      setError('Network error uploading JSON');
    } finally {
      setIsUploadingJson(false);
    }
  };

  const downloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/import/products/template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download CSV template');
      }
    } catch (err) {
      setError('Network error downloading CSV template');
    }
  };

  const exportConfig = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/import/config/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'master_config.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to export configuration');
      }
    } catch (err) {
      setError('Network error exporting configuration');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif italic text-[#141414] mb-2">System Tools</h1>
          <p className="text-sm opacity-60 font-mono uppercase tracking-widest">Advanced Configuration & Bulk Operations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#141414] text-[10px] font-mono uppercase tracking-widest">
          <HardDrive size={14} />
          <span>Storage: Local Docker Volume</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bulk Product Import */}
        <div className="bg-white border border-[#141414] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bulk Product Import</h2>
              <p className="text-xs opacity-50">Upload a CSV to add or update products</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[#141414]/10 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-[#f9f9f9] transition-all"
            >
              <Download size={14} />
              Download CSV Template
            </button>

            <button 
              onClick={async () => {
                if (!token) return;
                try {
                  const res = await fetch('/api/admin/import/products/export', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'master_products.csv';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } else {
                    setError('Failed to export products');
                  }
                } catch (err) {
                  setError('Network error exporting products');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[#141414] rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              <FileSpreadsheet size={14} />
              Download Master CSV
            </button>

            <div className="relative group">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={isUploadingCsv}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all ${isUploadingCsv ? 'bg-blue-50 border-blue-200' : 'border-[#141414]/10 group-hover:border-[#141414]/30'}`}>
                {isUploadingCsv ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-sm font-medium">Processing CSV...</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="opacity-20 mb-4" />
                    <p className="text-sm font-medium">Click or drag CSV to upload</p>
                    <p className="text-[10px] opacity-40 mt-1 uppercase tracking-widest">Max 2MB • .csv only</p>
                  </>
                )}
              </div>
            </div>

            {csvResult && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  Import Complete
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-widest">
                  <div className="text-green-600">Success: {csvResult.success}</div>
                  <div className="text-red-600">Failed: {csvResult.failed}</div>
                </div>
                {csvResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 max-h-32 overflow-y-auto">
                    {csvResult.errors.map((err: string, i: number) => (
                      <p key={i} className="text-[10px] text-red-500 mb-1">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Master Config Import/Export */}
        <div className="bg-white border border-[#141414] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <FileJson size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quick Customization</h2>
              <p className="text-xs opacity-50">Import/Export master system configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={exportConfig}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[#141414]/10 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-[#f9f9f9] transition-all"
            >
              <Database size={14} />
              Export Current Master JSON
            </button>

            <div className="relative group">
              <input 
                type="file" 
                accept=".json"
                onChange={handleJsonUpload}
                disabled={isUploadingJson}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all ${isUploadingJson ? 'bg-purple-50 border-purple-200' : 'border-[#141414]/10 group-hover:border-[#141414]/30'}`}>
                {isUploadingJson ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-purple-600 mb-4" />
                    <p className="text-sm font-medium">Applying Configuration...</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="opacity-20 mb-4" />
                    <p className="text-sm font-medium">Click or drag JSON to upload</p>
                    <p className="text-[10px] opacity-40 mt-1 uppercase tracking-widest">Master Config • .json only</p>
                  </>
                )}
              </div>
            </div>

            {jsonResult && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 text-sm">
                <CheckCircle2 size={18} />
                Configuration applied! Refreshing...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentation / Tips */}
      <div className="bg-[#141414] text-[#E4E3E0] p-8 rounded-3xl">
        <h3 className="font-serif italic text-xl mb-4">Implementation Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] opacity-60 leading-relaxed font-mono uppercase tracking-wider">
          <div>
            <p className="font-bold mb-2 text-white">CSV Import</p>
            <p>SKUs are autogenerated if not provided. To update existing products, include the 'id' column from an export.</p>
          </div>
          <div>
            <p className="font-bold mb-2 text-white">Master JSON</p>
            <p>Includes Branding, Feature Flags, and Landing Page layout. Syntax errors will be logged with line numbers.</p>
          </div>
          <div>
            <p className="font-bold mb-2 text-white">Storage</p>
            <p>Files are stored in the persistent Docker volume. Images are renamed to UUIDs to prevent collisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
