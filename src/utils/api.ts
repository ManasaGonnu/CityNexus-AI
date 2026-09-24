/**
 * UrbanPulse AI - Frontend API Client
 */

export interface CivicIncident {
  id: string;
  title: string;
  category: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Drainage' | 'Broken Streetlight' | 'Other';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  priorityScore: number;
  priorityLabel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';
  assignedDepartment: string;
  assignedCrew?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;
  imageUrl: string;
  confidence: number;
  reason: string;
  recommendedAction: string;
  potentialUrbanRisk: string;
  safetyFactorScore: number;
  environmentalFactorScore: number;
  duplicateCount: number;
  linkedReportIds: string[];
  isNearTransit: boolean;
  transitCorridor?: string;
  createdAt: string;
  updatedAt: string;
  reportedBy: string;
  citizenVotes?: number;
  auditTrail: {
    timestamp: string;
    action: string;
    actor: string;
    note?: string;
  }[];
}

export interface SummaryStats {
  total: number;
  criticalCount: number;
  resolvedCount: number;
  inProgressCount: number;
  assignedCount: number;
  reportedCount: number;
  resolvedRate: number;
  duplicateClustersCount: number;
  avgPrioritizationTimeMinutes: number;
  categoryCounts: Record<string, number>;
  transitCorridorsCount: number;
}

export interface TransitCorridor {
  name: string;
  p1: { lat: number; lng: number };
  p2: { lat: number; lng: number };
}

export interface FetchIssuesResponse {
  success: boolean;
  stats: SummaryStats;
  transitCorridors: TransitCorridor[];
  count: number;
  data: CivicIncident[];
}

export interface AnalysisResponse {
  success: boolean;
  data: {
    issueType: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Drainage' | 'Broken Streetlight' | 'Other';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    confidence: number;
    reason: string;
    recommendedAction: string;
    potentialUrbanRisk: string;
    safetyFactorScore: number;
    environmentalFactorScore: number;
    isAiGenerated: boolean;
    engineUsed: string;
    nearbyDuplicateCount: number;
    priorityBreakdown: {
      baseSeverityScore: number;
      duplicateScore: number;
      safetyScore: number;
      environmentalScore: number;
      transitBonus: number;
      totalScore: number;
      priorityLabel: 'Low' | 'Medium' | 'High' | 'Critical';
      isNearTransit: boolean;
      transitCorridor?: string;
    };
  };
}

export interface VoiceAssistResponse {
  success: boolean;
  data: {
    detectedCategory: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Drainage' | 'Broken Streetlight' | 'Other';
    extractedTitle: string;
    extractedDescription: string;
    estimatedUrgency: 'Low' | 'Medium' | 'High' | 'Critical';
    suggestedLocationText: string;
    spokenConfirmation: string;
  };
}

export async function fetchIssues(filters?: {
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
  nearTransit?: boolean;
}): Promise<FetchIssuesResponse> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters?.priority && filters.priority !== 'All') params.set('priority', filters.priority);
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.nearTransit) params.set('nearTransit', 'true');

  const res = await fetch(`/api/issues?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

export async function fetchIssueById(id: string): Promise<CivicIncident> {
  const res = await fetch(`/api/issues/${id}`);
  if (!res.ok) throw new Error('Failed to load incident details');
  const json = await res.json();
  return json.data;
}

export async function updateIssueStatus(
  id: string,
  payload: {
    status?: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';
    assignedDepartment?: string;
    assignedCrew?: string;
    note?: string;
    actor?: string;
  }
): Promise<{ success: boolean; data: CivicIncident; stats: SummaryStats }> {
  const res = await fetch(`/api/issues/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function voteIssue(id: string): Promise<{ success: boolean; votes: number }> {
  const res = await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to submit vote');
  return res.json();
}

export async function analyzeIssuePreview(formData: FormData): Promise<AnalysisResponse> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('AI analysis preview failed');
  return res.json();
}

export async function createIssue(formData: FormData): Promise<{
  success: boolean;
  data: CivicIncident;
  clusterParentUpdated?: string | null;
  stats: SummaryStats;
}> {
  const res = await fetch('/api/issues', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to submit civic report');
  return res.json();
}

export async function requestVoiceAssist(transcript: string): Promise<VoiceAssistResponse> {
  const res = await fetch('/api/voice-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) throw new Error('Voice assistant extraction failed');
  return res.json();
}

export interface ChatAssistantResponse {
  success: boolean;
  data: {
    reply: string;
    hasDraftReport: boolean;
    draftReport?: {
      title: string;
      description: string;
      category: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Drainage' | 'Broken Streetlight' | 'Other';
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      locationName: string;
      coords?: { lat: number; lng: number };
    };
  };
}

export async function sendChatMessage(
  message: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = []
): Promise<ChatAssistantResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Chat message failed');
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; stats: SummaryStats }> {
  const res = await fetch('/api/issues/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset dataset');
  return res.json();
}
