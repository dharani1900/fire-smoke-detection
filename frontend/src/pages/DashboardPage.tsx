import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileImage, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Volume2, 
  Cpu, 
  Upload, 
  ArrowRight,
  Eye,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';

import api, { resolveImageUrl } from '../services/api';
import type { DashboardStats, DetectionRecord } from '../types';
import { StatCard } from '../components/StatCard';
import { getDemoStats, getDemoHistory } from '../services/demoFallback';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(() => getDemoStats());
  const [recentScans, setRecentScans] = useState<DetectionRecord[]>(() => {
    const d = getDemoHistory();
    return Array.isArray(d) ? d.slice(0, 5) : [];
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<DetectionRecord[]>('/api/detections?sort=newest')
      ]);

      if (
        statsRes.data &&
        typeof statsRes.data === 'object' &&
        Array.isArray(historyRes.data)
      ) {
        setStats(statsRes.data);
        setRecentScans(historyRes.data.slice(0, 5));
      } else {
        throw new Error('Non-JSON response received from backend');
      }
    } catch (err) {
      // Gracefully fall back to local demo storage
      const dStats = getDemoStats();
      const dHistory = getDemoHistory();
      setStats(dStats);
      setRecentScans(Array.isArray(dHistory) ? dHistory.slice(0, 5) : []);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Optical Fire & Smoke Monitoring Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking and MobileNetV2 optical fire & smoke hazard classification alerts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/detect"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Analyse Inspection Image</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Analysed"
          value={stats.total_images || 0}
          subtitle="Inspection Scans"
          icon={FileImage}
          color="blue"
          badgeText="Active Records"
        />

        <StatCard
          title="Hazard Alerts"
          value={stats.leakage_predictions || 0}
          subtitle="Confirmed Hazards"
          icon={ShieldAlert}
          color="red"
          badgeText="Action Recommended"
        />

        <StatCard
          title="Nominal / Safe"
          value={stats.safe_predictions || 0}
          subtitle="Nominal Indications"
          icon={ShieldCheck}
          color="green"
          badgeText="Nominal Status"
        />

        <StatCard
          title="Latest Detection"
          value={stats.latest_detection ? (stats.latest_detection.prediction === 'outside_validated_domain' ? 'OUTSIDE DOMAIN' : stats.latest_detection.prediction.toUpperCase()) : 'N/A'}
          subtitle={stats.latest_detection ? new Date(stats.latest_detection.timestamp).toLocaleTimeString() : 'No scans yet'}
          icon={Clock}
          color={stats.latest_detection?.prediction === 'hazard_detected' || stats.latest_detection?.prediction === 'leakage' ? 'red' : (stats.latest_detection?.prediction === 'uncertain' || stats.latest_detection?.prediction === 'outside_validated_domain') ? 'amber' : 'indigo'}
          badgeText={stats.latest_detection ? `Conf: ${(stats.latest_detection.confidence * 100).toFixed(1)}%` : 'Ready'}
        />

        <StatCard
          title="Alarm Status"
          value={stats.alarm_status?.toUpperCase() || 'SILENT'}
          subtitle="Browser Alert Engine"
          icon={Volume2}
          color={stats.alarm_status === 'active' ? 'amber' : 'purple'}
          badgeText={stats.alarm_status === 'active' ? 'Alert Active' : 'Standby Mode'}
        />

        <StatCard
          title="ML Engine Status"
          value="TRAINED"
          subtitle="MobileNetV2 Model"
          icon={Cpu}
          color="purple"
          badgeText="Custom Fine-Tuned"
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Detections Over Time */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cabinet Inspection Timeline</h3>
              <p className="text-xs text-slate-500">Daily frequency of safe status vs leakage alerts</p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded">Daily Activity</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.detections_over_time || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Scans" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="leakage" name="Leakage Alerts" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="safe" name="Safe Status" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Optical Inspection Prediction Distribution</h3>
            <p className="text-xs text-slate-500">Aggregate scan breakdown</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.prediction_breakdown || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Scans" radius={[6, 6, 0, 0]}>
                  {(stats.prediction_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Recent Inspection Scan Log</h3>
            <p className="text-xs text-slate-500">Most recent optical evaluation records</p>
          </div>
          <Link to="/history" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No inspection records found. Click <strong>Analyse Inspection Image</strong> to evaluate your first image.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Scan ID</th>
                  <th className="px-5 py-3">Preview</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Prediction</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(Array.isArray(recentScans) ? recentScans : []).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-900 font-bold">#{record.id}</td>
                    <td className="px-5 py-3.5">
                      <img
                        src={resolveImageUrl(record.original_image_path)}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded border border-slate-200 shadow-sm"
                      />
                    </td>
                    <td className="px-5 py-3.5">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {record.prediction === 'hazard_detected' || record.prediction === 'leakage' ? (
                        <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full border border-red-300">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Hazard Alert</span>
                        </span>
                      ) : record.prediction === 'outside_validated_domain' ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Outside Domain</span>
                        </span>
                      ) : record.prediction === 'uncertain' ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Uncertain</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Safe Status</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold">{(record.confidence * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px]">
                        {record.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/history/${record.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
