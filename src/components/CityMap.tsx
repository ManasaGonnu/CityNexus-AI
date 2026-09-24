import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Filter,
  Layers,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Navigation,
  Loader2,
  Search,
  Building2,
  SlidersHorizontal,
  Compass,
  X,
} from 'lucide-react';
import { CivicIncident, TransitCorridor } from '../utils/api';
import { UserRole } from '../types/auth';

interface CityMapProps {
  incidents: CivicIncident[];
  transitCorridors: TransitCorridor[];
  onSelectIncident: (incident: CivicIncident) => void;
  selectedIncidentId?: string | null;
  onPinSelectedCoordinates?: (coords: { lat: number; lng: number }) => void;
  userRole?: UserRole;
  onUpdateStatus?: (
    id: string,
    status: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved',
    crew?: string
  ) => void;
  isEmbedded?: boolean;
  onOpenFullscreen?: () => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  incidents,
  transitCorridors,
  onSelectIncident,
  selectedIncidentId,
  onPinSelectedCoordinates,
  userRole = 'citizen',
  onUpdateStatus,
  isEmbedded = false,
  onOpenFullscreen,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const transitLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocMarkerRef = useRef<L.Marker | null>(null);
  const searchRadiusCircleRef = useRef<L.Circle | null>(null);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showTransitCorridors, setShowTransitCorridors] = useState<boolean>(true);
  const [activeIncidentCount, setActiveIncidentCount] = useState<number>(incidents.length);

  // Pan-India Geocoding Search & Current Location
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [activeRadiusCenter, setActiveRadiusCenter] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [geoErrorToast, setGeoErrorToast] = useState<{ message: string; showRetry: boolean } | null>(null);

  // Initialize Map: Default centered on India (20.5937 N, 78.9629 E, zoom 5)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on India
    const initialCenter: [number, number] = isEmbedded
      ? [17.4156, 78.4358] // Focus on metro for embedded preview
      : [20.5937, 78.9629]; // Pan-India overview
    const initialZoom = isEmbedded ? 11 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: !isEmbedded,
      scrollWheelZoom: !isEmbedded,
    });

    if (!isEmbedded) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Standard free OpenStreetMap tiles (No API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const transitGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    transitLayerRef.current = transitGroup;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onPinSelectedCoordinates) {
        onPinSelectedCoordinates({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5)),
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isEmbedded]);

  // Helper to place or update the bright pulsing blue pin for user's live coordinates
  const setUserMarker = (coords: [number, number]) => {
    if (!mapInstanceRef.current) return;

    if (userLocMarkerRef.current) {
      userLocMarkerRef.current.setLatLng(coords);
    } else {
      const locIcon = L.divIcon({
        className: 'user-gps-location-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: #0284c7; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.7); position: relative; z-index: 10;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      userLocMarkerRef.current = L.marker(coords, { icon: locIcon })
        .addTo(mapInstanceRef.current)
        .bindTooltip('📍 Your Current Location', { permanent: false, className: 'transit-tooltip' });
    }
  };

  // Helper to filter reports within radius (e.g. 10 km)
  const filterReportsNearCoordinates = (lat: number, lng: number, radiusKm: number = 10) => {
    if (!mapInstanceRef.current) return;

    if (searchRadiusCircleRef.current) {
      searchRadiusCircleRef.current.setLatLng([lat, lng]);
      searchRadiusCircleRef.current.setRadius(radiusKm * 1000);
    } else {
      searchRadiusCircleRef.current = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(mapInstanceRef.current);
    }

    setActiveRadiusCenter({ lat, lng, radiusKm });
  };

  // Helper to fetch approximate location seamlessly via free browser IP endpoint if GPS is blocked
  const fallbackToIpLocation = async (): Promise<boolean> => {
    try {
      setSearchFeedback('Acquiring approximate location via network IP...');
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
          setUserMarker([lat, lng]);
          filterReportsNearCoordinates(lat, lng, 10);
          setGeoErrorToast(null); // Dismiss error banner automatically
          const place = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
          setSearchFeedback(
            `📍 Panned to approximate location (${place || 'Network IP'}) [${lat.toFixed(4)}, ${lng.toFixed(4)}] (10 km radius filtered).`
          );
          return true;
        }
      }
    } catch (err) {
      console.warn('IP fallback failed:', err);
    }
    return false;
  };

  // Browser-native "Use My Current Location" handling
  const handleUseCurrentLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLocatingGPS(true);
    setGeoErrorToast(null);
    setSearchFeedback('Acquiring real-time browser GPS coordinates...');

    if (!navigator.geolocation) {
      fallbackToIpLocation().then((success) => {
        setIsLocatingGPS(false);
        if (!success) {
          setGeoErrorToast({
            message: 'Location permission denied or timed out. Please allow location access in your browser settings or use the search bar.',
            showRetry: true,
          });
        }
      });
      return;
    }

    // Set enableHighAccuracy: false initially to prevent preview sandbox timeouts, with 12s timeout and 60s maximumAge
    const options = {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGPS(false);
        setGeoErrorToast(null);
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 15, { duration: 1.5 });
        setUserMarker([latitude, longitude]);
        filterReportsNearCoordinates(latitude, longitude, 10); // 10 km radius
        setSearchFeedback(`📍 Panned to your live location [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] (10 km radius filtered).`);
      },
      async (error) => {
        console.warn('Browser geolocation error, attempting IP fallback:', error);
        // Seamlessly fallback to IP endpoint rather than leaving user stuck
        const success = await fallbackToIpLocation();
        setIsLocatingGPS(false);
        if (!success) {
          setSearchFeedback(null);
          setGeoErrorToast({
            message: 'Location permission denied or timed out. Please allow location access in your browser settings or use the search bar.',
            showRetry: true,
          });
        }
      },
      options
    );
  };

  // Location Search via OpenStreetMap Nominatim API
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocationQuery.trim()) return;

    setIsSearchingLocation(true);
    setSearchFeedback(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocationQuery + ', India'
        )}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLng = parseFloat(data[0].lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([targetLat, targetLng], 13, {
            duration: 1.5,
          });

          // Draw radius circle (10 km area highlight)
          if (searchRadiusCircleRef.current) {
            searchRadiusCircleRef.current.setLatLng([targetLat, targetLng]);
            searchRadiusCircleRef.current.setRadius(10000);
          } else {
            searchRadiusCircleRef.current = L.circle([targetLat, targetLng], {
              radius: 10000,
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 6',
            }).addTo(mapInstanceRef.current);
          }

          setActiveRadiusCenter({ lat: targetLat, lng: targetLng, radiusKm: 10 });
          setSearchFeedback(`Panned to: ${data[0].display_name.split(',')[0]} (Filtered within 10 km).`);
        }
      } else {
        setSearchFeedback('Location not found in India. Try another city or locality.');
      }
    } catch (err) {
      console.warn('Nominatim search error:', err);
      setSearchFeedback('Search service unavailable.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Clear radius filter
  const clearRadiusFilter = () => {
    setActiveRadiusCenter(null);
    if (searchRadiusCircleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(searchRadiusCircleRef.current);
      searchRadiusCircleRef.current = null;
    }
    setSearchFeedback(null);
    setSearchLocationQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1.2 });
    }
  };

  // Calculate distance in km
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update Transit Layer
  useEffect(() => {
    if (!transitLayerRef.current) return;
    transitLayerRef.current.clearLayers();

    if (showTransitCorridors && transitCorridors) {
      transitCorridors.forEach((corridor) => {
        const polyline = L.polyline(
          [
            [corridor.p1.lat, corridor.p1.lng],
            [corridor.p2.lat, corridor.p2.lng],
          ],
          {
            color: '#0284c7',
            weight: 4,
            opacity: 0.8,
            dashArray: '6, 6',
          }
        );

        polyline.bindTooltip(
          `🚇 <strong>${corridor.name}</strong><br/><span style="font-size: 10px; color: #0284c7;">High-Priority Transit Arterial</span>`,
          { sticky: true, className: 'transit-tooltip' }
        );

        transitLayerRef.current?.addLayer(polyline);
      });
    }
  }, [showTransitCorridors, transitCorridors]);

  // Render Incident Markers on Map
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    let filtered = [...incidents];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedPriority !== 'All') {
      filtered = filtered.filter((i) => i.priorityLabel.toLowerCase() === selectedPriority.toLowerCase());
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter((i) => i.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Filter by radius if active
    if (activeRadiusCenter) {
      filtered = filtered.filter((i) => {
        const dist = getDistanceFromLatLonInKm(
          activeRadiusCenter.lat,
          activeRadiusCenter.lng,
          i.coordinates.lat,
          i.coordinates.lng
        );
        return dist <= activeRadiusCenter.radiusKm;
      });
    }

    setActiveIncidentCount(filtered.length);

    // Color-coded risk markers
    const getMarkerColor = (label: string) => {
      switch (label) {
        case 'Critical':
          return { bg: '#ef4444', border: '#ffffff', text: '#ffffff', pulse: true };
        case 'High':
          return { bg: '#f97316', border: '#ffffff', text: '#ffffff', pulse: false };
        case 'Medium':
          return { bg: '#eab308', border: '#ffffff', text: '#1e293b', pulse: false };
        default:
          return { bg: '#10b981', border: '#ffffff', text: '#ffffff', pulse: false };
      }
    };

    filtered.forEach((incident) => {
      const colors = getMarkerColor(incident.priorityLabel);
      const isSelected = selectedIncidentId === incident.id;

      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            colors.pulse
              ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${colors.bg}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="
            position: relative;
            background: ${colors.bg};
            color: ${colors.text};
            width: ${isSelected ? '36px' : '30px'};
            height: ${isSelected ? '36px' : '30px'};
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(15,23,42,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 12px;
          ">
            ${incident.priorityScore}
          </div>
          ${
            incident.duplicateCount > 0
              ? `<span style="position: absolute; top: -5px; right: -7px; background: #6366f1; color: #ffffff; border: 1.5px solid #ffffff; font-size: 9px; font-weight: 800; border-radius: 10px; padding: 1px 4px; line-height: 1;">+${incident.duplicateCount}</span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pulse-marker',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([incident.coordinates.lat, incident.coordinates.lng], {
        icon: customIcon,
      });

      // Crisp White Card Popup
      const popupNode = document.createElement('div');
      popupNode.style.width = '270px';
      popupNode.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      popupNode.innerHTML = `
        <div style="border-radius: 14px; background: #ffffff; color: #0f172a; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; color: #64748b; font-family: monospace;">${incident.id}</span>
            <span style="font-size: 10px; font-weight: 700; border-radius: 6px; padding: 2px 7px; background: #f1f5f9; color: #0284c7;">
              ${incident.status}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
            ${incident.title}
          </div>

          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            📍 ${incident.locationName}
          </div>

          <div style="display: flex; gap: 5px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="font-size: 10px; background: ${colors.bg}; color: ${colors.text}; font-weight: 800; border-radius: 5px; padding: 2px 7px;">
              Score ${incident.priorityScore} (${incident.priorityLabel})
            </span>
            <span style="font-size: 10px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; font-weight: 600; border-radius: 5px; padding: 2px 7px;">
              ${incident.category}
            </span>
          </div>

          <div style="font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 10px; line-height: 1.4;">
            ${incident.reason}
          </div>

          <div style="display: flex; flex-direction: column; gap: 5px;">
            <button id="view-details-${incident.id}" style="
              width: 100%;
              background: #0284c7;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              Inspect Incident Details
            </button>

            ${
              userRole === 'admin'
                ? `
              <div style="display: flex; gap: 6px; margin-top: 2px;">
                <button id="admin-assign-${incident.id}" style="
                  flex: 1;
                  background: #e0f2fe;
                  color: #0369a1;
                  border: 1px solid #bae6fd;
                  border-radius: 6px;
                  padding: 5px;
                  font-size: 10px;
                  font-weight: 700;
                  cursor: pointer;
                ">
                  Assign Team
                </button>
                <button id="admin-resolve-${incident.id}" style="
                  flex: 1;
                  background: #dcfce7;
                  color: #15803d;
                  border: 1px solid #bbf7d0;
                  border-radius: 6px;
                  padding: 5px;
                  font-size: 10px;
                  font-weight: 700;
                  cursor: pointer;
                ">
                  Mark Resolved
                </button>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;

      // Attach button click events
      const viewBtn = popupNode.querySelector(`#view-details-${incident.id}`);
      if (viewBtn) {
        viewBtn.addEventListener('click', () => onSelectIncident(incident));
      }

      if (userRole === 'admin' && onUpdateStatus) {
        const assignBtn = popupNode.querySelector(`#admin-assign-${incident.id}`);
        if (assignBtn) {
          assignBtn.addEventListener('click', () => {
            onUpdateStatus(incident.id, 'Assigned', 'Municipal Field Unit');
          });
        }

        const resolveBtn = popupNode.querySelector(`#admin-resolve-${incident.id}`);
        if (resolveBtn) {
          resolveBtn.addEventListener('click', () => {
            onUpdateStatus(incident.id, 'Resolved');
          });
        }
      }

      marker.bindPopup(popupNode, { closeButton: false, className: 'custom-leaflet-popup' });
      markersLayerRef.current?.addLayer(marker);
    });
  }, [
    incidents,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    activeRadiusCenter,
    selectedIncidentId,
    userRole,
    onSelectIncident,
    onUpdateStatus,
  ]);

  // Fly to selected incident if specified
  useEffect(() => {
    if (selectedIncidentId && mapInstanceRef.current) {
      const selected = incidents.find((i) => i.id === selectedIncidentId);
      if (selected) {
        mapInstanceRef.current.flyTo([selected.coordinates.lat, selected.coordinates.lng], 15, {
          duration: 1.2,
        });
      }
    }
  }, [selectedIncidentId, incidents]);

  return (
    <div className={`relative w-full overflow-hidden ${isEmbedded ? 'h-full rounded-2xl' : 'h-[calc(100vh-65px)]'} bg-slate-100 dark:bg-slate-950 transition-colors`}>
      {/* Top Floating Control Bar (Clean Light & Dark Glassmorphic Card) */}
      {!isEmbedded && (
        <div className="absolute top-4 left-4 right-4 z-20 mx-auto max-w-5xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-lg shadow-slate-200/40 dark:shadow-black/40 backdrop-blur-md transition-colors">
          <div className="flex flex-col gap-2.5">
            {/* Row 1: Location Search Bar + "Use My Current Location" */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <form onSubmit={handleLocationSearch} className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Indian city or locality (e.g. Banjara Hills, Hyderabad, Indiranagar, Bengaluru)..."
                    value={searchLocationQuery}
                    onChange={(e) => setSearchLocationQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingLocation}
                  className="rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all shrink-0"
                >
                  {isSearchingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
                </button>
              </form>

              {/* Dedicated "Use My Current Location" GPS Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingGPS}
                  title="Center map to your real-time coordinates"
                  className="flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all shrink-0 shadow-sm"
                >
                  {isLocatingGPS ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  )}
                  <span>Use My Current Location</span>
                </button>

                {activeRadiusCenter && (
                  <button
                    onClick={clearRadiusFilter}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {searchFeedback && (
              <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-100 dark:border-sky-800 flex items-center justify-between">
                <span>{searchFeedback}</span>
                {activeRadiusCenter && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Radius: {activeRadiusCenter.radiusKm} km active
                  </span>
                )}
              </div>
            )}

            {/* Row 2: Category & Priority Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {['All', 'Pothole', 'Water Leakage', 'Drainage', 'Garbage', 'Broken Streetlight', 'Other'].map(
                      (c) => (
                        <option key={c} value={c} className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Priority:</span>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                      <option key={p} value={p} className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowTransitCorridors(!showTransitCorridors)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all shadow-sm ${
                    showTransitCorridors
                      ? 'border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span>🚇 Transit Trunks</span>
                </button>
              </div>

              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Displaying <strong className="text-slate-900 dark:text-white font-bold">{activeIncidentCount}</strong> active incidents
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-intrusive in-app Geolocation Failure Toast with Retry Prompt */}
      {geoErrorToast && (
        <div className="absolute top-36 sm:top-28 left-4 right-4 z-30 mx-auto max-w-xl rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/95 dark:bg-slate-900/95 p-3.5 text-xs text-slate-800 dark:text-slate-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{geoErrorToast.message}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {geoErrorToast.showRetry && (
                <button
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry Geolocation</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([17.3850, 78.4867], 13);
                    setUserMarker([17.3850, 78.4867]);
                    filterReportsNearCoordinates(17.3850, 78.4867, 10);
                    setSearchFeedback('📍 Panned to Hyderabad Urban Center (10 km radius filtered).');
                  }
                  setGeoErrorToast(null);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Pan to City Center
              </button>
            </div>
          </div>
          <button
            onClick={() => setGeoErrorToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Embedded Map overlay header if embedded on Home Page */}
      {isEmbedded && onOpenFullscreen && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onOpenFullscreen}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 shadow-md hover:bg-sky-50 dark:hover:bg-slate-800 transition-all backdrop-blur-sm"
          >
            <span>Open Fullscreen GIS Explorer →</span>
          </button>
        </div>
      )}

      {/* Leaflet Map Target */}
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Clean Light & Dark Risk Legend */}
      {!isEmbedded && (
        <div className="pointer-events-none absolute bottom-5 left-4 z-20 hidden md:block max-w-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-lg shadow-slate-200/50 dark:shadow-black/50 backdrop-blur-md">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Risk &amp; Severity Scale
          </p>
          <div className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Critical (80-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span>High (60-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span>Medium (30-59)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Low (0-29)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
