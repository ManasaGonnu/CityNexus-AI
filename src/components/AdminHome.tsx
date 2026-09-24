import React from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Activity,
  Flame,
} from 'lucide-react';
import { User } from '../types/auth';
import { CivicIncident, SummaryStats } from '../utils/api';

interface AdminHomeProps {
  user: User;
  stats?: SummaryStats;
  incidents: CivicIncident[];
  onNavigateToDashboard: () => void;
  onNavigateToMap: () => void;
  onNavigateToEmergency: () => void;
  onNavigateToResolved: () => void;
  onSelectIncident: (incident: CivicIncident) => void;
}

export const AdminHome: React.FC<AdminHomeProps> = ({
  user,
  stats,
  incidents,
  onNavigateToDashboard,
  onNavigateToMap,
  onNavigateToEmergency,
  onNavigateToResolved,
  onSelectIncident,
}) => {
  const criticalUnassigned = incidents.filter(
    (i) => i.priorityLabel === 'Critical' && i.status === 'Reported'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* Executive Welcome Hero Banner with Modern Eco-Metropolis Background */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dynamic Translucent Frosted Glass Overlay */}
          <div className="w-full h-full p-6 sm:p-10 bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm dark:bg-slate-950/80 dark:backdrop-blur-md dark:border-slate-800 transition-colors">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 dark:border-indigo-800 dark:bg-indigo-950/70 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 backdrop-blur-xs">
                  <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Municipal Decision Support &amp; Field Coordination</span>
                </div>
                <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome, {user.name}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                  Command Terminal &bull; Department: <strong className="text-indigo-700 dark:text-indigo-400">{user.department || 'Urban Infrastructure & Operations'}</strong>.
                  Automated geospatial prioritization has clustered {stats?.duplicateClustersCount ?? 6} duplicate report zones and highlighted acute infrastructure risks.
                </p>
              </div>

              {/* Quick Navigation Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={onNavigateToDashboard}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-sky-500 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Activity className="h-4 w-4" />
                  <span>Open Dispatch Dashboard</span>
                </button>

                <button
                  onClick={onNavigateToEmergency}
                  className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all shadow-sm"
                >
                  <Flame className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
                  <span>Emergency Hub ({criticalUnassigned.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Executive Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Critical P0 Unassigned
              </span>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 p-2 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">{criticalUnassigned.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Require immediate crew dispatch</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Priority Queue
              </span>
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-2 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{incidents.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total municipal tickets tracked</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Duplicate Reduction Rate
              </span>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 p-2 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700 dark:text-purple-400">65% Less Noise</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clustered via 150m radius</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Municipal SLA Compliance
              </span>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">99.2%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Full audit log &amp; timestamp retention</p>
          </div>
        </div>

        {/* 4 Feature Module Jump Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={onNavigateToDashboard}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-2.5 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Module 01</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Priority Dispatch Queue
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Triage and assign municipal field crews, filter by severity, and adjust workflow statuses.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Open Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToMap}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-sky-50 dark:bg-sky-950/50 p-2.5 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Module 02</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                City Risk Map
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Full GIS map with pulsating P0 markers, transit corridor lines, and inline dispatch triggers.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
              <span>Open GIS Map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToEmergency}
            className="group cursor-pointer rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 p-5 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-red-100 dark:bg-red-950/60 p-2.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <Flame className="h-5 w-5 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">SOS Hub</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                Emergency Radar Hub
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Live radar for acute life & infrastructure emergencies requiring immediate unit deployment.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400">
              <span>Inspect Emergencies</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToResolved}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-2.5 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Module 04</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Resolved Issues Archive
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Historical records, resolution turnaround analytics, and verifiable before/after data.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>View Archive</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
