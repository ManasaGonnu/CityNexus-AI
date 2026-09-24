import React, { useState } from 'react';
import {
  Activity,
  MapPin,
  LayoutDashboard,
  Mic,
  PlusCircle,
  ShieldAlert,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Home,
  FileCheck2,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { User, getMonogram } from '../types/auth';
import { SummaryStats, CivicIncident } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onOpenEmergencyModal: () => void;
  onOpenProfileModal: () => void;
  onSignOut: () => void;
  stats?: SummaryStats;
  incidents?: CivicIncident[];
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onOpenReportModal,
  onOpenEmergencyModal,
  onOpenProfileModal,
  onSignOut,
  stats,
  incidents = [],
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const monogram = getMonogram(user.name, user.email);
  const { theme, toggleTheme } = useTheme();

  // Compute personal submission count for citizen
  const userSubmissions = incidents.filter(
    (i) =>
      i.reportedBy?.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]) ||
      (user.phone && i.reportedBy?.includes(user.phone.slice(-6)))
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Application Name & Subtitle ONLY (No role pills, no reload button) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab(user.role === 'admin' ? 'admin-home' : 'citizen-home')}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Activity className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                CityNexus <span className="text-sky-600 dark:text-sky-400">AI</span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Smart Urban Intelligence Platform
              </p>
            </div>
          </button>
        </div>

        {/* Center: Strict Role-Based Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 p-1 border border-slate-200/80 dark:border-slate-700/80 transition-colors">
          {user.role === 'citizen' ? (
            /* Citizen Menu: Home, Dashboard, Report Issue, Live City Map, AI Assistant, Emergency SOS */
            <>
              <button
                onClick={() => onSelectTab('citizen-home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'citizen-home'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>

              <button
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Report Issue</span>
              </button>

              <button
                onClick={() => onSelectTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'map'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Live City Map</span>
              </button>

              <button
                onClick={() => onSelectTab('ai-assistant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'ai-assistant'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>AI Assistant</span>
              </button>

              <button
                onClick={onOpenEmergencyModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
                <span>Emergency SOS</span>
              </button>
            </>
          ) : (
            /* Municipal Officer Menu: Home, Dashboard, Live City Map, Resolved Issues (NO AI Assistant) */
            <>
              <button
                onClick={() => onSelectTab('admin-home')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'admin-home'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>

              <button
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
                {stats && stats.criticalCount > 0 && (
                  <span className="rounded-full bg-red-100 dark:bg-red-950/80 px-1.5 py-0.2 text-[9px] font-black text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    {stats.criticalCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'map'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Live City Map</span>
              </button>

              <button
                onClick={() => onSelectTab('resolve-issues')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'resolve-issues'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Resolve Issue</span>
              </button>
            </>
          )}
        </nav>

        {/* Right: Theme Toggle + Dynamic Profile Monogram & Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 animate-in spin-in-180 duration-300" />
            )}
          </button>

          {/* User Profile Avatar with Clean Dynamic Monogram */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 pr-2.5 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs"
              title="User Account Menu"
            >
              {/* Dynamic Circular Initial Monogram */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xs shadow-sm">
                {monogram}
              </div>

              <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            </button>

            {/* Profile Dropdown with Real User Name, Contact & Personal Submission Log */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-40 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-3 animate-in fade-in slide-in-from-top-2 transition-colors">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm shadow-sm">
                      {monogram}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.phone || user.email}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                          user.role === 'admin'
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        }`}
                      >
                        {user.role === 'admin' ? 'Municipal Officer' : 'Verified Citizen'}
                      </span>
                    </div>
                  </div>

                  {/* Personal Submissions Overview in Dropdown */}
                  <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1.5">
                      <span className="font-semibold">Personal Submissions</span>
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        {user.role === 'admin' ? `${stats?.resolvedCount || 12} Verified` : `${userSubmissions.length || 3} Filed`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        <span>View Full Profile &amp; Audit Log</span>
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sub-Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs transition-colors">
        {user.role === 'citizen' ? (
          <>
            <button
              onClick={() => onSelectTab('citizen-home')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'citizen-home' ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="text-[10px]">Home</span>
            </button>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'dashboard' ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-emerald-700 dark:text-emerald-400 font-bold"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="text-[10px]">Report</span>
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'map' ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-[10px]">Map</span>
            </button>
            <button
              onClick={() => onSelectTab('ai-assistant')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'ai-assistant' ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span className="text-[10px]">AI Assist</span>
            </button>
            <button
              onClick={onOpenEmergencyModal}
              className="flex flex-col items-center gap-0.5 py-1 px-2 text-red-600 dark:text-red-400 font-bold"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px]">SOS</span>
            </button>
          </>
        ) : (
          /* Municipal Officer Mobile Menu: Home, Dashboard, Risk Map, Resolved Issues (NO AI Assistant) */
          <>
            <button
              onClick={() => onSelectTab('admin-home')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'admin-home' ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="text-[10px]">Home</span>
            </button>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'dashboard' ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'map' ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-[10px]">Risk Map</span>
            </button>
            <button
              onClick={() => onSelectTab('resolve-issues')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 ${
                currentTab === 'resolve-issues' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span className="text-[10px]">Resolve Issue</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
