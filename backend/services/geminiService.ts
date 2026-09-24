/**
 * Gemini AI Analysis Service for UrbanPulse AI
 * Uses @google/genai TypeScript SDK with gemini-2.5-flash
 * Includes robust heuristic fallback to guarantee zero broken flows
 */

import { GoogleGenAI } from '@google/genai';

export type CivicIssueType =
  | 'Pothole'
  | 'Garbage'
  | 'Water Leakage'
  | 'Drainage'
  | 'Broken Streetlight'
  | 'Other';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AIAnalysisResult {
  issueType: CivicIssueType;
  severity: IssueSeverity;
  confidence: number;
  reason: string;
  recommendedAction: string;
  potentialUrbanRisk: string;
  safetyFactorScore: number;
  environmentalFactorScore: number;
  isAiGenerated: boolean;
  engineUsed: string;
}

export interface VoiceAssistResult {
  detectedCategory: CivicIssueType;
  extractedTitle: string;
  extractedDescription: string;
  estimatedUrgency: IssueSeverity;
  suggestedLocationText: string;
  spokenConfirmation: string;
}

// Lazy initialization of GoogleGenAI
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAiClient) {
    try {
      genAiClient = new GoogleGenAI();
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return genAiClient;
}

/**
 * Heuristic fallback analyzer when Gemini API is unavailable or rate-limited.
 * Analyzes keywords, context, and patterns deterministically.
 */
export function heuristicFallbackAnalysis(
  textDescription = '',
  hasImage = false,
  _coords?: { lat: number; lng: number }
): AIAnalysisResult {
  const text = (textDescription || '').toLowerCase();

  let issueType: CivicIssueType = 'Other';
  let severity: IssueSeverity = 'Medium';
  let safetyFactorScore = 7;
  let environmentalFactorScore = 5;
  let confidence = 0.82;

  // Category identification
  if (text.includes('pothole') || text.includes('crater') || text.includes('asphalt') || text.includes('road cave')) {
    issueType = 'Pothole';
    if (text.includes('deep') || text.includes('huge') || text.includes('tire') || text.includes('accident') || text.includes('cracked axle')) {
      severity = 'Critical';
      safetyFactorScore = 14;
      environmentalFactorScore = 4;
    } else if (text.includes('moderate') || text.includes('growing')) {
      severity = 'High';
      safetyFactorScore = 11;
      environmentalFactorScore = 3;
    } else {
      severity = 'Medium';
      safetyFactorScore = 8;
      environmentalFactorScore = 2;
    }
  } else if (text.includes('water') || text.includes('leak') || text.includes('burst pipe') || text.includes('gushing') || text.includes('flooding')) {
    issueType = 'Water Leakage';
    if (text.includes('burst') || text.includes('submerged') || text.includes('flooding') || text.includes('main') || text.includes('pressure')) {
      severity = 'Critical';
      safetyFactorScore = 13;
      environmentalFactorScore = 10;
    } else {
      severity = 'High';
      safetyFactorScore = 10;
      environmentalFactorScore = 8;
    }
  } else if (text.includes('drain') || text.includes('clogged') || text.includes('sewage') || text.includes('manhole') || text.includes('overflow')) {
    issueType = 'Drainage';
    if (text.includes('sewage') || text.includes('open manhole') || text.includes('hazard') || text.includes('smell')) {
      severity = 'Critical';
      safetyFactorScore = 15;
      environmentalFactorScore = 9;
    } else {
      severity = 'High';
      safetyFactorScore = 11;
      environmentalFactorScore = 8;
    }
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('dump') || text.includes('litter')) {
    issueType = 'Garbage';
    if (text.includes('rodents') || text.includes('fire') || text.includes('dumping') || text.includes('toxic') || text.includes('block')) {
      severity = 'High';
      safetyFactorScore = 9;
      environmentalFactorScore = 9;
    } else {
      severity = 'Medium';
      safetyFactorScore = 6;
      environmentalFactorScore = 7;
    }
  } else if (text.includes('light') || text.includes('lamp') || text.includes('dark') || text.includes('pole') || text.includes('wires') || text.includes('bulb')) {
    issueType = 'Broken Streetlight';
    if (text.includes('spark') || text.includes('exposed wire') || text.includes('hanging') || text.includes('school')) {
      severity = 'Critical';
      safetyFactorScore = 14;
      environmentalFactorScore = 3;
    } else if (text.includes('intersection') || text.includes('pedestrian')) {
      severity = 'High';
      safetyFactorScore = 11;
      environmentalFactorScore = 2;
    } else {
      severity = 'Medium';
      safetyFactorScore = 7;
      environmentalFactorScore = 2;
    }
  } else {
    issueType = 'Other';
    severity = text.includes('danger') || text.includes('emergency') || text.includes('collapsed') ? 'Critical' : 'Medium';
    safetyFactorScore = severity === 'Critical' ? 12 : 7;
    environmentalFactorScore = 5;
  }

  if (hasImage) {
    confidence = Math.min(0.96, confidence + 0.08);
  }

  const riskMap: Record<CivicIssueType, string> = {
    Pothole: 'Sudden vehicular steering deflection, tire rupture risk, and accelerated roadway base degradation.',
    'Water Leakage': 'Subsurface soil liquefaction, sinkhole evolution, and severe potable water loss impacting municipal reservoirs.',
    Drainage: 'Stagnant blackwater breeding vectors, street flooding, pedestrian slips, and structural asphalt weakening.',
    Garbage: 'Decomposition vermin attractor, biohazard leachate runoff into stormwater drains, and urban fire risks.',
    'Broken Streetlight': 'Reduced driver nighttime visibility, elevated pedestrian collision hazard, and localized public safety vulnerability.',
    Other: 'General public infrastructure obstruction and civic service degradation.',
  };

  const actionMap: Record<CivicIssueType, string> = {
    Pothole: 'Deploy Rapid Asphalt Paving Unit with cold-patch emergency binder; install warning pylons.',
    'Water Leakage': 'Dispatch Water Board Emergency Hydro-Valve Crew; isolate feeder main and assess pressure drop.',
    Drainage: 'Mobilize High-Pressure Vacuum Jetting Truck; clear catch basin culverts and sanitize outflow.',
    Garbage: 'Schedule Priority Solid Waste Compactors; enforce illegal dumping surveillance and apply sanitizing spray.',
    'Broken Streetlight': 'Dispatch Electrical Utility Bucket Truck; replace faulty LED luminaire/ballast and verify grounding wire.',
    Other: 'Dispatch Municipal Inspection Inspector for formal on-site structural appraisal.',
  };

  return {
    issueType,
    severity,
    confidence: Number(confidence.toFixed(2)),
    reason: `Heuristic assessment based on report cues (${issueType}). Identified structural vulnerability and elevated public safety impact factor.`,
    recommendedAction: actionMap[issueType],
    potentialUrbanRisk: riskMap[issueType],
    safetyFactorScore,
    environmentalFactorScore,
    isAiGenerated: false,
    engineUsed: 'UrbanPulse Deterministic Heuristic Engine v2.5',
  };
}

/**
 * Main Civic Issue Analysis function
 */
export async function analyzeCivicIssue(params: {
  description?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  coords?: { lat: number; lng: number };
}): Promise<AIAnalysisResult> {
  const ai = getGenAI();
  const description = params.description || '';
  const hasImage = Boolean(params.imageBuffer && params.imageBuffer.length > 0);

  if (!ai) {
    return heuristicFallbackAnalysis(description, hasImage, params.coords);
  }

  try {
    const prompt = `Analyze this civic urban problem for municipal dispatch in a smart city aligned with UN SDG 11.
Return ONLY valid raw JSON adhering strictly to this format:
{
  "issueType": "Pothole" | "Garbage" | "Water Leakage" | "Drainage" | "Broken Streetlight" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "confidence": 0.0 to 1.0,
  "reason": "concise explanation of severity and safety or structural threat",
  "recommendedAction": "concrete municipal dispatch action",
  "potentialUrbanRisk": "cascading risk, e.g. Stagnant water near blocked drain risks disease and road erosion",
  "safetyFactorScore": 1 to 15,
  "environmentalFactorScore": 1 to 10
}

Context info:
- Citizen description: "${description}"
- Coordinates: ${params.coords ? `Lat ${params.coords.lat}, Lng ${params.coords.lng}` : 'Unspecified'}`;

    const parts: any[] = [{ text: prompt }];

    if (hasImage && params.imageBuffer) {
      parts.unshift({
        inlineData: {
          mimeType: params.imageMimeType || 'image/jpeg',
          data: params.imageBuffer.toString('base64'),
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Normalize output
    const validCategories: CivicIssueType[] = [
      'Pothole',
      'Garbage',
      'Water Leakage',
      'Drainage',
      'Broken Streetlight',
      'Other',
    ];
    const validSeverities: IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

    const issueType: CivicIssueType = validCategories.includes(parsed.issueType)
      ? parsed.issueType
      : 'Other';

    const severity: IssueSeverity = validSeverities.includes(parsed.severity)
      ? parsed.severity
      : 'Medium';

    return {
      issueType,
      severity,
      confidence: Math.max(0.1, Math.min(1.0, Number(parsed.confidence) || 0.89)),
      reason: String(parsed.reason || 'Identified civic infrastructure anomaly requiring municipal remediation.'),
      recommendedAction: String(parsed.recommendedAction || 'Dispatch appropriate municipal field crew.'),
      potentialUrbanRisk: String(parsed.potentialUrbanRisk || 'Potential secondary safety or transit disruption.'),
      safetyFactorScore: Math.max(1, Math.min(15, Math.round(Number(parsed.safetyFactorScore) || 8))),
      environmentalFactorScore: Math.max(1, Math.min(10, Math.round(Number(parsed.environmentalFactorScore) || 5))),
      isAiGenerated: true,
      engineUsed: 'Gemini 2.5 Flash Multimodal',
    };
  } catch (error) {
    console.warn('Gemini AI analysis error; falling back to heuristic engine:', error);
    const fallback = heuristicFallbackAnalysis(description, hasImage, params.coords);
    return {
      ...fallback,
      reason: `${fallback.reason} (Note: Analyzed via high-speed municipal fallback)`,
    };
  }
}

/**
 * Voice Assistant speech extraction
 */
export async function processVoiceInput(spokenText: string): Promise<VoiceAssistResult> {
  const text = spokenText || '';
  const ai = getGenAI();

  const defaultResult: VoiceAssistResult = {
    detectedCategory: 'Other',
    extractedTitle: text.slice(0, 50) || 'Civic Issue Report',
    extractedDescription: text,
    estimatedUrgency: 'Medium',
    suggestedLocationText: 'Metro Center',
    spokenConfirmation: `Received report: "${text.slice(0, 40)}...". Analysis loaded.`,
  };

  // Heuristic parser if Gemini is absent
  if (!ai) {
    const fallback = heuristicFallbackAnalysis(text, false);
    return {
      detectedCategory: fallback.issueType,
      extractedTitle: `${fallback.issueType} reported via voice`,
      extractedDescription: text,
      estimatedUrgency: fallback.severity,
      suggestedLocationText: 'Location detected from audio context',
      spokenConfirmation: `Understood. I have logged a ${fallback.severity} ${fallback.issueType} report and pre-filled your municipal ticket.`,
    };
  }

  try {
    const prompt = `You are UrbanPulse Voice Assistant for municipal dispatch.
The citizen said: "${text}"

Parse this speech into a JSON object:
{
  "detectedCategory": "Pothole" | "Garbage" | "Water Leakage" | "Drainage" | "Broken Streetlight" | "Other",
  "extractedTitle": "Brief 4-8 word title for the ticket",
  "extractedDescription": "Clean, structured summary of what citizen observed",
  "estimatedUrgency": "Low" | "Medium" | "High" | "Critical",
  "suggestedLocationText": "Any extracted location, intersection, or landmark mentioned, or 'Downtown Corridor' if none",
  "spokenConfirmation": "Friendly 1-2 sentence voice confirmation to read back to the citizen explaining what was logged"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleanJson = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      detectedCategory: parsed.detectedCategory || 'Other',
      extractedTitle: parsed.extractedTitle || 'Citizen Voice Report',
      extractedDescription: parsed.extractedDescription || text,
      estimatedUrgency: parsed.estimatedUrgency || 'Medium',
      suggestedLocationText: parsed.suggestedLocationText || 'Metro Area',
      spokenConfirmation: parsed.spokenConfirmation || 'Your civic report has been prepared for submission.',
    };
  } catch (error) {
    console.warn('Voice AI parsing fallback:', error);
    const fallback = heuristicFallbackAnalysis(text, false);
    return {
      ...defaultResult,
      detectedCategory: fallback.issueType,
      estimatedUrgency: fallback.severity,
      spokenConfirmation: `I have noted a ${fallback.severity} priority ${fallback.issueType} from your voice description.`,
    };
  }
}

export interface ChatAssistantResult {
  reply: string;
  hasDraftReport: boolean;
  draftReport?: {
    title: string;
    description: string;
    category: CivicIssueType;
    severity: IssueSeverity;
    locationName: string;
    coords?: { lat: number; lng: number };
  };
}

/**
 * Conversational AI Assistant handler
 */
export async function processChatAssistant(
  message: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = []
): Promise<ChatAssistantResult> {
  const text = (message || '').trim();
  const ai = getGenAI();

  const isCivicProblemReport = (str: string) => {
    const s = str.toLowerCase();
    return (
      s.includes('pothole') ||
      s.includes('leak') ||
      s.includes('water') ||
      s.includes('pipe') ||
      s.includes('light') ||
      s.includes('lamp') ||
      s.includes('garbage') ||
      s.includes('trash') ||
      s.includes('drain') ||
      s.includes('manhole') ||
      s.includes('wire') ||
      s.includes('broken') ||
      s.includes('overflow') ||
      s.includes('damaged') ||
      s.includes('road')
    );
  };

  if (!ai) {
    if (isCivicProblemReport(text)) {
      const fallback = heuristicFallbackAnalysis(text, false);
      return {
        reply: `I understand and am on it! I've noted a ${fallback.severity.toLowerCase()} hazard (${fallback.issueType}) from your message. I have drafted an official civic report card for you below. Please review and click to submit directly to the municipal board.`,
        hasDraftReport: true,
        draftReport: {
          title: `${fallback.issueType} reported via AI Assistant`,
          description: text,
          category: fallback.issueType,
          severity: fallback.severity,
          locationName: 'Local Neighborhood',
          coords: { lat: 17.4156, lng: 78.4358 },
        },
      };
    } else {
      return {
        reply: `Hello! I am your CityNexus AI urban assistant. You can tell me about any civic issue in your city (such as water leakages, potholes, dark streetlights, or drainage clogs), and I will immediately triage and draft an official municipal ticket for you.`,
        hasDraftReport: false,
      };
    }
  }

  try {
    const prompt = `You are CityNexus AI Assistant, an empathetic, smart urban civic intelligence assistant for citizens and municipalities in India.
The citizen says: "${text}"

Recent conversation context:
${history.slice(-4).map((h) => `${h.sender}: ${h.text}`).join('\n')}

Analyze if the citizen is describing or reporting a civic problem (pothole, water leak, garbage, drainage, street light, open wire, road damage, etc.).
Return a JSON object adhering to:
{
  "reply": "Empathetic, clear, 1-2 sentence conversational response addressing the citizen directly",
  "isCivicProblemReport": boolean,
  "category": "Pothole" | "Garbage" | "Water Leakage" | "Drainage" | "Broken Streetlight" | "Other" (or null if not a report),
  "severity": "Low" | "Medium" | "High" | "Critical" (or null),
  "extractedTitle": "Brief 4-8 word title for the ticket",
  "extractedLocation": "City/street/locality extracted from text (e.g. Banjara Hills, Indiranagar, Road No. 12, or 'Local Area' if unspecified)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleanJson = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.isCivicProblemReport && parsed.category) {
      return {
        reply: parsed.reply || `I have analyzed your report and prepared an official municipal ticket draft. You can submit it directly below.`,
        hasDraftReport: true,
        draftReport: {
          title: parsed.extractedTitle || `${parsed.category} Issue`,
          description: text,
          category: parsed.category,
          severity: parsed.severity || 'Medium',
          locationName: parsed.extractedLocation || 'Metro Area',
          coords: { lat: 17.4156, lng: 78.4358 },
        },
      };
    } else {
      return {
        reply: parsed.reply || `Hello! I am your CityNexus AI urban assistant. Let me know what you're observing around your neighborhood.`,
        hasDraftReport: false,
      };
    }
  } catch (err) {
    console.warn('AI chat assistant error, using fallback:', err);
    const fallback = heuristicFallbackAnalysis(text, false);
    return {
      reply: `I've noted this issue. I have drafted an official civic report card for you below. Please review and click to submit directly to the municipal board.`,
      hasDraftReport: isCivicProblemReport(text),
      draftReport: isCivicProblemReport(text)
        ? {
            title: `${fallback.issueType} Observation`,
            description: text,
            category: fallback.issueType,
            severity: fallback.severity,
            locationName: 'Local Neighborhood',
            coords: { lat: 17.4156, lng: 78.4358 },
          }
        : undefined,
    };
  }
}
