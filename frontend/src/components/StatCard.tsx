import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'amber' | 'indigo' | 'purple';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badgeText
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const iconBgMap = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    purple: 'bg-purple-600 text-white',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl shadow-sm ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${colorMap[color]}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
