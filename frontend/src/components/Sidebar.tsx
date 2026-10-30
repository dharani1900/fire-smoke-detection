import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Cpu, 
  Database, 
  User, 
  Settings, 
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isAlarmActive, stopAlarm } = useAlarm();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/detect', label: 'Image Detection', icon: UploadCloud },
    { to: '/history', label: 'Detection History', icon: History },
    { to: '/model-info', label: 'ML Model Info', icon: Cpu },
    { to: '/dataset-training', label: 'Dataset & Training', icon: Database },
    { to: '/profile', label: 'User Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-red-600 p-2 rounded-lg text-white shadow-lg">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide uppercase">ChemCabinet AI</h1>
          <p className="text-xs text-slate-400">Fire & Smoke Hazard Monitor</p>
        </div>
      </div>

      {/* Alarm Status Badge */}
      {isAlarmActive && (
        <div className="m-3 p-3 bg-red-950 border border-red-600 rounded-lg animate-pulse-danger flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Hazard Alarm Active!</span>
          </div>
          <button 
            onClick={stopAlarm}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded font-semibold transition"
          >
            Acknowledge & Stop
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Scientific Limitation Footer Note */}
      <div className="p-3 mx-3 mb-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 leading-tight">
        <span className="font-bold text-amber-400 block mb-1">Optical RGB AI</span>
        Visible fire and smoke hazard detection. Optical cameras cannot detect invisible chemical gases.
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="overflow-hidden pr-2">
          <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded uppercase font-bold">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
