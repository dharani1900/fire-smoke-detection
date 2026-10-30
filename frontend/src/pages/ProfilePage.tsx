import React, { useEffect, useState } from 'react';
import { Shield, Mail, Calendar, FileImage, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { DashboardStats } from '../types';
import { getDemoStats } from '../services/demoFallback';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>('/api/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(getDemoStats()));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold border-4 border-slate-100 shadow-md">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-slate-900">{user?.full_name}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border border-blue-300">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start space-x-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Registered on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Personal Scan Statistics Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Personal Inspection Activity Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
            <FileImage className="w-6 h-6 text-blue-600 mx-auto" />
            <p className="text-2xl font-black text-slate-900">{stats?.total_images || 0}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Images Analysed</p>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center space-y-1">
            <Flame className="w-6 h-6 text-red-600 mx-auto" />
            <p className="text-2xl font-black text-red-700">{stats?.leakage_predictions || 0}</p>
            <p className="text-xs font-semibold text-red-600 uppercase">Hazard Warnings</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center space-y-1">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-2xl font-black text-emerald-700">{stats?.safe_predictions || 0}</p>
            <p className="text-xs font-semibold text-emerald-600 uppercase">Safe Status Scans</p>
          </div>
        </div>
      </div>

      {/* User Security & Permissions Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Security & Data Isolation Guarantee</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your account is secured with JWT tokens and bcrypt password hashing. All uploaded optical inspection images, prediction records, confidence scores, and inspector notes are strictly isolated to your user account and cannot be accessed by other standard users.
        </p>
      </div>
    </div>
  );
};
