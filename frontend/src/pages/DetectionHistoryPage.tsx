import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Download, 
  ShieldCheck, 
  RefreshCw,
  Calendar,
  Layers,
  Flame,
  AlertTriangle
} from 'lucide-react';

import api, { resolveImageUrl } from '../services/api';
import type { DetectionRecord } from '../types';
import { getDemoHistory, saveDemoHistory } from '../services/demoFallback';

export const DetectionHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [loading, setLoading] = useState(true);

  const isHazard = (pred: string) => pred === 'hazard_detected' || pred === 'leakage';

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/detections?sort=${sort}`;
      if (statusFilter !== 'all') {
        url += `&status_filter=${statusFilter}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await api.get<DetectionRecord[]>(url);
      if (Array.isArray(res.data)) {
        setRecords(res.data);
      } else {
        throw new Error('Non-array history returned');
      }
    } catch (err) {
      // Fallback to local demo history if backend is not reachable
      let dHistory = getDemoHistory();
      if (!Array.isArray(dHistory)) dHistory = [];
      if (statusFilter !== 'all') {
        dHistory = dHistory.filter(r => {
          if (statusFilter === 'hazard_detected' || statusFilter === 'leakage') return isHazard(r.prediction);
          if (statusFilter === 'normal' || statusFilter === 'no_leakage') return !isHazard(r.prediction);
          return r.prediction === statusFilter;
        });
      }
      if (search) {
        const query = search.toLowerCase();
        dHistory = dHistory.filter(r => 
          (r.notes && r.notes.toLowerCase().includes(query)) ||
          r.prediction.toLowerCase().includes(query)
        );
      }
      if (sort === 'oldest') {
        dHistory = [...dHistory].reverse();
      }
      setRecords(dHistory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete scan record #${id}?`)) return;

    try {
      await api.delete(`/api/detections/${id}`);
      setRecords(records.filter((r) => r.id !== id));
    } catch (err) {
      const updated = records.filter(r => r.id !== id);
      saveDemoHistory(updated);
      setRecords(updated);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hazard Inspection Records & History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and review historical visual hazard evaluations and AI explainability heatmaps.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-300 transition flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search notes, ID, or version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">All Predictions</option>
              <option value="hazard_detected">Hazard Alerts Only</option>
              <option value="normal">Safe Scans Only</option>
              <option value="uncertain">Inconclusive / Uncertain Only</option>
              <option value="outside_validated_domain">Outside Validated Domain Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Records Grid / Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No detection records match your criteria.</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or upload a new inspection image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(records) ? records : []).map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-700">Scan ID: #{record.id}</span>
                  <span className="text-[11px] text-slate-400">{new Date(record.timestamp).toLocaleString()}</span>
                </div>

                {/* Side by side mini previews */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">RGB Image</span>
                    <img
                      src={resolveImageUrl(record.original_image_path)}
                      alt="Original"
                      className="h-28 w-full object-cover rounded border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">AI Overlay</span>
                    <img
                      src={resolveImageUrl(record.visualization_image_path || record.original_image_path)}
                      alt="Visualization"
                      className="h-28 w-full object-cover rounded border border-slate-200"
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-1">
                  {record.prediction === 'hazard_detected' || record.prediction === 'leakage' ? (
                    <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 font-bold text-xs px-2.5 py-1 rounded-full border border-red-300">
                      <Flame className="w-3.5 h-3.5 text-red-600" />
                      <span>Hazard Alert</span>
                    </span>
                  ) : record.prediction === 'outside_validated_domain' ? (
                    <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Outside Domain</span>
                    </span>
                  ) : record.prediction === 'uncertain' ? (
                    <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Inconclusive</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Safe Status</span>
                    </span>
                  )}

                  <span className="text-xs font-mono font-bold text-slate-800">
                    {(record.confidence * 100).toFixed(1)}% Conf
                  </span>
                </div>

                {record.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic truncate">
                    "{record.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to={`/history/${record.id}`}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </Link>

                <div className="flex items-center space-x-2">
                  {record.visualization_image_path && (
                    <a
                      href={resolveImageUrl(record.visualization_image_path)}
                      download={`Scan_${record.id}.jpg`}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
