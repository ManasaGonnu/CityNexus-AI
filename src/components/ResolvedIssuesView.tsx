import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Building2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Filter,
  Zap,
  Check,
  AlertTriangle,
  Send,
  Eye,
} from 'lucide-react';
import { CivicIncident } from '../utils/api';

interface ResolveIssuesViewProps {
  incidents: CivicIncident[];
  onSelectIncident: (incident: CivicIncident) => void;
  onUpdateStatus?: (
    id: string,
    status: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved',
    crew?: string
  ) => void;
}

export const ResolvedIssuesView: React.FC<ResolveIssuesViewProps> = ({
  incidents,
  onSelectIncident,
  onUpdateStatus,
}) => {
  const [activeQueueTab, setActiveQueueTab] = useState<'pending' | 'resolved'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const pendingIssues = incidents.filter((i) => i.status !== 'Resolved');
  const resolvedIssues = incidents.filter((i) => i.status === 'Resolved');

  const currentList = activeQueueTab === 'pending' ? pendingIssues : resolvedIssues;

  const departments = Array.from(
    new Set(incidents.map((i) => i.assignedDepartment).filter(Boolean))
  );

  const filtered = currentList.filter((i) => {
    if (deptFilter !== 'All' && i.assignedDepartment !== deptFilter) return false;
    if (priorityFilter !== 'All' && i.priorityLabel !== priorityFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.locationName.toLowerCase().includes(q) ||
        i.assignedDepartment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickResolve = async (incidentId: string) => {
    if (!onUpdateStatus) return;
    setResolvingId(incidentId);
    try {
      await onUpdateStatus(incidentId, 'Resolved', 'Field Inspection Completed');
    } finally {
      setResolvingId(null);
    }
  };

  const handleQuickDispatch = async (incidentId: string) => {
    if (!onUpdateStatus) return;
    setResolvingId(incidentId);
    try {
      await onUpdateStatus(incidentId, 'In Progress', 'Rapid Remediation Unit #1');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Resolve Issue Command Queue
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Dedicated officer queue to review citizen complaints, dispatch emergency units, and verify resolution
            </p>
          </div>

          {/* Queue Tab Selector (Pending Triage vs. Resolved Archive) */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1.5 border border-slate-300/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveQueueTab('pending')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Pending Resolution</span>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {pendingIssues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveQueueTab('resolved')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Resolved Archive</span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {resolvedIssues.length}
              </span>
            </button>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Action Queue
            </p>
            <p className="mt-2 text-3xl font-black text-indigo-700 dark:text-indigo-400">{pendingIssues.length} Tickets</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awaiting officer action &amp; dispatch</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Successfully Remediated
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{resolvedIssues.length} Closed</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Verified by municipal leads</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Turnaround SLA
            </p>
            <p className="mt-2 text-3xl font-black text-sky-700 dark:text-sky-400">2.4 Hours</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target municipal SLA &lt;4.0 hrs</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, title, locality, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d} className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">All Priorities</option>
                <option value="Critical" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Critical P0</option>
                <option value="High" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">High P1</option>
                <option value="Medium" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Medium</option>
                <option value="Low" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Queue Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-60" />
              No issues found in this queue matching your filter criteria.
            </div>
          ) : (
            filtered.map((item) => {
              const isResolved = item.status === 'Resolved';
              const isCritical = item.priorityLabel === 'Critical';

              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            isCritical
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {item.priorityScore}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.id}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isResolved
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : item.status === 'In Progress'
                            ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {isResolved && <CheckCircle2 className="h-3 w-3" />}
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectIncident(item)}
                      className="mt-3 text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{item.locationName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{item.assignedDepartment}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>Updated: {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Officer Action Controls */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectIncident(item)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Inspect</span>
                    </button>

                    {!isResolved ? (
                      <div className="flex items-center gap-1.5">
                        {item.status !== 'In Progress' && (
                          <button
                            disabled={resolvingId === item.id}
                            onClick={() => handleQuickDispatch(item.id)}
                            className="flex items-center gap-1 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/70 transition-colors shadow-xs"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Dispatch</span>
                          </button>
                        )}

                        <button
                          disabled={resolvingId === item.id}
                          onClick={() => handleQuickResolve(item.id)}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Remediation Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
