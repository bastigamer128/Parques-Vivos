import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Activity, CategoryType } from '../types';
import { 
  CATEGORY_CONFIG, 
  PARQUE_ALMAGRO_BOUNDS_POLYGON, 
  PARQUE_ALMAGRO_ZONES
} from '../data/mockData';
import { 
  Plus, Compass, Navigation, Users, MapPin, 
  Sparkles, CheckCircle2, ChevronRight, AlertTriangle, 
  Crosshair, X, Edit3, Save, RotateCcw, Check, Move
} from 'lucide-react';

interface MapViewProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenCreateModal: (initialCoords?: { lat: number; lng: number; locationName: string } | null) => void;
  selectedActivityId?: string | null;
}

// Center of Parque Almagro, Santiago, Chile (Accurate OpenStreetMap center)
const PARQUE_ALMAGRO_CENTER: [number, number] = [-33.45210, -70.65380];

// Ray casting algorithm for arbitrary polygon
function isPointInCustomPolygon(lat: number, lng: number, vs: [number, number][]): boolean {
  if (vs.length < 3) return false;

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  vs.forEach(([vlat, vlng]) => {
    if (vlat < minLat) minLat = vlat;
    if (vlat > maxLat) maxLat = vlat;
    if (vlng < minLng) minLng = vlng;
    if (vlng > maxLng) maxLng = vlng;
  });

  const latBuffer = 0.00030;
  const lngBuffer = 0.00035;

  if (lat < minLat - latBuffer || lat > maxLat + latBuffer || lng < minLng - lngBuffer || lng > maxLng + lngBuffer) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside || (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);
}

