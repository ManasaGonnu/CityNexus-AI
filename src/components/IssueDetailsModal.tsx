import React, { useState } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ThumbsUp,
  Loader2,
} from 'lucide-react';
import { CivicIncident, updateIssueStatus, voteIssue, SummaryStats } from '../utils/api';

interface IssueDetailsModalProps {
  isOpen: boolean;
  incident: CivicIncident | null;
  onClose: () => void;
  onUpdateSuccess: (updated: CivicIncident, stats: SummaryStats) => void;
  onLocateOnMap: (incident: CivicIncident) => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  isOpen,
  incident,
  onClose,
  onUpdateSuccess,
  onLocateOnMap,
}) => {
  if (!isOpen || !incident) return null;

  const [selectedStatus, setSelectedStatus] = useState<
    'Reported' | 'Assigned' | 'In Progress' | 'Resolved'
  >(incident.status);
  const [assignedCrew, setAssignedCrew] = useState<string>(incident.assignedCrew || '');
  const [assignedDept, setAssignedDept] = useState<string>(incident.assignedDepartment || '');
  const [dispatcherNote, setDispatcherNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [votes, setVotes] = useState<number>(incident.citizenVotes || 1);
  const [hasVoted, setHasVoted] = useState(false);

  const isCritical = incident.priorityLabel === 'Critical';
  const isHigh = incident.priorityLabel === 'High';

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await updateIssueStatus(incident.id, {
        status: selectedStatus,
        assignedDepartment: assignedDept,
        assignedCrew: assignedCrew,
        note: dispatcherNote || undefined,
        actor: 'Municipal Dispatch Lead',
      });
      if (res.success && res.data) {
        onUpdateSuccess(res.data, res.stats);
        setDispatcherNote('');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVote = async () => {
    if (hasVoted) return;
    try {
      const res = await voteIssue(incident.id);
      if (res.success) {
        setVotes(res.votes);
        setHasVoted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${
                isCritical
                  ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse'
                  : isHigh
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {incident.priorityScore}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{incident.title}</h2>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {incident.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                <span>{incident.locationName}</span>
                {incident.isNearTransit && (
                  <span className="text-sky-700 dark:text-sky-300 font-semibold">• 🚇 {incident.transitCorridor}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLocateOnMap(incident)}
              title="Fly to location on GIS Map"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              Locate on Map
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Visual & Diagnostics */}
            <div className="space-y-4 lg:col-span-7">
              {/* Image & Badges */}
              <div className="relative h-60 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={incident.imageUrl}
                  alt={incident.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-xs border border-slate-200 dark:border-slate-700">
                    {incident.category}
                  </span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold backdrop-blur-md shadow-xs ${
                      isCritical
                        ? 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-white/95 dark:bg-slate-900/95 text-amber-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Severity: {incident.severity}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={handleVote}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all shadow-xs ${
                      hasVoted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{votes} Citizen Endorsements</span>
                  </button>
                </div>
              </div>

              {/* Citizen Description */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Citizen Observation
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {incident.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/80 pt-2">
                  <span>Reported by: <strong className="text-slate-800 dark:text-slate-200">{incident.reportedBy}</strong></span>
                  <span>{new Date(incident.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* AI Triage Diagnostics */}
              <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/50 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                      Automated Triage Assessment
                    </span>
                  </div>
                  <span className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
                    {Math.round(incident.confidence * 100)}% Confidence
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Structural Threat Analysis:
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900 shadow-xs">
                    {incident.reason}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Potential Cascading Risk:
                  </p>
                  <p className="mt-1 text-xs text-amber-900 dark:text-amber-200 leading-relaxed bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
                    {incident.potentialUrbanRisk}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Recommended Municipal Dispatch Action:
                  </p>
                  <p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    {incident.recommendedAction}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Score Breakdown & Dispatch Controls */}
            <div className="space-y-4 lg:col-span-5">
              {/* Score Composition Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Priority Score Composition
                  </span>
                  <span className="text-xs font-black text-red-600 dark:text-red-400">
                    {incident.priorityScore} / 100
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Base Severity Factor</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      +{incident.severity === 'Critical' ? 40 : incident.severity === 'High' ? 30 : incident.severity === 'Medium' ? 20 : 10} pts ({incident.severity})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Duplicate Volume Boost</span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      +{Math.min(incident.duplicateCount * 5, 20)} pts ({incident.duplicateCount} duplicates)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Transit Corridor Proximity</span>
                    <span className="font-semibold text-sky-700 dark:text-sky-300">
                      {incident.isNearTransit ? '+15 pts' : '0 pts'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Safety Hazard Index</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      +{Math.round((incident.safetyFactorScore || 0.6) * 25)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Municipal Dispatch Controls */}
              <form
                onSubmit={handleStatusSubmit}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Municipal Dispatch Controls
                  </span>
                  <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    Lead Authority
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Workflow Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Reported" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Reported</option>
                    <option value="Assigned" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Assigned</option>
                    <option value="In Progress" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">In Progress</option>
                    <option value="Resolved" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Assigned Department
                  </label>
                  <input
                    type="text"
                    value={assignedDept}
                    onChange={(e) => setAssignedDept(e.target.value)}
                    placeholder="e.g. Roads &amp; Asphalt Division"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Assigned Field Crew
                  </label>
                  <input
                    type="text"
                    value={assignedCrew}
                    onChange={(e) => setAssignedCrew(e.target.value)}
                    placeholder="e.g. Rapid Remediation Crew #4"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Dispatcher Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={dispatcherNote}
                    onChange={(e) => setDispatcherNote(e.target.value)}
                    placeholder="Add operational notes or dispatch confirmation..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-sky-500 transition-all shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  <span>Save Status &amp; Dispatch Update</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
