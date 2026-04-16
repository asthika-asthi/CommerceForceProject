import React, { useEffect, useState } from 'react';
import { EmailLog } from '../../shared/types';
import { Search, Loader2, Mail, Clock, CheckCircle2, User, Filter, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const EmailLogs = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const { token } = useAuth();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.recipient.toLowerCase().includes(search.toLowerCase()) || 
    log.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Notification Logs</h1>
        <button 
          onClick={fetchLogs}
          className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
          title="Refresh logs"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
          />
        </div>
      </div>

      <div className="border border-[#141414] overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-1 max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
                <th className="p-4 font-medium">Recipient</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Sent At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <User size={14} className="opacity-30" />
                       <span className="text-sm font-medium">{log.recipient}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{log.subject}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-mono uppercase">{log.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-mono opacity-40">
                    {new Date(log.sent_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
                      title="View Content"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail size={32} className="opacity-20" />
              </div>
              <p className="text-[#141414]/40 italic font-serif text-lg">No email logs found.</p>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mt-2">Activity will appear here as notifications are sent</p>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[24px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold">Email Content</h2>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
                  <RefreshCw className="rotate-45" size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Recipient</label>
                  <p className="text-sm font-medium">{selectedLog.recipient}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Subject</label>
                  <p className="text-sm font-medium">{selectedLog.subject}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Message Body</label>
                  <div className="bg-[#f9f9f9] p-4 rounded-xl border border-[#f0f0f0] whitespace-pre-wrap text-sm font-serif italic">
                    {selectedLog.body}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[#f0f0f0]">
                  <span className="text-[10px] font-mono opacity-40">{new Date(selectedLog.sent_at).toLocaleString()}</span>
                  <span className="text-[10px] font-mono uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Status: {selectedLog.status}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
