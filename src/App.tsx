import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { CitizenHome } from './components/CitizenHome';
import { AdminHome } from './components/AdminHome';
import { CityMap } from './components/CityMap';
import { MunicipalDashboard } from './components/MunicipalDashboard';
import { CitizenDashboard } from './components/CitizenDashboard';
import { ResolvedIssuesView } from './components/ResolvedIssuesView';
import { ReportIssueModal } from './components/ReportIssueModal';
import { IssueDetailsModal } from './components/IssueDetailsModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { EmergencyModal } from './components/EmergencyModal';
import { UserProfileModal } from './components/UserProfileModal';
import { User } from './types/auth';
import {
  fetchIssues,
  resetDatabase,
  CivicIncident,
  SummaryStats,
  TransitCorridor,
  updateIssueStatus,
} from './utils/api';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'citynexus_auth';

export default function App() {
  // Authentication session state backed by LocalStorage ('citynexus_auth')
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved =
        localStorage.getItem('citynexus_auth') ||
        localStorage.getItem('citynexus_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Role-based active tab state
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved =
        localStorage.getItem('citynexus_auth') ||
        localStorage.getItem('citynexus_user_session');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'admin' ? 'admin-home' : 'citizen-home';
      }
    } catch {}
    return 'citizen-home';
  });

  const [incidents, setIncidents] = useState<CivicIncident[]>([]);
  const [stats, setStats] = useState<SummaryStats | undefined>(undefined);
  const [transitCorridors, setTransitCorridors] = useState<TransitCorridor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<CivicIncident | null>(null);
  const [selectedMapIncidentId, setSelectedMapIncidentId] = useState<string | null>(null);

  // Preload state for Report Modal
  const [reportPreloadData, setReportPreloadData] = useState<{
    title?: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    locationName?: string;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Load telemetry from backend
  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await fetchIssues();
      if (res.success) {
        setIncidents(res.data);
        setStats(res.stats);
        setTransitCorridors(res.transitCorridors || []);
      }
    } catch (err: any) {
      console.error('Failed to load incidents:', err);
      showToast('Could not load telemetry feed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('citynexus_auth', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    const targetTab = user.role === 'admin' ? 'admin-home' : 'citizen-home';
    setCurrentTab(targetTab);
    showToast(`Signed in as ${user.name} (${user.role === 'admin' ? 'Municipal Officer' : 'Citizen'})`);
  };

  // Handle Sign Out
  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('citynexus_auth');
      localStorage.removeItem('citynexus_user_session');
    } catch (e) {}
    showToast('Signed out successfully.');
  };

  // Handle new issue created (normal, AI-assistant, or SOS)
  const handleIssueCreated = (newIncident: CivicIncident) => {
    setIncidents((prev) => [newIncident, ...prev.filter((i) => i.id !== newIncident.id)]);
    loadIncidents();
    showToast(`Ticket ${newIncident.id} registered! Priority: ${newIncident.priorityScore} (${newIncident.priorityLabel})`);
    setSelectedIncident(newIncident);
  };

  // Handle status update
  const handleUpdateStatus = async (
    id: string,
    status: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved',
    crew?: string
  ) => {
    try {
      const res = await updateIssueStatus(id, {
        status,
        assignedCrew: crew,
        actor: currentUser ? currentUser.name : 'Municipal Officer',
      });
      if (res.success && res.data) {
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? res.data : item))
        );
        setStats(res.stats);
        if (selectedIncident?.id === id) {
          setSelectedIncident(res.data);
        }
        showToast(`Incident ${id} updated to ${status}`);
      }
    } catch (err) {
      console.error(err);
      showToast(`Failed to update ${id}`, 'error');
    }
  };

  // Locate on Map
  const handleLocateOnMap = (incident: CivicIncident) => {
    setSelectedMapIncidentId(incident.id);
    setSelectedIncident(null);
    setCurrentTab('map');
  };

  // If user is not authenticated, display the sleek Auth Portal
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const criticalIncidents = incidents.filter(
    (i) => i.priorityLabel === 'Critical' && i.status !== 'Resolved'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-900 transition-colors">
      {/* Top Navbar with Dynamic Monogram & Strict Menu Structure */}
      <Navbar
        user={currentUser}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'map') setSelectedMapIncidentId(null);
        }}
        onOpenReportModal={() => {
          setReportPreloadData(null);
          setIsReportModalOpen(true);
        }}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
        stats={stats}
        incidents={incidents}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading && incidents.length === 0 ? (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-600" />
              <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Connecting to CityNexus AI Telemetry...</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loading geospatial layers and municipal queue</p>
            </div>
          </div>
        ) : (
          <>
            {/* CITIZEN VIEWS */}
            {currentUser.role === 'citizen' && currentTab === 'citizen-home' && (
              <CitizenHome
                user={currentUser}
                stats={stats}
                recentIncidents={incidents}
                onOpenReportModal={() => {
                  setReportPreloadData(null);
                  setIsReportModalOpen(true);
                }}
                onOpenVoiceModal={() => setCurrentTab('ai-assistant')}
                onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                onNavigateToMap={() => setCurrentTab('map')}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {/* Citizen Analytics & City Health Dashboard */}
            {currentUser.role === 'citizen' && currentTab === 'dashboard' && (
              <CitizenDashboard
                user={currentUser}
                incidents={incidents}
                stats={stats}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onOpenReportModal={() => {
                  setReportPreloadData(null);
                  setIsReportModalOpen(true);
                }}
                onNavigateToMap={() => setCurrentTab('map')}
              />
            )}

            {/* MUNICIPAL OFFICER VIEWS */}
            {currentUser.role === 'admin' && currentTab === 'admin-home' && (
              <AdminHome
                user={currentUser}
                stats={stats}
                incidents={incidents}
                onNavigateToDashboard={() => setCurrentTab('dashboard')}
                onNavigateToMap={() => setCurrentTab('map')}
                onNavigateToEmergency={() => setIsEmergencyModalOpen(true)}
                onNavigateToResolved={() => setCurrentTab('resolve-issues')}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {/* Municipal Officer Dispatch Dashboard */}
            {currentUser.role === 'admin' && currentTab === 'dashboard' && (
              <MunicipalDashboard
                incidents={incidents}
                stats={stats}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onUpdateStatus={handleUpdateStatus}
                onViewOnMap={handleLocateOnMap}
              />
            )}

            {/* Municipal Officer Dedicated "Resolved Issues" Queue */}
            {currentUser.role === 'admin' && currentTab === 'resolve-issues' && (
              <ResolvedIssuesView
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {/* SHARED VIEW: Live City GIS Map */}
            {currentTab === 'map' && (
              <CityMap
                incidents={incidents}
                transitCorridors={transitCorridors}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                selectedIncidentId={selectedMapIncidentId}
                userRole={currentUser.role}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {/* SHARED VIEW: Interactive AI Assistant (Chatbot + Live Voice Call Simulator) */}
            {currentTab === 'ai-assistant' && (
              <AIAssistantModal
                isOpen={true}
                onClose={() => setCurrentTab(currentUser.role === 'admin' ? 'admin-home' : 'citizen-home')}
                user={currentUser}
                onIssueSubmitted={handleIssueCreated}
                isFullPageView={true}
              />
            )}
          </>
        )}
      </main>

      {/* Clean Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-5 transition-colors">
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Citizen Report Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onIssueCreated={handleIssueCreated}
        initialData={reportPreloadData}
      />

      {/* Floating AI Assistant Modal (when opened outside of tab view) */}
      {isAIAssistantOpen && currentTab !== 'ai-assistant' && (
        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          user={currentUser}
          onIssueSubmitted={handleIssueCreated}
          isFullPageView={false}
        />
      )}

      {/* Emergency SOS Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        user={currentUser}
        criticalIncidents={criticalIncidents}
        onEmergencyReported={handleIssueCreated}
        onDispatchCritical={(id, crew) => {
          handleUpdateStatus(id, 'In Progress', crew);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onSignOut={handleSignOut}
        incidents={incidents}
        onSelectIncident={(inc) => setSelectedIncident(inc)}
      />

      {/* Full Incident Inspection Modal */}
      <IssueDetailsModal
        isOpen={Boolean(selectedIncident)}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateSuccess={(updated, newStats) => {
          setIncidents((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
          setStats(newStats);
          setSelectedIncident(updated);
          showToast(`Saved dispatch update for ${updated.id}`);
        }}
        onLocateOnMap={handleLocateOnMap}
      />
    </div>
  );
}
