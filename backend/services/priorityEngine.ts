/**
 * Priority Engine & Duplicate Detection for CityNexus AI
 * Deterministic municipal rules combined with AI factor scores
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TransitRouteSegment {
  name: string;
  p1: Coordinates;
  p2: Coordinates;
}

// Major transit corridors across Indian Metros
export const TRANSIT_CORRIDORS: TransitRouteSegment[] = [
  {
    name: 'Hyderabad Metro Red Line (Ameerpet - Hitec City)',
    p1: { lat: 17.4375, lng: 78.4482 },
    p2: { lat: 17.4485, lng: 78.3772 },
  },
  {
    name: 'Bengaluru Namma Metro Purple Line (MG Road - Indiranagar)',
    p1: { lat: 12.9756, lng: 77.6066 },
    p2: { lat: 12.9784, lng: 77.6408 },
  },
  {
    name: 'Mumbai Western Express Transit Arterial (Andheri - Bandra)',
    p1: { lat: 19.1197, lng: 72.8464 },
    p2: { lat: 19.0596, lng: 72.8295 },
  },
  {
    name: 'Delhi Metro Yellow Corridor (Connaught Place - AIIMS)',
    p1: { lat: 28.6315, lng: 77.2167 },
    p2: { lat: 28.5672, lng: 77.2100 },
  },
  {
    name: 'Chennai Metro Corridor (Anna Salai - Guindy)',
    p1: { lat: 13.0604, lng: 80.2496 },
    p2: { lat: 13.0067, lng: 80.2025 },
  },
  {
    name: 'Pune Metro Line 1 (Shivajinagar - Swargate)',
    p1: { lat: 18.5314, lng: 73.8446 },
    p2: { lat: 18.5018, lng: 73.8586 },
  },
];

/**
 * Calculate Haversine distance between two coordinates in meters
 */
export function calculateHaversineDistance(c1: Coordinates, c2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (c1.lat * Math.PI) / 180;
  const phi2 = (c2.lat * Math.PI) / 180;
  const deltaPhi = ((c2.lat - c1.lat) * Math.PI) / 180;
  const deltaLambda = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate perpendicular distance from a point to a line segment in meters
 */
export function distanceToSegment(p: Coordinates, p1: Coordinates, p2: Coordinates): number {
  const d12 = calculateHaversineDistance(p1, p2);
  if (d12 === 0) return calculateHaversineDistance(p, p1);

  const dx = (p2.lng - p1.lng) * Math.cos(((p1.lat + p2.lat) / 2 * Math.PI) / 180);
  const dy = p2.lat - p1.lat;
  const px = (p.lng - p1.lng) * Math.cos(((p1.lat + p2.lat) / 2 * Math.PI) / 180);
  const py = p.lat - p1.lat;

  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  const projLat = p1.lat + t * (p2.lat - p1.lat);
  const projLng = p1.lng + t * (p2.lng - p1.lng);

  return calculateHaversineDistance(p, { lat: projLat, lng: projLng });
}

/**
 * Check if coordinates are within threshold (e.g. 500 meters) of any transit corridor
 */
export function isNearTransitCorridor(coords: Coordinates, thresholdMeters = 500): { isNear: boolean; corridorName?: string } {
  for (const corridor of TRANSIT_CORRIDORS) {
    const dist = distanceToSegment(coords, corridor.p1, corridor.p2);
    if (dist <= thresholdMeters) {
      return { isNear: true, corridorName: corridor.name };
    }
  }
  return { isNear: false };
}

/**
 * Simple token match / category equivalence for duplicate checking
 */
export function isCategoryMatch(cat1: string, cat2: string): boolean {
  const norm1 = cat1.toLowerCase().trim();
  const norm2 = cat2.toLowerCase().trim();
  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  return false;
}

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityLabel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface PriorityBreakdown {
  baseSeverityScore: number;
  duplicateScore: number;
  safetyScore: number;
  environmentalScore: number;
  transitBonus: number;
  totalScore: number;
  priorityLabel: PriorityLabel;
  isNearTransit: boolean;
  transitCorridor?: string;
}

/**
 * Compute the 0-100 deterministic priority score
 */
export function calculatePriorityScore(params: {
  severity: SeverityLevel;
  duplicateCount: number;
  safetyFactorScore: number; // 1-15
  environmentalFactorScore: number; // 1-10
  coords: Coordinates;
}): PriorityBreakdown {
  const baseMap: Record<SeverityLevel, number> = {
    Critical: 40,
    High: 30,
    Medium: 20,
    Low: 10,
  };
  const baseSeverityScore = baseMap[params.severity] || 20;

  // Duplicate Report Multiplier: 5 x nearby reports (capped at 25 points)
  const duplicateScore = Math.min(25, Math.max(0, params.duplicateCount * 5));

  // Safety Factor: 1-15 points
  const safetyScore = Math.min(15, Math.max(1, params.safetyFactorScore || 8));

  // Environmental Factor: 1-10 points
  const environmentalScore = Math.min(10, Math.max(1, params.environmentalFactorScore || 5));

  // Transit Proximity Bonus: +10 if near transit corridor
  const transitCheck = isNearTransitCorridor(params.coords);
  const transitBonus = transitCheck.isNear ? 10 : 0;

  const rawTotal = baseSeverityScore + duplicateScore + safetyScore + environmentalScore + transitBonus;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let priorityLabel: PriorityLabel = 'Medium';
  if (totalScore >= 80) {
    priorityLabel = 'Critical';
  } else if (totalScore >= 60) {
    priorityLabel = 'High';
  } else if (totalScore >= 30) {
    priorityLabel = 'Medium';
  } else {
    priorityLabel = 'Low';
  }

  return {
    baseSeverityScore,
    duplicateScore,
    safetyScore,
    environmentalScore,
    transitBonus,
    totalScore,
    priorityLabel,
    isNearTransit: transitCheck.isNear,
    transitCorridor: transitCheck.corridorName,
  };
}
