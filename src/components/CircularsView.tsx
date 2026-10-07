import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Circular, SchoolSettings } from '../types';
import {
  getCirculars,
  createCircular,
  updateCircular,
  deleteCircular,
} from '../services/schoolService';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  Search,
  RefreshCw,
  Printer,
  Eye,
  CheckCircle2,
  Building,
  Shield,
  Stamp,
  AlertCircle,
} from 'lucide-react';

interface CircularsViewProps {
  settings?: SchoolSettings;
}

export const CircularsView: React.FC<CircularsViewProps> = ({ settings }) => {
  const { profile, isPrincipal } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Circular | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Printable memo viewer
  const [viewingCircular, setViewingCircular] = useState<Circular | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCirculars();
      setCirculars(data);
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setDate(
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Circular) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setDate(item.date);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Circular Title and Memorandum Content are required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updateCircular(editingItem.id, {
          title: title.trim(),
          content: content.trim(),
          date: date.trim() || new Date().toLocaleDateString('en-GB'),
        });
      } else {
        await createCircular({
          title: title.trim(),
          content: content.trim(),
          date: date.trim() || new Date().toLocaleDateString('en-GB'),
          createdBy: profile?.name || 'Principal',
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save circular.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCircular(id);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete circular:', err);
    }
  };

  const filteredCirculars = circulars.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const schoolName = settings?.institutionName || settings?.schoolName || 'Saraswati Vidya Academy';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Institutional Directives
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Official Memos</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            Administrative Circulars
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official academic directives, examination orders, and institutional policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPrincipal && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Issue New Circular</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            title="Refresh Circulars"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Counts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search circulars by subject or reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500 self-end sm:self-auto">
          {filteredCirculars.length} circulars on file
        </span>
      </div>

      {/* Circulars List (Requirement 8) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-950 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading administrative circulars...</p>
        </div>
      ) : filteredCirculars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Circulars Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No circulars match your search keywords.'
              : 'There are currently no official circulars issued for the institution.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCirculars.map(circ => (
            <div
              key={circ.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mb-1">
                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      CIR/{circ.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{circ.date}</span>
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Directive
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 truncate group-hover:text-amber-900 transition-colors">
                    {circ.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {circ.content}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCircular(circ)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-900" />
                  <span>Inspect Memo</span>
                </button>

                {isPrincipal && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(circ)}
                      className="p-2 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      title="Edit Circular"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(circ.id)}
                      className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Circular"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MEMO MODAL (Formal Letterhead) */}
      {viewingCircular && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingCircular(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Formal Institutional Letterhead */}
            <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-300 font-serif font-black flex items-center justify-center mx-auto mb-2 text-base border border-amber-400/40">
                SVA
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 font-serif uppercase tracking-tight">
                {schoolName}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Office of the Principal · Official Institutional Memorandum
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                <span className="font-mono font-bold">Ref: CIR/{viewingCircular.id.toUpperCase()}</span>
                <span>Date: <strong>{viewingCircular.date}</strong></span>
              </div>
            </div>

            {/* Memorandum Body */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Sub: {viewingCircular.title}
              </h3>
              
              <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 font-sans">
                {viewingCircular.content}
              </div>

              {/* Sign-Off Block */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-end">
                <div className="text-xs text-slate-500">
                  <span className="block font-semibold">Distribution:</span>
                  <span>All Departments, Faculty Notice Board & Archives</span>
                </div>
                <div className="text-right">
                  <div className="font-serif font-bold text-sm text-slate-900">
                    Principal & Administrator
                  </div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                    {schoolName}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Administrative Circular' : 'Issue New Circular'}
                </h3>
                <p className="text-xs text-slate-500">
                  Official administrative policy directive for the school
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Circular Subject / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule of Term-End Examinations 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Issue Date
                </label>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Directive Memorandum Content
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write the full directive memorandum text..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-blue-950 hover:bg-blue-900 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Circular' : 'Issue Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Circular?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This action will permanently withdraw this circular from the administrative registry.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
