import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Activity,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { CivicIncident, SummaryStats } from '../utils/api';
import { User } from '../types/auth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CitizenDashboardProps {
  user: User;
  incidents: CivicIncident[];
  stats?: SummaryStats;
  onSelectIncident: (incident: CivicIncident) => void;
  onOpenReportModal: () => void;
  onNavigateToMap: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  user,
  incidents,
  stats,
  onSelectIncident,
  onOpenReportModal,
  onNavigateToMap,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Chart 1: Issue Trends by Category
  const categoriesList = ['Pothole', 'Water Leakage', 'Drainage', 'Garbage', 'Broken Streetlight', 'Other'];
  const categoryCounts = categoriesList.map(
    (cat) => incidents.filter((i) => i.category === cat).length
  );

  const categoryBarData = {
    labels: ['Pothole', 'Water Leak', 'Drainage', 'Garbage', 'Streetlight', 'Other'],
    datasets: [
      {
        label: 'Community Reports',
        data: categoryCounts,
        backgroundColor: [
          'rgba(245, 158, 11, 0.85)',
          'rgba(2, 132, 199, 0.85)',
          'rgba(99, 102, 241, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(168, 85, 247, 0.85)',
          'rgba(100, 116, 139, 0.85)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const categoryBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#64748b', font: { size: 11 }, precision: 0 },
      },
    },
  };

  // Chart 2: Resolution Status Breakdown
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const inProgressCount = incidents.filter((i) => i.status === 'In Progress').length;
  const assignedCount = incidents.filter((i) => i.status === 'Assigned').length;
  const reportedCount = incidents.filter((i) => i.status === 'Reported').length;

  const statusDoughnutData = {
    labels: ['Reported', 'Assigned', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [reportedCount, assignedCount, inProgressCount, resolvedCount],
        backgroundColor: ['#94a3b8', '#f59e0b', '#0284c7', '#10b981'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const statusDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#64748b',
          font: { size: 11 },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
      },
    },
    cutout: '70%',
  };

  const filteredIncidents = incidents.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Citizen Civic Dashboard &amp; Analytics
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live neighborhood city health metrics, incident category trends, and municipal remediation status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-500 hover:to-indigo-500 transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Report An Issue</span>
            </button>
          </div>
        </div>

        {/* 4 Core Health Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                City Health Index
              </span>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">94.8%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active municipal repair coverage</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Remediated In City
              </span>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.resolvedCount ?? resolvedCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Verified resolved complaints</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Average Response Time
              </span>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/50 p-2 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/50">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-sky-700 dark:text-sky-400">14.8 min</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From filing to triage dispatch</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Issues Monitored
              </span>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 p-2 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700 dark:text-purple-400">{incidents.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real-time tracked hazards</p>
          </div>
        </div>

        {/* Charts: Trends by Category & Status Breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Community Incident Volume by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time distribution of urban reports filed across city zones
            </p>
            <div className="h-64 w-full">
              <Bar data={categoryBarData} options={categoryBarOptions} />
            </div>
          </div>

          <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Remediation Lifecycle Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Current progress of city issues</p>
            <div className="h-64 w-full flex items-center justify-center">
              <Doughnut data={statusDoughnutData} options={statusDoughnutOptions} />
            </div>
          </div>
        </div>

        {/* Community Reports List */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Neighborhood Issues &amp; Triage Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live priority ranked civic queue</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>View on Map</span>
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIncidents.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectIncident(item)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      item.priorityLabel === 'Critical'
                        ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : item.priorityLabel === 'High'
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {item.priorityScore}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{item.id}</span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{item.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      📍 {item.locationName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${
                      item.status === 'Resolved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : item.status === 'In Progress'
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
