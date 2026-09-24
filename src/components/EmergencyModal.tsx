import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Loader2,
  ArrowRight,
  BellRing,
} from 'lucide-react';
import { User } from '../types/auth';
import { CivicIncident, createIssue, updateIssueStatus } from '../utils/api';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  criticalIncidents: CivicIncident[];
  onEmergencyReported: (newIncident: CivicIncident) => void;
  onDispatchCritical: (incidentId: string, crew: string) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  user,
  criticalIncidents,
  onEmergencyReported,
  onDispatchCritical,
}) => {
  if (!isOpen) return null;

  const [selectedEmergencyPreset, setSelectedEmergencyPreset] = useState<number | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencySuccess, setEmergencySuccess] = useState(false);
  const [assignedCrewInput, setAssignedCrewInput] = useState('Emergency Unit Alpha-1');

  const emergencyHazards = [
    {
      title: 'Active High-Voltage Exposed Wire Dangling Near Pedestrians',
      category: 'Broken Streetlight',
      desc: 'Severed 240V live power conductor swinging 4 feet above pedestrian crosswalk. Severe electrocution danger.',
      loc: 'Van Ness Ave & McAllister St',
      coords: { lat: 37.7791, lng: -122.4208 },
      icon: Zap,
      color: 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/40 text-red-700 dark:text-red-300',
    },
    {
      title: 'High-Pressure Subterranean Water Main Rupture',
      category: 'Water Leakage',
      desc: 'Massive clean water geyser undermining road asphalt beneath light rail tracks. Immediate sinkhole collapse risk.',
      loc: 'Market St & 4th Street',
      coords: { lat: 37.7842, lng: -122.4069 },
      icon: Droplets,
      color: 'border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    },
    {
      title: 'Toxic Gas / Chemical Fume Discharge in Urban Alleyway',
      category: 'Garbage',
      desc: 'Pungent chemical vapor spreading from punctured industrial solvent barrels. Residents experiencing stinging eyes.',
      loc: 'Grant Ave & Commercial St',
      coords: { lat: 37.7955, lng: -122.4072 },
      icon: Flame,
      color: 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
    },
    {
      title: 'Total Roadbed Collapse / Deep Arterial Cavity in Bus Lane',
      category: 'Pothole',
      desc: '4-meter road depression spanning two lanes. Impassable for emergency vehicles; risk of vehicle rollover.',
      loc: '16th St & Mission St',
      coords: { lat: 37.7649, lng: -122.4194 },
      icon: AlertTriangle,
      color: 'border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    },
  ];

  const handle1TapEmergencySubmit = async (idx: number) => {
    const hazard = emergencyHazards[idx];
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', `[EMERGENCY P0 SOS] ${hazard.title}`);
      formData.append('description', hazard.desc + (customDescription ? ` Note: ${customDescription}` : ''));
      formData.append('category', hazard.category);
      formData.append('locationName', hazard.loc);
      formData.append('lat', String(hazard.coords.lat));
      formData.append('lng', String(hazard.coords.lng));
      formData.append('reportedBy', `${user.name} (Citizen SOS)`);

      const res = await createIssue(formData);
      if (res.success && res.data) {
        onEmergencyReported(res.data);
        setEmergencySuccess(true);
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-red-950 dark:text-red-100">Emergency SOS Response Hub</h2>
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                  PRIORITY 0
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                {user.role === 'admin'
                  ? 'Municipal Rapid Triage & Emergency Unit Dispatch'
                  : 'Instant hazard trigger for acute public safety threats'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {emergencySuccess ? (
            <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                P0 Critical SOS Broadcasted!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Your emergency report has triggered an immediate alert on the Municipal Dispatch Command dashboard and received the highest priority routing score.
              </p>

              <button
                onClick={() => {
                  setEmergencySuccess(false);
                  onClose();
                }}
                className="mt-4 rounded-xl bg-slate-900 dark:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                Close Emergency Hub
              </button>
            </div>
          ) : user.role === 'citizen' ? (
            /* Citizen 1-Tap Quick Hazard Triggers */
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  Select Acute Hazard for Instant 1-Tap Dispatch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap any live hazard scenario below to immediately bypass standard queues:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emergencyHazards.map((hazard, idx) => {
                  const Icon = hazard.icon;
                  return (
                    <button
                      key={hazard.title}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handle1TapEmergencySubmit(idx)}
                      className={`text-left rounded-2xl border p-4 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs ${hazard.color}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-xl p-2 bg-white/80 dark:bg-slate-800/80 shrink-0 shadow-xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold leading-snug line-clamp-2">
                            {hazard.title}
                          </h4>
                          <p className="mt-1 text-[11px] opacity-80 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{hazard.loc}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom note */}
              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Optional Additional Notes or Immediate Landmarks
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near metro pillar 42, sparking repeatedly..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-400 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {isSubmitting && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  <span>Transmitting High-Priority P0 Alert to Municipal Dispatch...</span>
                </div>
              )}
            </div>
          ) : (
            /* Municipal Admin Emergency Management View */
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                  Active Unassigned Critical P0 Incidents ({criticalIncidents.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant rapid-response dispatch controls for acute structural threats
                </p>
              </div>

              <div className="space-y-3">
                {criticalIncidents.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    All critical emergency threats have been assigned and dispatched!
                  </div>
                ) : (
                  criticalIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/30 p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">
                              {incident.id}
                            </span>
                            <span className="rounded bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2">
                              SCORE {incident.priorityScore}
                            </span>
                          </div>
                          <h4 className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{incident.title}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">📍 {incident.locationName}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40">
                        {incident.description}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-red-100 dark:border-red-900/40">
                        <input
                          type="text"
                          value={assignedCrewInput}
                          onChange={(e) => setAssignedCrewInput(e.target.value)}
                          placeholder="Assign Emergency Crew..."
                          className="w-full sm:flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onDispatchCritical(incident.id, assignedCrewInput);
                            onClose();
                          }}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-xs shrink-0"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Dispatch Immediate Crew</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>Direct Municipal Emergency Routing Active</span>
          </div>

          <button
            onClick={onClose}
            className="font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
