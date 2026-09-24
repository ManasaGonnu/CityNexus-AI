/**
 * Express router for UrbanPulse AI civic issue management
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { CivicIncident, INITIAL_INCIDENTS } from '../data/seedData.js';
import {
  analyzeCivicIssue,
  processVoiceInput,
  processChatAssistant,
  CivicIssueType,
  IssueSeverity,
} from '../services/geminiService.js';
import {
  calculateHaversineDistance,
  calculatePriorityScore,
  isCategoryMatch,
  isNearTransitCorridor,
  TRANSIT_CORRIDORS,
} from '../services/priorityEngine.js';

export const issuesRouter = express.Router();

// Memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// In-memory store initialized with deep copy of seed data
let incidentsStore: CivicIncident[] = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));

/**
 * Helper to compute summary statistics
 */
function getSummaryStats() {
  const total = incidentsStore.length;
  const criticalCount = incidentsStore.filter((i) => i.priorityLabel === 'Critical').length;
  const resolvedCount = incidentsStore.filter((i) => i.status === 'Resolved').length;
  const inProgressCount = incidentsStore.filter((i) => i.status === 'In Progress').length;
  const assignedCount = incidentsStore.filter((i) => i.status === 'Assigned').length;
  const reportedCount = incidentsStore.filter((i) => i.status === 'Reported').length;

  const resolvedRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  const duplicateClustersCount = incidentsStore.filter((i) => i.duplicateCount > 0).length;

  const categoryCounts: Record<string, number> = {
    Pothole: 0,
    Garbage: 0,
    'Water Leakage': 0,
    Drainage: 0,
    'Broken Streetlight': 0,
    Other: 0,
  };

  for (const item of incidentsStore) {
    if (categoryCounts[item.category] !== undefined) {
      categoryCounts[item.category]++;
    } else {
      categoryCounts.Other = (categoryCounts.Other || 0) + 1;
    }
  }

  return {
    total,
    criticalCount,
    resolvedCount,
    inProgressCount,
    assignedCount,
    reportedCount,
    resolvedRate,
    duplicateClustersCount,
    avgPrioritizationTimeMinutes: 15,
    categoryCounts,
    transitCorridorsCount: TRANSIT_CORRIDORS.length,
  };
}

/**
 * GET /api/issues
 * Fetch all incidents with optional query filtering
 */
