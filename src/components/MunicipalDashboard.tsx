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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  Search,
  Eye,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { CivicIncident, SummaryStats } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface MunicipalDashboardProps {
  incidents: CivicIncident[];
  stats?: SummaryStats;
  onSelectIncident: (incident: CivicIncident) => void;
  onUpdateStatus: (
    id: string,
    status: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved',
    crew?: string
  ) => void;
  onViewOnMap: (incident: CivicIncident) => void;
}

export const MunicipalDashboard: React.FC<MunicipalDashboardProps> = ({
  incidents,
  stats,
  onSelectIncident,
  onUpdateStatus,
  onViewOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter & Search
  const filteredIncidents = incidents.filter((incident) => {
    if (filterCategory !== 'All' && incident.category !== filterCategory) return false;
    if (filterPriority !== 'All' && incident.priorityLabel !== filterPriority) return false;
    if (filterStatus !== 'All' && incident.status !== filterStatus) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const match =
        incident.title.toLowerCase().includes(q) ||
        incident.id.toLowerCase().includes(q) ||
        incident.locationName.toLowerCase().includes(q) ||
        incident.assignedDepartment.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort descending by priority score
  filteredIncidents.sort((a, b) => b.priorityScore - a.priorityScore);

  // Prepare Chart 1: Issue Distribution by Category
  const categoriesList = ['Pothole', 'Water Leakage', 'Drainage', 'Garbage', 'Broken Streetlight', 'Other'];
  const categoryCounts = categoriesList.map(
    (cat) => incidents.filter((i) => i.category === cat).length
  );

  const categoryBarData = {
    labels: ['Pothole', 'Water Leak', 'Drainage', 'Garbage', 'Streetlight', 'Other'],
    datasets: [
      {
        label: 'Active Incident Count',
        data: categoryCounts,
        backgroundColor: [
          'rgba(245, 158, 11, 0.85)', // Amber
          'rgba(2, 132, 199, 0.85)',  // Sky
          'rgba(99, 102, 241, 0.85)', // Indigo
          'rgba(239, 68, 68, 0.85)',  // Rose
          'rgba(168, 85, 247, 0.85)', // Purple
          'rgba(100, 116, 139, 0.85)',// Slate
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

  // Prepare Chart 2: Workflow Status Breakdown
  const statusCounts = [
    incidents.filter((i) => i.status === 'Reported').length,
    incidents.filter((i) => i.status === 'Assigned').length,
    incidents.filter((i) => i.status === 'In Progress').length,
    incidents.filter((i) => i.status === 'Resolved').length,
  ];

  const statusDoughnutData = {
    labels: ['Reported', 'Assigned', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: statusCounts,
        backgroundColor: [
          '#94a3b8', // Slate for Reported
          '#f59e0b', // Amber for Assigned
          '#0284c7', // Sky for In Progress
          '#10b981', // Emerald for Resolved
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
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

  const handleStatusChange = async (
    incidentId: string,
    newStatus: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved'
  ) => {
    setUpdatingId(incidentId);
    try {
      await onUpdateStatus(incidentId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Municipal Dispatch Command Center
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live operational triage, automated severity scoring, and dynamic field crew assignment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 shadow-xs">
              Total Queue: <strong>{incidents.length}</strong>
            </span>
            <span className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 px-3 py-1.5 font-bold text-red-700 dark:text-red-300 shadow-xs">
              P0 Critical: <strong>{stats?.criticalCount ?? 0}</strong>
            </span>
            <span className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
              Resolved: <strong>{stats?.resolvedRate ?? 0}%</strong>
            </span>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total City Incidents
              </span>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/50 p-2 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/50">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{incidents.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From citizen &amp; sensor intake</p>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Critical P0 Queue
              </span>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 p-2 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{stats?.criticalCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Require immediate dispatch</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Resolved Rate
              </span>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.resolvedRate ?? 0}%
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {stats?.resolvedCount ?? 0} tickets remediated
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Duplicate Reduction
              </span>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 p-2 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700 dark:text-purple-400">
              {stats?.duplicateClustersCount ?? 0} Clusters
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Noise filtered via GIS radius</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Chart 1: Category Distribution Bar */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Incident Volume by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across municipal service wings</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <Bar data={categoryBarData} options={categoryBarOptions} />
            </div>
          </div>

          {/* Chart 2: Status Breakdown Doughnut */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Workflow Status Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time lifecycle pipeline</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <Doughnut data={statusDoughnutData} options={statusDoughnutOptions} />
            </div>
          </div>
        </div>

        {/* Dispatch Filter & Operational Table */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
          {/* Table Header & Search/Filters */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by ID, title, locality, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {['All', 'Pothole', 'Water Leakage', 'Drainage', 'Garbage', 'Broken Streetlight', 'Other'].map(
                    (cat) => (
                      <option key={cat} value={cat} className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                    <option key={p} value={p} className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {['All', 'Reported', 'Assigned', 'In Progress', 'Resolved'].map((s) => (
                    <option key={s} value={s} className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Operational Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Priority / ID</th>
                  <th className="py-3.5 px-4">Title &amp; Locality</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Duplicates</th>
                  <th className="py-3.5 px-4">Department / Crew</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No matching incidents found in queue.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => {
                    const isCritical = incident.priorityLabel === 'Critical';
                    const isHigh = incident.priorityLabel === 'High';

                    return (
                      <tr
                        key={incident.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Priority / ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                isCritical
                                  ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                  : isHigh
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {incident.priorityScore}
                            </span>
                            <div>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {incident.id}
                              </span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                                {incident.priorityLabel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Title & Locality */}
                        <td className="py-3 px-4 max-w-xs">
                          <button
                            onClick={() => onSelectIncident(incident)}
                            className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left line-clamp-1"
                          >
                            {incident.title}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            📍 {incident.locationName}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {incident.category}
                          </span>
                        </td>

                        {/* Duplicates */}
                        <td className="py-3 px-4">
                          {incident.duplicateCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              +{incident.duplicateCount} merged
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">Unique</span>
                          )}
                        </td>

                        {/* Department / Crew */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                            {incident.assignedDepartment}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {incident.assignedCrew || 'Unassigned'}
                          </div>
                        </td>

                        {/* Workflow Status Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={incident.status}
                            disabled={updatingId === incident.id}
                            onChange={(e) =>
                              handleStatusChange(
                                incident.id,
                                e.target.value as any
                              )
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                              incident.status === 'Resolved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : incident.status === 'In Progress'
                                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                : incident.status === 'Assigned'
                                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="Reported" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Reported</option>
                            <option value="Assigned" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Assigned</option>
                            <option value="In Progress" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">In Progress</option>
                            <option value="Resolved" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Resolved</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewOnMap(incident)}
                              title="Locate on GIS Map"
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => onSelectIncident(incident)}
                              title="Inspect Details"
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