export const MapView: React.FC<MapViewProps> = ({
  activities,
  onSelectActivity,
  onOpenCreateModal,
  selectedActivityId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const parkPolygonRef = useRef<L.Polygon | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const tempPinLayerRef = useRef<L.LayerGroup | null>(null);
  const editHandlesLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  
  // Custom Polygon state (stored in localStorage)
  const [parkPolygonCoords, setParkPolygonCoords] = useState<[number, number][]>(() => {
    const saved = localStorage.getItem('parques_vivos_custom_polygon_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate coordinates belong to the real Parque Almagro (-33.4510 to -33.4535)
        const hasLegacyCoords = parsed.some(([lat]: [number, number]) => lat > -33.4510 || lat < -33.4535);
        if (!hasLegacyCoords && Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      } catch {}
    }
    localStorage.removeItem('parques_vivos_custom_polygon');
    localStorage.removeItem('parques_vivos_custom_polygon_v2');
    localStorage.setItem('parques_vivos_custom_polygon_v3', JSON.stringify(PARQUE_ALMAGRO_BOUNDS_POLYGON));
    return PARQUE_ALMAGRO_BOUNDS_POLYGON;
  });

  // Mutable ref so dragging updates polygon directly without laggy React re-renders
  const parkPolygonCoordsRef = useRef<[number, number][]>(parkPolygonCoords);
  useEffect(() => {
    parkPolygonCoordsRef.current = parkPolygonCoords;
  }, [parkPolygonCoords]);

  // Mode: Placing activity on map (starts after clicking "+ Actividad")
  const [isPlacingActivity, setIsPlacingActivity] = useState<boolean>(false);

  // Mode: Manually calibrating / editing park boundaries
  const [isEditingBoundaries, setIsEditingBoundaries] = useState<boolean>(false);
  const [boundarySaveToast, setBoundarySaveToast] = useState<boolean>(false);

  // Recommendations carousel visibility toggle
  const [isCarouselVisible, setIsCarouselVisible] = useState<boolean>(true);

  // Real GPS location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    isInside: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Boundary alert banner state
  const [boundaryAlert, setBoundaryAlert] = useState<{
    show: boolean;
    lat: number;
    lng: number;
  } | null>(null);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (selectedCategory === 'todas') return true;
    return act.category === selectedCategory;
  });

  // Track highlighted activity and marker references
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);
  const activityMarkersRef = useRef<Record<string, L.Marker>>({});

  // Fly smoothly to activity location on the map
  const handleFlyToActivity = (activity: Activity) => {
    setHighlightedActivityId(activity.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activity.lat, activity.lng], 18, {
        duration: 1.0,
      });
    }

    // Open popup after map glides to position
    setTimeout(() => {
      const marker = activityMarkersRef.current[activity.id];
      if (marker) {
        marker.openPopup();
      }
    }, 600);
  };

  // Find nearest zone name for a given coordinate
  const getNearestZoneName = (lat: number, lng: number): string => {
    let nearest = PARQUE_ALMAGRO_ZONES[0];
    let minDistance = Infinity;

    PARQUE_ALMAGRO_ZONES.forEach((zone) => {
      const dist = Math.hypot(zone.lat - lat, zone.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = zone;
      }
    });

    return `Sector cercano a ${nearest.name}`;
  };

  // Trigger GPS Geolocation
  const requestUserLocation = useCallback((shouldFlyTo = false) => {
    if (!navigator.geolocation) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const inside = isPointInCustomPolygon(latitude, longitude, parkPolygonCoords);

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          isInside: inside,
        });
        setIsLocating(false);

        if (shouldFlyTo && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17.5, {
            duration: 1.2,
          });
        }
      },
      () => {
        setIsLocating(false);
        // Fallback simulation near Metro Parque Almagro so user can test location visually
        const simulatedLocation = {
          lat: -33.44975,
          lng: -70.65150,
          accuracy: 15,
          isInside: true,
        };
        setUserLocation(simulatedLocation);
        if (shouldFlyTo && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([simulatedLocation.lat, simulatedLocation.lng], 17.5, {
            duration: 1.2,
          });
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, [parkPolygonCoords]);

  // Save custom polygon to localStorage
  const handleSavePolygon = () => {
    localStorage.setItem('parques_vivos_custom_polygon_v3', JSON.stringify(parkPolygonCoordsRef.current));
    setParkPolygonCoords([...parkPolygonCoordsRef.current]);
    setIsEditingBoundaries(false);
    setBoundarySaveToast(true);
    setTimeout(() => setBoundarySaveToast(false), 3000);
  };

  // Reset polygon to default
  const handleResetPolygon = () => {
    parkPolygonCoordsRef.current = PARQUE_ALMAGRO_BOUNDS_POLYGON;
    setParkPolygonCoords(PARQUE_ALMAGRO_BOUNDS_POLYGON);
    localStorage.removeItem('parques_vivos_custom_polygon_v3');
    if (parkPolygonRef.current) {
      parkPolygonRef.current.setLatLngs(PARQUE_ALMAGRO_BOUNDS_POLYGON);
    }
    renderBoundaryHandles(PARQUE_ALMAGRO_BOUNDS_POLYGON);
    setBoundarySaveToast(true);
    setTimeout(() => setBoundarySaveToast(false), 3000);
  };

  // Render boundary handles without tearing/recreating on every drag event
  const renderBoundaryHandles = useCallback((coords: [number, number][]) => {
    const layer = editHandlesLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    coords.forEach((coord, index) => {
      const handleIcon = L.divIcon({
        className: 'vertex-handle-icon',
        html: `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:grab; touch-action:none;">
            <div style="width:26px; height:26px; border-radius:50%; background:#059669; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:900;">
              ${index + 1}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker(coord, {
        icon: handleIcon,
        draggable: true,
        zIndexOffset: 3000,
      }).addTo(layer);

      // Instant 60 FPS polygon update on drag (No React re-renders during motion!)
      marker.on('drag', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const newPos = target.getLatLng();
        parkPolygonCoordsRef.current[index] = [newPos.lat, newPos.lng];
        if (parkPolygonRef.current) {
          parkPolygonRef.current.setLatLngs(parkPolygonCoordsRef.current);
        }
      });

      // Commit to state when dragging finishes
      marker.on('dragend', () => {
        setParkPolygonCoords([...parkPolygonCoordsRef.current]);
      });
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PARQUE_ALMAGRO_CENTER,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      minZoom: 15,
      maxZoom: 19,
    });

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Park boundary polygon
    const parkBoundary = L.polygon(parkPolygonCoords, {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.16,
      weight: 3,
      dashArray: '6, 6',
    }).addTo(map);
    parkPolygonRef.current = parkBoundary;

    // Landmark: Basílica de los Sacramentinos
    const sacramentinosIcon = L.divIcon({
      className: 'custom-landmark-icon',
      html: `
        <div style="background:#1e293b; color:#fff; font-size:10px; font-weight:800; padding:3px 7px; border-radius:8px; box-shadow:0 3px 6px rgba(0,0,0,0.25); white-space:nowrap; border:1px solid #94a3b8; display:flex; align-items:center; gap:4px;">
          <span>⛪ Basílica Sacramentinos</span>
        </div>
      `,
      iconSize: [140, 22],
      iconAnchor: [70, 26],
    });
    L.marker([-33.45020, -70.65060], { icon: sacramentinosIcon, interactive: false }).addTo(map);

    // Landmark: Metro Parque Almagro
    const metroIcon = L.divIcon({
      className: 'custom-landmark-icon',
      html: `
        <div style="background:#dc2626; color:#fff; font-size:10px; font-weight:800; padding:3px 7px; border-radius:8px; box-shadow:0 3px 6px rgba(0,0,0,0.25); white-space:nowrap; border:1px solid #fca5a5; display:flex; align-items:center; gap:4px;">
          <span>🚇 Metro P. Almagro (L3)</span>
        </div>
      `,
      iconSize: [140, 22],
      iconAnchor: [70, 26],
    });
    L.marker([-33.44975, -70.65150], { icon: metroIcon, interactive: false }).addTo(map);

    // Layers
    const userLocationLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLocationLayer;

    const tempPinLayer = L.layerGroup().addTo(map);
    tempPinLayerRef.current = tempPinLayer;

    const editHandlesLayer = L.layerGroup().addTo(map);
    editHandlesLayerRef.current = editHandlesLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;
    requestUserLocation(false);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update polygon points when parkPolygonCoords changes
  useEffect(() => {
    if (parkPolygonRef.current) {
      parkPolygonRef.current.setLatLngs(parkPolygonCoords);
    }
  }, [parkPolygonCoords]);

  // Handle Manual Boundary Editing: Draggable Handles
  useEffect(() => {
    if (isEditingBoundaries) {
      renderBoundaryHandles(parkPolygonCoordsRef.current);
    } else {
      editHandlesLayerRef.current?.clearLayers();
    }
  }, [isEditingBoundaries, renderBoundaryHandles]);

  // Map Click Listener: Only active when user clicked "+ Actividad" (isPlacingActivity) or editing boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Case 1: Editing Boundaries - add vertex
      if (isEditingBoundaries) {
        const nextCoords: [number, number][] = [...parkPolygonCoordsRef.current, [lat, lng]];
        parkPolygonCoordsRef.current = nextCoords;
        setParkPolygonCoords(nextCoords);
        if (parkPolygonRef.current) {
          parkPolygonRef.current.setLatLngs(nextCoords);
        }
        renderBoundaryHandles(nextCoords);
        return;
      }

      // Case 2: User clicked "+ Actividad" and is now picking the location!
      if (isPlacingActivity) {
        const isInside = isPointInCustomPolygon(lat, lng, parkPolygonCoords);

        if (tempPinLayerRef.current) {
          tempPinLayerRef.current.clearLayers();
        }

        if (isInside) {
          // Point is VALID
          setBoundaryAlert(null);
          setIsPlacingActivity(false);

          // Place pulsing target marker
          const targetIcon = L.divIcon({
            className: 'target-pin-icon',
            html: `
              <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
                <div class="pin-pulse" style="position:absolute; width:40px; height:40px; border-radius:50%; background:#ea580c; z-index:0;"></div>
                <div style="position:relative; z-index:2; width:34px; height:34px; border-radius:50%; background:#ea580c; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:16px;">
                  📍
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          if (tempPinLayerRef.current) {
            L.marker([lat, lng], { icon: targetIcon }).addTo(tempPinLayerRef.current);
          }

          const locationName = getNearestZoneName(lat, lng);

          // Now open modal with the selected point!
          setTimeout(() => {
            onOpenCreateModal({
              lat,
              lng,
              locationName,
            });
          }, 150);
        } else {
          // Point is OUTSIDE the park limits
          setBoundaryAlert({
            show: true,
            lat,
            lng,
          });

          // Flash red warning marker
          const warningIcon = L.divIcon({
            className: 'warning-pin-icon',
            html: `
              <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:#ef4444; opacity:0.4; animation:pulse-ring 1s infinite;"></div>
                <div style="width:28px; height:28px; border-radius:50%; background:#dc2626; border:2.5px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:white; font-weight:black; font-size:14px;">
                  ✕
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          if (tempPinLayerRef.current) {
            const warnMarker = L.marker([lat, lng], { icon: warningIcon }).addTo(tempPinLayerRef.current);
            setTimeout(() => {
              warnMarker.remove();
            }, 3500);
          }

          // Highlight boundary polygon
          if (parkPolygonRef.current) {
            parkPolygonRef.current.setStyle({
              color: '#ea580c',
              weight: 4,
              fillColor: '#f97316',
              fillOpacity: 0.25,
            });
            setTimeout(() => {
              parkPolygonRef.current?.setStyle({
                color: '#059669',
                weight: 3,
                fillColor: '#10b981',
                fillOpacity: 0.16,
              });
            }, 2500);
          }
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPlacingActivity, isEditingBoundaries, parkPolygonCoords, onOpenCreateModal]);

  // Render User Location on Map
  useEffect(() => {
    const layer = userLocationLayerRef.current;
    if (!layer || !userLocation) return;

    layer.clearLayers();

    // Accuracy Circle
    L.circle([userLocation.lat, userLocation.lng], {
      radius: Math.max(12, Math.min(userLocation.accuracy, 45)),
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(layer);

    // Glowing Blue GPS Dot
    const userLocationIcon = L.divIcon({
      className: 'user-gps-icon',
      html: `
        <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:30px; height:30px; border-radius:50%; background:rgba(37,99,235,0.4); animation:pulse-ring 2s infinite;"></div>
          <div style="width:16px; height:16px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 0 10px rgba(37,99,235,0.8); z-index:2;"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userLocationIcon,
      zIndexOffset: 1000,
    }).addTo(layer);

    marker.bindTooltip(
      userLocation.isInside ? '📍 Tu ubicación (Dentro del Parque)' : '📍 Tu ubicación actual',
      { direction: 'top', offset: [0, -10], className: 'bg-blue-800 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow' }
    );
  }, [userLocation]);

  // Update Activity Markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersLayer || !map) return;

    markersLayer.clearLayers();

    filteredActivities.forEach((activity) => {
      const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.deporte;
      const isSelected = selectedActivityId === activity.id || highlightedActivityId === activity.id;
      const isAttending = activity.isAttending;

      const pinColor = catConfig.color;
      const badgeBg = isAttending ? '#047857' : '#ea580c';

      let iconSymbol = '📍';
      if (activity.category === 'deporte') iconSymbol = '🏃';
      if (activity.category === 'mascotas') iconSymbol = '🐾';
      if (activity.category === 'cultura') iconSymbol = '♟️';
      if (activity.category === 'seguridad') iconSymbol = '🛡️';
      if (activity.category === 'infantil') iconSymbol = '🎈';
      if (activity.category === 'social') iconSymbol = '☕';

      const customIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div style="position:relative; width:48px; height:56px; display:flex; flex-direction:column; align-items:center; cursor:pointer;" class="transition-transform active:scale-90">
            ${
              activity.status === 'activa'
                ? `<div class="pin-pulse" style="position:absolute; top:2px; left:6px; width:36px; height:36px; border-radius:50%; background-color:${pinColor}; z-index:0;"></div>`
                : ''
            }
            <div style="
              position:relative;
              z-index:2;
              width:40px;
              height:40px;
              border-radius:12px;
              background:${pinColor};
              border:2.5px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:20px;
              transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
              transition: transform 0.2s ease;
            ">
              ${iconSymbol}
            </div>

            <div style="
              width:0; 
              height:0; 
              border-left:7px solid transparent; 
              border-right:7px solid transparent; 
              border-top:9px solid ${pinColor}; 
              margin-top:-2px;
              z-index:2;
            "></div>

            <div style="
              position:absolute;
              top:-4px;
              right:0px;
              z-index:3;
              background:${badgeBg};
              color:white;
              font-size:10px;
              font-weight:800;
              padding:2px 5px;
              border-radius:999px;
              border:1.5px solid white;
              box-shadow:0 1px 3px rgba(0,0,0,0.2);
              display:flex;
              align-items:center;
              gap:2px;
            ">
              ${activity.attendeesCount}
            </div>
          </div>
        `,
        iconSize: [48, 56],
        iconAnchor: [24, 52],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([activity.lat, activity.lng], { icon: customIcon });

      // Save marker ref to open programmatically from carousel
      activityMarkersRef.current[activity.id] = marker;

      // Create interactive popup
      const popupContainer = document.createElement('div');
      popupContainer.style.cssText = 'padding:10px 12px; min-width:180px; max-width:240px; font-family:inherit;';
      popupContainer.innerHTML = `
        <div style="font-size:10px; font-weight:800; color:${pinColor}; text-transform:uppercase; margin-bottom:2px;">
          ${catConfig.label}
        </div>
        <div style="font-size:13px; font-weight:800; color:#0f172a; line-height:1.25; margin-bottom:4px;">
          ${activity.title}
        </div>
        <div style="font-size:11px; color:#64748b; margin-bottom:8px; display:flex; align-items:center; gap:3px;">
          <span>📍</span><span>${activity.locationName}</span>
        </div>
        <div style="font-size:11px; font-weight:700; color:#059669; margin-bottom:8px;">
          👥 ${activity.attendeesCount} vecinos confirmados
        </div>
      `;

      const viewBtn = document.createElement('button');
      viewBtn.innerText = 'Ver Detalles';
      viewBtn.style.cssText = 'width:100%; background:#ea580c; color:#fff; border:none; padding:7px 12px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;';
      viewBtn.onclick = (e) => {
        e.stopPropagation();
        onSelectActivity(activity);
      };
      popupContainer.appendChild(viewBtn);

      marker.bindPopup(popupContainer, {
        offset: [0, -44],
        closeButton: true,
      });

      marker.on('click', () => {
        setHighlightedActivityId(activity.id);
        onSelectActivity(activity);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredActivities, selectedActivityId, highlightedActivityId, onSelectActivity]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(PARQUE_ALMAGRO_CENTER, 17, {
        duration: 0.8,
      });
    }
  };

  return (
    <div className={`relative w-full h-[calc(100vh-120px)] flex flex-col bg-stone-100 overflow-hidden ${isPlacingActivity ? 'cursor-crosshair' : ''}`}>
      {/* Top filter chips: Categories & Quick Create */}
      <div className="absolute top-2 left-0 right-0 z-20 px-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* Quick Create Activity button right in the top bar */}
          <button
            onClick={() => {
              if (isPlacingActivity) {
                setIsPlacingActivity(false);
              } else {
                setIsPlacingActivity(true);
                setIsEditingBoundaries(false);
                setBoundaryAlert(null);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-md shrink-0 flex items-center gap-1.5 active:scale-95 ${
              isPlacingActivity
                ? 'bg-stone-900 text-amber-300 ring-2 ring-amber-400'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30'
            }`}
            aria-label="Crear nueva actividad comunitaria"
          >
            {isPlacingActivity ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{isPlacingActivity ? 'Cancelar' : '+ Actividad'}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1 ${
              selectedCategory === 'todas'
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-white/95 backdrop-blur-xs text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Todas ({activities.length})</span>
          </button>

          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = activities.filter((a) => a.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-white/95 backdrop-blur-xs text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
                <span className="text-[10px] opacity-75 font-semibold">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Buttons Column (Top Right) */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-2">
        {/* GPS Live Location Button */}
        <button
          onClick={() => requestUserLocation(true)}
          aria-label="Mi Ubicación Actual"
          title="Ver mi ubicación en el mapa"
          className={`w-11 h-11 rounded-2xl bg-white shadow-lg border border-stone-200 flex items-center justify-center transition-all active:scale-90 ${
            userLocation
              ? 'text-blue-600 ring-2 ring-blue-400'
              : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin text-blue-500' : ''}`} />
        </button>

        {/* Recenter Map on Parque Almagro */}
        <button
          onClick={handleRecenter}
          aria-label="Centrar Parque Almagro"
          title="Centrar Parque Almagro"
          className="w-11 h-11 rounded-2xl bg-white text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all"
        >
          <Compass className="w-5 h-5 text-emerald-700" />
        </button>

        {/* Manual Boundary Calibration Toggle Button */}
        <button
          onClick={() => {
            setIsEditingBoundaries(!isEditingBoundaries);
            setIsPlacingActivity(false);
          }}
          aria-label="Delimitar Parque Manualmente"
          title="Ajustar / Delimitar el parque manualmente"
          className={`w-11 h-11 rounded-2xl shadow-lg border flex items-center justify-center transition-all active:scale-90 ${
            isEditingBoundaries
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* GPS Status Indicator badge */}
      <div className="absolute top-14 left-3 z-20 space-y-1.5">
        {userLocation && (
          <div className="bg-blue-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow text-[10px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
            <span className="truncate">
              {userLocation.isInside ? '✓ Estás en Parque Almagro' : 'Ubicación GPS activa'}
            </span>
          </div>
        )}
      </div>

      {/* STEP 1 ACTIVE: "+ ACTIVIDAD" LOCATION SELECTION PROMPT BANNER */}
      {isPlacingActivity && (
        <div className="absolute top-14 left-3 right-16 z-30 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-3 rounded-2xl shadow-2xl border-2 border-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-amber-200 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-100">
                  Paso 1 de 2: Elige el Punto
                </p>
                <p className="text-xs font-bold leading-tight">
                  Toca dentro del parque donde se juntarán
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlacingActivity(false);
                setBoundaryAlert(null);
              }}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center gap-1 active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* MANUAL BOUNDARY CALIBRATION TOOLBAR (When isEditingBoundaries is active) */}
      {isEditingBoundaries && (
        <div className="absolute top-14 left-3 right-16 z-30 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-amber-400 animate-bounce" />
                <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                  Delimitación Manual del Parque
                </h4>
              </div>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-bold">
                {parkPolygonCoords.length} esquinas
              </span>
            </div>

            <p className="text-xs text-stone-200 leading-snug">
              Arrastra los círculos verdes numerados en el mapa a las esquinas exactas del parque. Toca el mapa si quieres agregar más puntos.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSavePolygon}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Límites</span>
              </button>

              <button
                onClick={handleResetPolygon}
                className="py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1"
                title="Restablecer a valores iniciales"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setIsEditingBoundaries(false)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOUNDARY SAVE TOAST CONFIRMATION */}
      {boundarySaveToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-emerald-800 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>¡Límites del parque guardados con éxito!</span>
        </div>
      )}

      {/* BOUNDARY WARNING BANNER (When touched outside limits) */}
      {boundaryAlert?.show && (
        <div className="absolute top-28 left-3 right-3 z-30 animate-in slide-in-from-top-3 duration-300">
          <div className="bg-red-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border-2 border-red-500 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-800 text-white shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-200" />
            </div>

            <div className="flex-1 text-xs">
              <h4 className="font-black text-sm text-red-200 mb-0.5">
                Ubicación Fuera del Parque Almagro
              </h4>
              <p className="text-red-100/90 leading-relaxed">
                Por favor selecciona un punto dentro del área verde delimitada del parque. Si consideras que el límite está desfasado, puedes usar el botón de editar (✏️) arriba a la derecha.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleRecenter}
                  className="px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-[11px]"
                >
                  Ver parque completo
                </button>
                <button
                  onClick={() => setBoundaryAlert(null)}
                  className="text-red-300 hover:text-white underline text-[11px] font-semibold"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>

            <button
              onClick={() => setBoundaryAlert(null)}
              className="p-1 rounded-full text-red-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* The Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Horizontal Carousel of activities at bottom of map (hidden while placing activity to keep map clean) */}
      {!isPlacingActivity && !isEditingBoundaries && filteredActivities.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 z-20 px-3 pointer-events-none">
          {isCarouselVisible ? (
            <div className="space-y-1">
              {/* Carousel header bar with collapse toggle */}
              <div className="flex items-center justify-between px-1 pointer-events-auto">
                <span className="text-[10px] font-black tracking-wide uppercase text-stone-700 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs border border-stone-200/60">
                  Actividades en el parque ({filteredActivities.length})
                </span>
                <button 
                  onClick={() => setIsCarouselVisible(false)}
                  className="text-[10px] font-bold text-stone-600 bg-white/90 backdrop-blur-xs hover:bg-stone-100 px-2 py-0.5 rounded-full shadow-xs border border-stone-200/60 flex items-center gap-1 active:scale-95 transition-all"
                  title="Ocultar para ver más mapa"
                >
                  <span>Minimizar</span>
                  <X className="w-3 h-3 text-stone-500" />
                </button>
              </div>

              {/* Cards row */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar pointer-events-auto">
                {filteredActivities.map((act) => {
                  const catConf = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.deporte;
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleFlyToActivity(act)}
                      className={`min-w-[250px] max-w-[270px] bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border cursor-pointer transition-all shrink-0 active:scale-[0.98] ${
                        highlightedActivityId === act.id
                          ? 'border-orange-500 ring-2 ring-orange-500/50 bg-orange-50/20'
                          : 'border-stone-200/90 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${catConf.bgBadge} ${catConf.textBadge}`}>
                          {catConf.label}
                        </span>
                        <span className="text-[11px] font-bold text-stone-500">
                          {act.date.split(',')[0]}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-stone-900 text-sm line-clamp-1">
                        {act.title}
                      </h3>

                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-1">
                        <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                        <span className="truncate">{act.locationName}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                          <Users className="w-3.5 h-3.5 text-orange-600" />
                          <span>{act.attendeesCount} vecinos</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectActivity(act);
                            }}
                            className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-0.5 active:scale-95 transition-all"
                            title="Ver detalles de la actividad"
                          >
                            <span>Ver detalles</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Minimized state: pill to expand */
            <div className="pointer-events-auto">
              <button
                onClick={() => setIsCarouselVisible(true)}
                className="bg-white/95 backdrop-blur-xs hover:bg-white text-stone-800 font-black text-xs px-3.5 py-2 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Ver recomendaciones ({filteredActivities.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prominent Floating Action Button (FAB): "+ Actividad" */}
      {/* Positioned safely: when carousel is visible it floats cleanly at bottom-[225px] above cards with 0 overlap; when minimized it drops to bottom-20 */}
      <div 
        className={`fixed z-30 transition-all duration-300 ${
          !isPlacingActivity && !isEditingBoundaries && filteredActivities.length > 0 && isCarouselVisible
            ? 'bottom-[225px] sm:bottom-6 right-3 sm:right-6'
            : 'bottom-20 sm:bottom-6 right-3 sm:right-6'
        }`}
      >
        <button
          onClick={() => {
            if (isPlacingActivity) {
              setIsPlacingActivity(false);
            } else {
              setIsPlacingActivity(true);
              setIsEditingBoundaries(false);
              setBoundaryAlert(null);
            }
          }}
          className={`group flex items-center gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-full font-black text-xs sm:text-base shadow-2xl ring-4 ring-white active:scale-95 transition-all transform hover:-translate-y-0.5 ${
            isPlacingActivity
              ? 'bg-stone-900 text-amber-300 shadow-stone-900/50 ring-amber-400'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-600/50'
          }`}
          aria-label="Crear nueva actividad comunitaria"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {isPlacingActivity ? (
              <X className="w-3.5 h-3.5 text-white" />
            ) : (
              <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white stroke-[3]" />
            )}
          </div>
          <span className="tracking-wide">
            {isPlacingActivity ? 'Cancelar Selección' : '+ Actividad'}
          </span>
        </button>
      </div>
    </div>
  );
};
