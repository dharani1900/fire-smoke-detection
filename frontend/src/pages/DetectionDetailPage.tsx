import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Flame, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Cpu, 
  Clock, 
  FileText,
  Sliders,
  CheckCircle2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

import api, { resolveImageUrl } from '../services/api';
import type { DetectionRecord } from '../types';
import { getDemoHistory, saveDemoHistory } from '../services/demoFallback';

export const DetectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<DetectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  const navigate = useNavigate();

  const isHazard = (pred: string) => pred === 'hazard_detected' || pred === 'leakage';

  useEffect(() => {
    if (!id) return;
    api.get<DetectionRecord>(`/api/detections/${id}`)
      .then((res) => {
        if (res.data && typeof res.data === 'object' && res.data.id) {
          setRecord(res.data);
        } else {
          throw new Error('Invalid record data');
        }
      })
      .catch(() => {
        // Fallback to local demo history
        const history = getDemoHistory();
        const found = Array.isArray(history) ? history.find(r => r.id === parseInt(id)) : undefined;
        if (found) {
          setRecord(found);
        } else {
          setError('Detection record not found.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!record || !window.confirm(`Delete scan record #${record.id}?`)) return;
    try {
      await api.delete(`/api/detections/${record.id}`);
      navigate('/history');
    } catch (err) {
      const history = getDemoHistory();
      const updated = history.filter(r => r.id !== record.id);
      saveDemoHistory(updated);
      navigate('/history');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-blue-600 font-bold">Loading Scan Details...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-600 font-bold">{error || 'Record not found.'}</p>
        <Link to="/history" className="text-blue-600 underline font-semibold text-sm">
          Return to History
        </Link>
      </div>
    );
  }

  const hazard = isHazard(record.prediction);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Detection History</span>
        </Link>

        <button
          onClick={handleDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3.5 py-2 rounded-lg border border-red-200 transition flex items-center space-x-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Record</span>
        </button>
      </div>

      {/* Primary Header Card */}
      <div className={`p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        record.prediction === 'hazard_detected'
          ? 'bg-red-600 border-2 border-red-700'
          : record.prediction === 'uncertain'
          ? 'bg-amber-600 border-2 border-amber-700'
          : 'bg-emerald-600 border-2 border-emerald-700'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            {record.prediction === 'hazard_detected' ? (
              <Flame className="w-8 h-8 text-white" />
            ) : record.prediction === 'uncertain' ? (
              <AlertTriangle className="w-8 h-8 text-white" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <span className="bg-white/20 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider font-bold">
              Scan ID #{record.id}
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1">
              {record.prediction === 'hazard_detected'
                ? 'FIRE / SMOKE HAZARD DETECTED'
                : record.prediction === 'uncertain'
                ? 'UNCERTAIN — MANUAL INSPECTION REQUIRED'
                : 'NO VISIBLE FIRE / SMOKE DETECTED'}
            </h2>
            <p className="text-xs text-white/90 mt-0.5">
              Evaluated on {new Date(record.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-black/20 p-3 rounded-xl border border-white/20 text-xs font-mono">
          <div>
            <p className="text-[10px] text-white/70 uppercase">Confidence Score</p>
            <p className="text-lg font-bold text-white">{(record.confidence * 100).toFixed(1)}%</p>
          </div>
          {record.severity && (
            <div className="border-l border-white/30 pl-3">
              <p className="text-[10px] text-white/70 uppercase">Estimated Severity</p>
              <p className="text-lg font-bold text-amber-300">{record.severity}</p>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Visual Comparison Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Side-by-Side Visual Inspection</span>
          </h3>

          {record.visualization_image_path && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              {showOverlay ? 'Hide Simulated Hazard Overlay' : 'Show Simulated Hazard Overlay'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original RGB Image */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Original RGB Inspection Image</span>
            </p>
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[320px]">
              <img
                src={resolveImageUrl(record.original_image_path)}
                alt="Original Inspection"
                className="max-h-96 w-full object-contain"
              />
            </div>
          </div>

          {/* AI Visual Simulation Overlay */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {record.prediction === 'hazard_detected'
                  ? 'Illustrative Simulation Overlay (Not a gas measurement)'
                  : record.prediction === 'uncertain'
                  ? 'Inspection Status Overlay (Inconclusive - No plume simulated)'
                  : 'Inspection Status Overlay (Nominal Safe Status)'}
              </span>
            </p>
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[320px]">
              <img
                src={resolveImageUrl(showOverlay && record.visualization_image_path ? record.visualization_image_path : record.original_image_path)}
                alt="Simulated Visualization"
                className="max-h-96 w-full object-contain"
              />
            </div>
          </div>
        </div>

        {record.visualization_image_path && (
          <div className="pt-2 flex justify-end">
            <a
              href={resolveImageUrl(record.visualization_image_path)}
              download={`Hazard_Result_${record.id}.jpg`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Visual Artifact</span>
            </a>
          </div>
        )}
      </div>

      {/* Metadata & Technical Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Model Metadata</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model Architecture:</span>
              <span className="font-bold">{record.model_version}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Inference Mode:</span>
              <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">{record.mode}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Visualization Engine:</span>
              <span className="font-semibold">{record.visualization_type}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Scan Timestamp</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date Evaluated:</span>
              <span className="font-bold">{new Date(record.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Exact Time:</span>
              <span className="font-bold">{new Date(record.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Alarm Status:</span>
              <span className={`font-bold ${record.alarm_recommended ? 'text-red-600' : 'text-emerald-600'}`}>
                {record.alarm_recommended ? 'Alarm Triggered' : 'Silent / Nominal'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Inspector Notes</span>
          </h4>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
            {record.notes || 'No custom inspector notes provided for this scan.'}
          </p>
        </div>
      </div>
    </div>
  );
};
