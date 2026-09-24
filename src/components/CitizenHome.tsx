import React from 'react';
import {
  Activity,
  Zap,
  Mic,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { User } from '../types/auth';
import { CivicIncident, SummaryStats } from '../utils/api';

interface CitizenHomeProps {
  user: User;
  stats?: SummaryStats;
  recentIncidents: CivicIncident[];
  onOpenReportModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenEmergencyModal: () => void;
  onNavigateToMap: () => void;
  onSelectIncident: (incident: CivicIncident) => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  user,
  stats,
  recentIncidents,
  onOpenReportModal,
  onOpenVoiceModal,
  onOpenEmergencyModal,
  onNavigateToMap,
  onSelectIncident,
}) => {
  const activeIssues = recentIncidents.filter((i) => i.status !== 'Resolved').slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* Welcome Hero Banner with Modern Eco-Metropolis Background */}
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
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 dark:border-sky-800 dark:bg-sky-950/70 px-3.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-300 backdrop-blur-xs">
                  <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Civic Engagement &amp; Real-Time Action</span>
                </div>
                <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome, {user.name}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                  Report infrastructure hazards, track live municipal crew repairs in your neighborhood, and stay informed with real-time urban updates.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={onOpenReportModal}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-500 hover:to-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span>Report Issue</span>
                </button>

                <button
                  onClick={onOpenVoiceModal}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm transition-all"
                >
                  <Mic className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>AI Assistant</span>
                </button>

                <button
                  onClick={onOpenEmergencyModal}
                  className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all shadow-sm"
                >
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
                  <span>Emergency SOS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Citizen Personal Impact & City Health Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Neighborhood Health
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
                Resolved in City
              </span>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/50 p-2 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/50">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-sky-700 dark:text-sky-400">
              {stats?.resolvedCount ?? 12}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Verified resolved tickets</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Avg Response Time
              </span>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 p-2 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">14.8 min</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From submission to dispatch</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Reports
              </span>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 p-2 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700 dark:text-purple-400">
              {stats?.total ?? recentIncidents.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monitored urban incidents</p>
          </div>
        </div>

        {/* 2-Column Split: Active Reports in Your Area + How It Works */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Active Issues in City */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Issues in Your Area
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time municipal priority queue
                </p>
              </div>

              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
              >
                <span>View Full Map</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {activeIssues.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No active issues at this time.
                </div>
              ) : (
                activeIssues.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          incident.priorityLabel === 'Critical'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : incident.priorityLabel === 'High'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {incident.priorityScore}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {incident.id}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {incident.category}
                          </span>
                          {incident.isNearTransit && (
                            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-100 dark:border-sky-800">
                              Transit Line
                            </span>
                          )}
                        </div>
                        <h3 className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                          {incident.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          📍 {incident.locationName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                          incident.status === 'In Progress'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : incident.status === 'Assigned'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {incident.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guide & Features */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Civic Reporting Workflow
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                How your reports reach the municipal dispatch team
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/70 text-xs font-bold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Submit Observation</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Take a photo or speak with our AI Assistant to capture the hazard and location.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Algorithmic Triage</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      The system calculates risk scores, identifies duplicates within 150m, and checks transit proximity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dispatch &amp; Resolution</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Field crews receive the ticket and update status transparently until verified resolved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Info Callout */}
            <div className="rounded-3xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-5 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <ShieldAlert className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Acute Emergency?</h4>
              </div>
              <p className="mt-1.5 text-xs text-red-900 dark:text-red-200 leading-relaxed">
                For fallen power lines, severe gas leaks, or water mains undermining roads, use <strong>Emergency SOS</strong> for instant priority dispatch.
              </p>
              <button
                onClick={onOpenEmergencyModal}
                className="mt-3 w-full rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs"
              >
                Open Emergency SOS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
