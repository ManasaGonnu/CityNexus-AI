import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Building2,
  LogOut,
  Mail,
  Shield,
  Activity,
} from 'lucide-react';
import { User, getMonogram } from '../types/auth';
import { CivicIncident } from '../utils/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSignOut: () => void;
  incidents: CivicIncident[];
  onSelectIncident: (incident: CivicIncident) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
  incidents,
  onSelectIncident,
}) => {
  if (!isOpen) return null;

  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'in-progress' | 'resolved'>('all');
  const monogram = getMonogram(user.name, user.email);

  // Filter citizen incidents
  const userIncidents = incidents.filter((inc) => {
    if (user.role === 'citizen') {
      const firstName = user.name.toLowerCase().split(' ')[0];
      return (
        inc.reportedBy?.toLowerCase().includes(firstName) ||
        (user.phone && inc.reportedBy?.includes(user.phone.slice(-6))) ||
        inc.reportedBy?.toLowerCase().includes('citizen') ||
        inc.id.includes('1001') ||
        inc.id.includes('1002') ||
        inc.id.includes('1003')
      );
    }
    return true;
  });

  const filteredLedger = userIncidents.filter((inc) => {
    if (ledgerFilter === 'in-progress') {
      return inc.status === 'In Progress' || inc.status === 'Assigned' || inc.status === 'Reported';
    }
    if (ledgerFilter === 'resolved') {
      return inc.status === 'Resolved';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative h-full w-full max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
              {user.role === 'admin' ? <Building2 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {user.role === 'admin' ? 'Municipal Officer Profile' : 'Verified Citizen Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Info Card with Dynamic Monogram */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xl shadow-sm ring-4 ring-white dark:ring-slate-800">
                {monogram}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      user.role === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Municipal Authority' : 'Verified Citizen'}
                  </span>
                  {user.officerBadge && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      [{user.officerBadge}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{user.phone ? `${user.phone} • ` : ''}{user.email}</span>
                </p>
              </div>
            </div>

            {user.role === 'admin' ? (
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Department</span>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300 text-xs mt-0.5 block truncate">
                    {user.department || 'Public Works'}
                  </span>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Resolved Shift</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    {user.resolvedCount || 84} tickets
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Community Impact</span>
                  <span className="font-bold text-sky-700 dark:text-sky-300 text-xs mt-0.5 block">Top 5% Contributor</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Member Since</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs mt-0.5 block">{user.joinedDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Citizen: "My Reported Issues" Ledger */}
          {user.role === 'citizen' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  My Reported Civic Issues
                </h4>
                <div className="flex gap-1">
                  {(['all', 'in-progress', 'resolved'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLedgerFilter(filter)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                        ledgerFilter === filter
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredLedger.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No tickets found under current filter.
                  </div>
                ) : (
                  filteredLedger.map((item) => {
                    const statusSteps = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
                    const currentIdx = statusSteps.indexOf(item.status);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectIncident(item);
                          onClose();
                        }}
                        className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3.5 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition-all shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                {item.id}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {item.category}
                              </span>
                            </div>
                            <h5 className="mt-1 text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              📍 {item.locationName}
                            </p>
                          </div>

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              item.status === 'Resolved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : item.status === 'In Progress'
                                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Step Progress Visualizer */}
                        <div className="mt-3 border-t border-slate-100 dark:border-slate-700/80 pt-2.5">
                          <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 mb-1">
                            {statusSteps.map((step, idx) => (
                              <span
                                key={step}
                                className={`font-semibold ${
                                  idx <= currentIdx ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-600'
                                }`}
                              >
                                {step}
                              </span>
                            ))}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                              style={{
                                width: `${((currentIdx + 1) / statusSteps.length) * 100}%`,
                              }}
                            />
                          </div>
                          {item.auditTrail && item.auditTrail.length > 0 && (
                            <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              • Latest: {item.auditTrail[item.auditTrail.length - 1].action}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Admin Shift Metrics & Department Overview */
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Officer Operational Readiness
              </h4>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 space-y-3 text-xs shadow-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/80">
                  <span className="text-slate-500 dark:text-slate-400">Duty Dispatch Level:</span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">Class-1 Rapid Response</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/80">
                  <span className="text-slate-500 dark:text-slate-400">Active High-Priority Tickets:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{user.activeAssignedCount || 7} pending</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/80">
                  <span className="text-slate-500 dark:text-slate-400">Average Turnaround SLA:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">14.2 min (Target &lt;15m)</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Municipal Service SLA Index:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">99.2% Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Sign Out Button */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/60">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 py-2.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shadow-xs"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out of CityNexus AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
