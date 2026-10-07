import React, { useState, useEffect } from 'react';
import { EmailLog } from '../types';
import { getEmailLogs } from '../services/schoolService';
import {
  X,
  MailCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Layers,
  List,
} from 'lucide-react';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnnouncementSummaryLog {
  key: string;
  announcementTitle: string;
  date: string;
  recipientsCount: number;
  successfulCount: number;
  failedCount: number;
  status: 'Sent' | 'Failed' | 'Partial';
  error: string;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'simulated' | 'failed'>('all');
  const [viewMode, setViewMode] = useState<'announcement' | 'individual'>('announcement');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getEmailLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.announcementTitle && log.announcementTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Aggregate by announcement (Requirement 7)
  const announcementSummaries: AnnouncementSummaryLog[] = React.useMemo(() => {
    const groups = new Map<string, EmailLog[]>();
    logs.forEach(log => {
      const key = log.announcementId || log.announcementTitle || 'general';
      const existing = groups.get(key) || [];
      existing.push(log);
      groups.set(key, existing);
    });

    const summaries: AnnouncementSummaryLog[] = [];
    groups.forEach((groupLogs, key) => {
      const title = groupLogs[0]?.announcementTitle || key;
      const sentAt = groupLogs[0]?.sentAt || new Date().toISOString();
      const formattedDate = new Date(sentAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const successfulCount = groupLogs.filter(l => l.status === 'sent').length;
      const failedCount = groupLogs.filter(l => l.status === 'failed').length;
      const firstError = groupLogs.find(l => l.errorMessage)?.errorMessage || 'None';

      const status: 'Sent' | 'Failed' | 'Partial' =
        failedCount === 0 && successfulCount > 0
          ? 'Sent'
          : successfulCount > 0
          ? 'Partial'
          : 'Failed';

      if (
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        groupLogs.some(l => l.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        summaries.push({
          key,
          announcementTitle: title,
          date: formattedDate,
          recipientsCount: groupLogs.length,
          successfulCount,
          failedCount,
          status,
          error: firstError,
        });
      }
    });

    return summaries;
  }, [logs, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Email Logs (Audit)
              </h3>
              <p className="text-xs text-slate-500">
                Actual SMTP email delivery results for school announcements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher & Filter bar */}
        <div className="py-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('announcement')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'announcement' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By Announcement</span>
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'individual' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Individual Recipients</span>
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search announcement..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading audit records...</p>
            </div>
          ) : viewMode === 'announcement' ? (
            announcementSummaries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No announcement email logs recorded yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Announcement</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Recipients</th>
                    <th className="py-2.5 px-3 text-center">Successful</th>
                    <th className="py-2.5 px-3 text-center">Failed</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {announcementSummaries.map(item => (
                    <tr key={item.key} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {item.announcementTitle}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {item.recipientsCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {item.successfulCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-700">
                        {item.failedCount}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'Sent'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                        {item.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No recipient-level email dispatch logs found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Sent At</th>
                  <th className="py-2.5 px-3">Recipient Faculty</th>
                  <th className="py-2.5 px-3">Announcement</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(log.sentAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.recipientName || 'Teacher'}</div>
                      <div className="font-mono text-[11px] text-slate-500">{log.recipientEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-800 font-medium">
                      {log.announcementTitle || log.announcementId}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Sent (SMTP)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                      {log.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {viewMode === 'announcement'
              ? `Total announcements dispatched: ${announcementSummaries.length}`
              : `Total recipient records: ${filteredLogs.length}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