issuesRouter.get('/issues', (req: Request, res: Response) => {
  try {
    const { category, priority, status, search, nearTransit } = req.query;

    let results = [...incidentsStore];

    if (category && category !== 'All') {
      results = results.filter((i) => i.category.toLowerCase() === String(category).toLowerCase());
    }

    if (priority && priority !== 'All') {
      results = results.filter((i) => i.priorityLabel.toLowerCase() === String(priority).toLowerCase());
    }

    if (status && status !== 'All') {
      results = results.filter((i) => i.status.toLowerCase() === String(status).toLowerCase());
    }

    if (nearTransit === 'true') {
      results = results.filter((i) => i.isNearTransit);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).toLowerCase();
      results = results.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.locationName.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      );
    }

    // Default sort: highest priority score first, then newest
    results.sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats = getSummaryStats();

    res.json({
      success: true,
      stats,
      transitCorridors: TRANSIT_CORRIDORS,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/issues/:id
 * Single incident details
 */
issuesRouter.get('/issues/:id', (req: Request, res: Response) => {
  const issue = incidentsStore.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, data: issue });
});

/**
 * POST /api/analyze
 * Live side-by-side analysis preview endpoint (used in ReportIssueModal)
 */
issuesRouter.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const description = req.body.description || '';
    let coords: { lat: number; lng: number } | undefined;

    if (req.body.lat && req.body.lng) {
      coords = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
    }

    const imageBuffer = req.file ? req.file.buffer : undefined;
    const imageMimeType = req.file ? req.file.mimetype : undefined;

    const analysis = await analyzeCivicIssue({
      description,
      imageBuffer,
      imageMimeType,
      coords,
    });

    // Check potential duplicate count in vicinity
    let nearbyDuplicateCount = 0;
    if (coords) {
      for (const inc of incidentsStore) {
        if (inc.status !== 'Resolved') {
          const dist = calculateHaversineDistance(coords, inc.coordinates);
          if (dist <= 150 && isCategoryMatch(inc.category, analysis.issueType)) {
            nearbyDuplicateCount++;
          }
        }
      }
    }

    // Calculate priority preview
    const priorityBreakdown = calculatePriorityScore({
      severity: analysis.severity,
      duplicateCount: nearbyDuplicateCount,
      safetyFactorScore: analysis.safetyFactorScore,
      environmentalFactorScore: analysis.environmentalFactorScore,
      coords: coords || { lat: 37.7749, lng: -122.4194 },
    });

    res.json({
      success: true,
      data: {
        ...analysis,
        nearbyDuplicateCount,
        priorityBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/issues
 * Create a new civic report with automated AI analysis & duplicate detection
 */
issuesRouter.post('/issues', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const title = body.title || 'Reported Civic Problem';
    const description = body.description || '';
    const userCategory = body.category as CivicIssueType | undefined;
    const locationName = body.locationName || 'Metro Area';

    // Parse coordinates
    let coords = { lat: 37.7749, lng: -122.4194 };
    if (body.lat && body.lng) {
      coords = { lat: Number(body.lat), lng: Number(body.lng) };
    } else if (body.coordinates) {
      try {
        const parsed = typeof body.coordinates === 'string' ? JSON.parse(body.coordinates) : body.coordinates;
        if (parsed.lat && parsed.lng) coords = parsed;
      } catch (e) {
        // use default
      }
    }

    // Image handling
    let imageUrl = body.imageUrl;
    if (req.file) {
      // In-memory base64 data URL for instant zero-config rendering
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80';
    }

    // 1. Run AI Analysis
    const imageBuffer = req.file ? req.file.buffer : undefined;
    const imageMimeType = req.file ? req.file.mimetype : undefined;

    const analysis = await analyzeCivicIssue({
      description: `${title}. ${description}`,
      imageBuffer,
      imageMimeType,
      coords,
    });

    const finalCategory: CivicIssueType = userCategory && userCategory !== 'Other'
      ? userCategory
      : analysis.issueType;

    // 2. Duplicate Detection Engine: Check for open reports within 150m with matching category
    let existingClusterParent: CivicIncident | null = null;
    let nearbyMatchesCount = 0;

    for (const inc of incidentsStore) {
      if (inc.status !== 'Resolved') {
        const dist = calculateHaversineDistance(coords, inc.coordinates);
        if (dist <= 150 && isCategoryMatch(inc.category, finalCategory)) {
          nearbyMatchesCount++;
          if (!existingClusterParent) {
            existingClusterParent = inc;
          }
        }
      }
    }

    const newId = `UP-${1000 + incidentsStore.length + 1}`;

    // 3. If duplicate cluster exists, boost the parent report
    if (existingClusterParent) {
      existingClusterParent.duplicateCount += 1;
      if (!existingClusterParent.linkedReportIds) {
        existingClusterParent.linkedReportIds = [];
      }
      existingClusterParent.linkedReportIds.push(newId);

      // Re-evaluate parent priority score with new duplicate count
      const updatedParentPriority = calculatePriorityScore({
        severity: existingClusterParent.severity,
        duplicateCount: existingClusterParent.duplicateCount,
        safetyFactorScore: existingClusterParent.safetyFactorScore,
        environmentalFactorScore: existingClusterParent.environmentalFactorScore,
        coords: existingClusterParent.coordinates,
      });

      existingClusterParent.priorityScore = updatedParentPriority.totalScore;
      existingClusterParent.priorityLabel = updatedParentPriority.priorityLabel;
      existingClusterParent.auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'Duplicate Linked',
        actor: 'Priority Engine',
        note: `Linked duplicate report ${newId}. Duplicate count now ${existingClusterParent.duplicateCount}. Priority escalated to ${existingClusterParent.priorityScore}.`,
      });
    }

    // 4. Calculate Priority Score for the new record
    const priorityBreakdown = calculatePriorityScore({
      severity: analysis.severity,
      duplicateCount: nearbyMatchesCount,
      safetyFactorScore: analysis.safetyFactorScore,
      environmentalFactorScore: analysis.environmentalFactorScore,
      coords,
    });

    // Determine default department
    const deptMap: Record<CivicIssueType, string> = {
      Pothole: 'Public Works: Rapid Roadway Repair',
      'Water Leakage': 'SF Water Board & Hydraulics',
      Drainage: 'SF Water & Drainage Maintenance',
      Garbage: 'Municipal Sanitation & Waste Enforcement',
      'Broken Streetlight': 'City Electrical Safety & Grid',
      Other: 'Municipal Inspection Division',
    };

    const newIncident: CivicIncident = {
      id: newId,
      title: title || `${analysis.issueType} on ${locationName}`,
      category: finalCategory,
      description: description || analysis.reason,
      severity: analysis.severity,
      priorityScore: priorityBreakdown.totalScore,
      priorityLabel: priorityBreakdown.priorityLabel,
      status: 'Reported',
      assignedDepartment: deptMap[finalCategory] || 'Municipal Works',
      coordinates: coords,
      locationName,
      imageUrl,
      confidence: analysis.confidence,
      reason: analysis.reason,
      recommendedAction: analysis.recommendedAction,
      potentialUrbanRisk: analysis.potentialUrbanRisk,
      safetyFactorScore: analysis.safetyFactorScore,
      environmentalFactorScore: analysis.environmentalFactorScore,
      duplicateCount: nearbyMatchesCount,
      linkedReportIds: existingClusterParent ? [existingClusterParent.id] : [],
      isNearTransit: priorityBreakdown.isNearTransit,
      transitCorridor: priorityBreakdown.transitCorridor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportedBy: body.reportedBy || 'Citizen Contributor',
      citizenVotes: 1,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: 'Reported',
          actor: 'Citizen Web Portal',
          note: `Auto-analyzed by ${analysis.engineUsed}. Priority score: ${priorityBreakdown.totalScore} (${priorityBreakdown.priorityLabel}).`,
        },
      ],
    };

    incidentsStore.unshift(newIncident);

    res.status(201).json({
      success: true,
      message: 'Incident reported and prioritized successfully',
      data: newIncident,
      clusterParentUpdated: existingClusterParent ? existingClusterParent.id : null,
      stats: getSummaryStats(),
    });
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/issues/:id/status
 * Update incident status, department, crew, or notes
 */
issuesRouter.patch('/issues/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedDepartment, assignedCrew, note, actor } = req.body;

    const issue = incidentsStore.find((i) => i.id === id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const previousStatus = issue.status;
    if (status) {
      issue.status = status;
    }
    if (assignedDepartment) {
      issue.assignedDepartment = assignedDepartment;
    }
    if (assignedCrew) {
      issue.assignedCrew = assignedCrew;
    }
    issue.updatedAt = new Date().toISOString();

    issue.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: status ? `Status changed from ${previousStatus} to ${status}` : 'Updated Details',
      actor: actor || 'Municipal Dispatcher',
      note: note || (assignedCrew ? `Assigned to ${assignedCrew}` : undefined),
    });

    res.json({
      success: true,
      message: `Incident ${id} updated to ${issue.status}`,
      data: issue,
      stats: getSummaryStats(),
    });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/issues/:id/vote
 * Upvote an issue by citizens
 */
issuesRouter.post('/issues/:id/vote', (req: Request, res: Response) => {
  const issue = incidentsStore.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  issue.citizenVotes = (issue.citizenVotes || 0) + 1;
  res.json({ success: true, votes: issue.citizenVotes, id: issue.id });
});

/**
 * POST /api/voice-assist
 * Speech intelligence endpoint
 */
issuesRouter.post('/voice-assist', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ success: false, error: 'Transcript string is required' });
    }

    const result = await processVoiceInput(transcript);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /api/voice-assist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/chat
 * Conversational AI Assistant endpoint
 */
issuesRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message string is required' });
    }

    const result = await processChatAssistant(message, history || []);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/issues/reset
 * Reset state to original 20 seed records for live demonstrations
 */
issuesRouter.post('/issues/reset', (_req: Request, res: Response) => {
  incidentsStore = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
  res.json({
    success: true,
    message: 'Reset database to 20 realistic seed incidents',
    stats: getSummaryStats(),
  });
});
