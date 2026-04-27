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
  HardDrive,
  Image as ImageIcon,
  FileText as FileIcon,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

export const SystemTools = () => {
  const { token } = useAuth();
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Image Management State
  const [assets, setAssets] = useState<any[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fetchAssets = async () => {
    if (!token) return;
    setIsLoadingAssets(true);
    try {
      const res = await fetch('/api/storage/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAssets(data);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  React.useEffect(() => {
    fetchAssets();
  }, [token]);

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('files' in e.target && e.target.files) {
      files = e.target.files;
    } else if ('dataTransfer' in e) {
      files = e.dataTransfer.files;
    }

    if (!files || files.length === 0 || !token) return;

    const fileList = Array.from(files);
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (!allowed.includes(file.type)) {
        setError(`Invalid file type for ${file.name}. Only images and PDFs allowed.`);
        continue;
      }
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const maxSize = (isPdf ? 50 : 10) * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File ${file.name} too large. Max ${isPdf ? '50MB' : '10MB'}.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploadingAsset(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    setError(null);

    let successCount = 0;
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          setError(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        setError(`Network error uploading ${file.name}`);
      }
    }

    if (successCount > 0) {
      setSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
      fetchAssets();
      setTimeout(() => setSuccess(null), 3000);
    }

    setIsUploadingAsset(false);
    setUploadProgress(null);
    if ('target' in e && 'value' in e.target) {
      (e.target as any).value = '';
    }
  };

  const deleteAsset = async (filename: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      const res = await fetch(`/api/storage/files/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Asset deleted');
        fetchAssets();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Delete failed');
      }
    } catch (err) {
      setError('Network error deleting asset');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('URL copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

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

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          {success}
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

      {/* Asset Management - Centralized Image Storage */}
      <div className="bg-white border border-[#141414] p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Image & Asset Manager</h2>
              <p className="text-xs opacity-50">Centralized storage for product images, banners, and logos</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={handleAssetUpload}
              multiple
              disabled={isUploadingAsset}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <button className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#141414] text-white rounded-xl text-xs font-mono uppercase tracking-widest transition-all ${isUploadingAsset ? 'opacity-50' : 'hover:bg-black'}`}>
              {isUploadingAsset ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {uploadProgress ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Assets
                </>
              )}
            </button>
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-3xl p-8 transition-all text-center ${isUploadingAsset ? 'bg-amber-50 border-amber-200' : isDragging ? 'bg-amber-50 border-amber-400 border-solid' : 'border-[#141414]/5 hover:border-[#141414]/20'}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleAssetUpload(e);
          }}
        >
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={handleAssetUpload}
            multiple
            disabled={isUploadingAsset}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          {isUploadingAsset ? (
            <div className="space-y-3">
              <Loader2 size={32} className="animate-spin text-amber-600 mx-auto" />
              <p className="text-sm font-medium">
                {uploadProgress 
                  ? `Uploading assets (${uploadProgress.current} of ${uploadProgress.total})...`
                  : 'Starting upload...'
                }
              </p>
              {uploadProgress && (
                <div className="w-64 h-1.5 bg-amber-100 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-amber-600 transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center gap-4 mb-2">
                <ImageIcon size={32} className="opacity-20" />
                <FileIcon size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Drag & drop multiple files, or click to browse</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Supports JPG, PNG, WEBP, SVG, PDF • Max 10MB (50MB for PDFs)</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {isLoadingAssets ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 size={32} className="animate-spin opacity-20 mx-auto mb-4" />
              <p className="text-xs font-mono uppercase opacity-40">Loading Assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-[#141414]/5 rounded-3xl">
              <ImageIcon size={32} className="opacity-10 mx-auto mb-4" />
              <p className="text-xs font-mono uppercase opacity-40">No assets stored yet</p>
            </div>
          ) : (
            assets.map((asset) => {
              const rotate = (asset.name.charCodeAt(0) % 6) - 3;
              const isPdf = asset.name.toLowerCase().endsWith('.pdf');
              
              return (
                <div key={asset.name} className="group relative bg-white border border-[#141414]/10 rounded-2xl overflow-hidden transition-all hover:border-[#141414]/30 hover:shadow-md">
                  <div className="aspect-[4/3] bg-[#f9f9f9] relative overflow-hidden flex items-center justify-center p-2 border-b border-[#141414]/5">
                    {isPdf ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-20 bg-rose-50 border border-rose-100 rounded flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                          <div className="absolute top-0 right-0 w-6 h-6 bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">PDF</div>
                          <FileIcon size={32} className="text-rose-500" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={asset.url} 
                        alt={asset.name} 
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(window.location.origin + asset.url)}
                        className="p-2 bg-white text-[#141414] rounded-lg hover:bg-[#f0f0f0] transition-colors"
                        title="Copy URL"
                      >
                        <Copy size={16} />
                      </button>
                      <a 
                        href={asset.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-white text-[#141414] rounded-lg hover:bg-[#f0f0f0] transition-colors"
                        title="View Full Size"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        onClick={() => deleteAsset(asset.name)}
                        className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-1">
                    <p className="text-[10px] font-mono truncate font-bold text-[#141414]" title={asset.name}>
                      {asset.name}
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-mono opacity-40 uppercase tracking-tighter">
                      <span>{(asset.size / 1024).toFixed(0)} KB</span>
                      <span>{new Date(asset.mtime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
