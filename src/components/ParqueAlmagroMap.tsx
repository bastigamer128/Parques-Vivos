import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Activity, ParkLandmark, SchematicZoneId } from '../types';
import {
  PARK_KEY_LANDMARKS,
  PARK_MAP_HEIGHT,
  PARK_MAP_WIDTH,
  SCHEMATIC_ZONES,
  getSchematicZone,
} from '../data/mockData';

interface ParqueAlmagroMapProps {
  activities: Activity[];
  highlightedId: string | null;
  onHighlight: (activityId: string) => void;
  onSelectActivity: (activity: Activity) => void;
  onQuickPublishAtZone?: (zoneId: SchematicZoneId) => void;
}

const DEFAULT_ZOOM = 0.88;
const MAX_ZOOM = 1.9;
const ZOOM_STEP = 1.25;

const LANDMARK_ICON: Record<string, string> = {
  'lm-metro': 'M',
  'lm-sacramentinos': '⛪',
  'lm-monumento': '🗿',
  'lm-bulnes': '🚶',
  'lm-maquinas': '🏋️',
  'lm-sendero-norte': '🏃',
  'lm-juegos': '🛝',
  'lm-escalinata': '🪜',
  'lm-canil': '🐕',
  'lm-rocas': '🪨',
  'lm-pradera': '🌿',
  'lm-cousino': '🏛️',
  'lm-ucentral': '🎓',
};

const QUICK_JUMP_ITEMS: Array<{
  id: string;
  label: string;
  mode: 'fit' | 'point';
  x?: number;
  y?: number;
  zoom?: number;
  landmarkId?: string;
}> = [
  { id: 'todo', label: 'Todo el parque', mode: 'fit' },
  { id: 'metro', label: '🚇 Metro L3', mode: 'point', x: 860, y: 170, zoom: 1.05, landmarkId: 'lm-metro' },
  { id: 'centro', label: 'Explanada y Máquinas', mode: 'point', x: 560, y: 220, zoom: 0.95 },
  { id: 'oriente', label: 'Juegos y Sacramentinos', mode: 'point', x: 800, y: 310, zoom: 0.95 },
  { id: 'canil', label: 'Canil y Rocas', mode: 'point', x: 338, y: 260, zoom: 0.98, landmarkId: 'lm-canil' },
  { id: 'poniente', label: 'Dieciocho y Cousiño', mode: 'point', x: 145, y: 290, zoom: 0.98 },
];

const DECORATIVE_TREES: Array<{ cx: number; cy: number; r: number; tone: 0 | 1 | 2 }> = [
  // Cuadra 1 (Dieciocho - San Ignacio)
  { cx: 74, cy: 118, r: 16, tone: 0 },
  { cx: 118, cy: 114, r: 13, tone: 1 },
  { cx: 192, cy: 122, r: 15, tone: 2 },
  { cx: 72, cy: 256, r: 17, tone: 1 },
  { cx: 198, cy: 292, r: 16, tone: 0 },
  { cx: 190, cy: 412, r: 14, tone: 2 },
  // Cuadra 2 (San Ignacio - Lord Cochrane)
  { cx: 278, cy: 118, r: 15, tone: 1 },
  { cx: 312, cy: 152, r: 14, tone: 0 },
  { cx: 374, cy: 148, r: 16, tone: 2 },
  { cx: 396, cy: 118, r: 13, tone: 1 },
  { cx: 274, cy: 238, r: 14, tone: 0 },
  { cx: 400, cy: 408, r: 15, tone: 1 },
  // Cuadra 3 (Lord Cochrane - Nataniel Cox)
  { cx: 466, cy: 124, r: 14, tone: 0 },
  { cx: 468, cy: 398, r: 16, tone: 2 },
  { cx: 552, cy: 408, r: 15, tone: 1 },
  { cx: 608, cy: 368, r: 16, tone: 0 },
  // Cuadra 4 (Nataniel Cox - San Diego)
  { cx: 678, cy: 112, r: 13, tone: 1 },
  { cx: 766, cy: 112, r: 14, tone: 0 },
  { cx: 804, cy: 116, r: 13, tone: 2 },
  { cx: 676, cy: 224, r: 15, tone: 0 },
  { cx: 678, cy: 412, r: 15, tone: 1 },
  { cx: 794, cy: 406, r: 16, tone: 2 },
  // Cabezal Oriente & Paseo Bulnes
  { cx: 486, cy: 26, r: 9, tone: 1 },
  { cx: 522, cy: 26, r: 9, tone: 1 },
  { cx: 872, cy: 248, r: 12, tone: 0 },
  { cx: 934, cy: 248, r: 12, tone: 1 },
];

const TREE_FILLS = ['#96c48c', '#a6cf9c', '#85b57b'] as const;

export const ParqueAlmagroMap: React.FC<ParqueAlmagroMapProps> = ({
  activities,
  highlightedId,
  onHighlight,
  onSelectActivity,
  onQuickPublishAtZone,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [minZoom, setMinZoom] = useState<number>(0.44);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [selectedLandmark, setSelectedLandmark] = useState<ParkLandmark | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const zoomRef = useRef<number>(zoom);
  zoomRef.current = zoom;
  const minZoomRef = useRef<number>(minZoom);
  minZoomRef.current = minZoom;

  const hasInitializedScrollRef = useRef<boolean>(false);
  const prevHighlightedIdRef = useRef<string | null>(highlightedId);
  const pendingAnchorRef = useRef<{
    mapX: number;
    mapY: number;
    focalX: number;
    focalY: number;
  } | null>(null);

  // Measure viewport width so minimum zoom always fits the full 960px width of Parque Almagro
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateBounds = () => {
      const w = viewport.clientWidth;
      if (w <= 0) return;
      const computedMin = Math.min(0.65, Math.max(0.34, Number((w / PARK_MAP_WIDTH).toFixed(3))));
      setMinZoom(computedMin);
      setZoom((prev) => (prev < computedMin ? computedMin : prev));

      if (!hasInitializedScrollRef.current) {
        hasInitializedScrollRef.current = true;
        // Frame the active central-eastern heart (Explanada -> Máquinas -> Sendero Norte -> Metro L3)
        const initialFocusX = 685;
        const initialFocusY = 235;
        viewport.scrollLeft = Math.max(0, initialFocusX * zoomRef.current - w / 2);
        viewport.scrollTop = Math.max(
          0,
          initialFocusY * zoomRef.current - viewport.clientHeight / 2
        );
      }
    };

    updateBounds();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateBounds);
      ro.observe(viewport);
      return () => ro.disconnect();
    }
  }, []);

  // Synchronously anchor scrollLeft & scrollTop before browser paint whenever zoom changes
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const anchor = pendingAnchorRef.current;
    if (!viewport || !anchor) return;

    viewport.scrollLeft = Math.max(0, anchor.mapX * zoom - anchor.focalX);
    viewport.scrollTop = Math.max(0, anchor.mapY * zoom - anchor.focalY);
    pendingAnchorRef.current = null;
  }, [zoom]);

  const applyZoomAt = (targetZoom: number, focalX?: number, focalY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const clamped = Math.min(
      MAX_ZOOM,
      Math.max(minZoomRef.current, Number(targetZoom.toFixed(3)))
    );
    const prevZoom = zoomRef.current;
    if (Math.abs(clamped - prevZoom) < 0.002) return;

    const fx = focalX ?? viewport.clientWidth / 2;
    const fy = focalY ?? viewport.clientHeight / 2;
    const mapX = (viewport.scrollLeft + fx) / prevZoom;
    const mapY = (viewport.scrollTop + fy) / prevZoom;

    pendingAnchorRef.current = { mapX, mapY, focalX: fx, focalY: fy };
    zoomRef.current = clamped;
    setZoom(clamped);
  };

  const focusMapPoint = (mapX: number, mapY: number, targetZoom?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const nextZoom =
      targetZoom !== undefined
        ? Math.min(MAX_ZOOM, Math.max(minZoomRef.current, Number(targetZoom.toFixed(3))))
        : zoomRef.current;

    if (Math.abs(nextZoom - zoomRef.current) >= 0.004) {
      pendingAnchorRef.current = {
        mapX,
        mapY,
        focalX: viewport.clientWidth / 2,
        focalY: viewport.clientHeight / 2,
      };
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    } else {
      viewport.scrollTo({
        left: Math.max(0, mapX * nextZoom - viewport.clientWidth / 2),
        top: Math.max(0, mapY * nextZoom - viewport.clientHeight / 2),
        behavior: 'smooth',
      });
    }
  };

  // Smoothly bring highlighted activity into view when selected from the list or after publishing
  useEffect(() => {
    if (!highlightedId || highlightedId === prevHighlightedIdRef.current) {
      prevHighlightedIdRef.current = highlightedId;
      return;
    }
    prevHighlightedIdRef.current = highlightedId;

    const act = activities.find((a) => a.id === highlightedId);
    const viewport = viewportRef.current;
    if (!act || !viewport) return;

    const zone = getSchematicZone(act.zoneId, act.locationName);
    const currentZoom = zoomRef.current;
    const pinPxX = zone.x * currentZoom;
    const pinPxY = (zone.y - 16) * currentZoom;
    const margin = 44;

    const isHorizontallyVisible =
      pinPxX >= viewport.scrollLeft + margin &&
      pinPxX <= viewport.scrollLeft + viewport.clientWidth - margin;
    const isVerticallyVisible =
      pinPxY >= viewport.scrollTop + margin &&
      pinPxY <= viewport.scrollTop + viewport.clientHeight - margin;

    if (!isHorizontallyVisible || !isVerticallyVisible) {
      viewport.scrollTo({
        left: Math.max(0, pinPxX - viewport.clientWidth / 2),
        top: Math.max(0, pinPxY - viewport.clientHeight / 2),
        behavior: 'smooth',
      });
    }
  }, [highlightedId, activities]);

  // Attach 2D pointer drag, pinch-to-zoom, and wheel zoom/pan listeners on the scroll container
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const supportsScrollAxisLock =
      typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
        ? CSS.supports('scroll-axis-lock', 'none')
        : false;

    const activePointers = new Map<number, { x: number; y: number }>();
    let dragOrigin: { x: number; y: number; moved: boolean } | null = null;
    let prevPinchDistance: number | null = null;

    const onWheel = (e: WheelEvent) => {
      const rect = viewport.getBoundingClientRect();
      const focalX = e.clientX - rect.left;
      const focalY = e.clientY - rect.top;

      // Trackpad 2D pan when horizontal delta is present and Ctrl/Cmd is not held
      const isTwoAxisTrackpadPan =
        !e.ctrlKey && !e.metaKey && Math.abs(e.deltaX) > 2 && Math.abs(e.deltaX) >= Math.abs(e.deltaY) * 0.3;

      if (isTwoAxisTrackpadPan) {
        if (!supportsScrollAxisLock) {
          e.preventDefault();
          viewport.scrollLeft += e.deltaX;
          viewport.scrollTop += e.deltaY;
        }
        return;
      }

      // Mouse wheel or trackpad pinch -> smooth focal zoom
      e.preventDefault();
      if (Math.abs(e.deltaY) < 0.5) return;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      applyZoomAt(zoomRef.current * factor, focalX, focalY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const targetEl = e.target as Element | null;
      if (targetEl?.closest('button, input, select, textarea, a')) return;

      // Ignore clicks on native scrollbars if visible
      const rect = viewport.getBoundingClientRect();
      if (
        e.clientX - rect.left - viewport.clientLeft >= viewport.clientWidth ||
        e.clientY - rect.top - viewport.clientTop >= viewport.clientHeight
      ) {
        return;
      }

      // Preserve native compositor touch scrolling when scroll-axis-lock: none is natively supported
      if (e.pointerType === 'touch' && supportsScrollAxisLock) {
        return;
      }

      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        dragOrigin = { x: e.clientX, y: e.clientY, moved: false };
      } else {
        prevPinchDistance = null;
      }

      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if synthetic pointer cannot be captured
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = activePointers.get(e.pointerId);
      if (!prev) return;

      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // 2-finger pinch-to-zoom fallback on touchscreens
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const dist = Math.hypot(dx, dy);

        if (prevPinchDistance !== null && prevPinchDistance > 8) {
          const rect = viewport.getBoundingClientRect();
          const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
          const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
          applyZoomAt(zoomRef.current * (dist / prevPinchDistance), midX, midY);
        }
        prevPinchDistance = dist;
        if (dragOrigin) dragOrigin.moved = true;
        return;
      }

      // Single-pointer 2D drag via scrollLeft / scrollTop
      if (activePointers.size === 1 && dragOrigin) {
        const totalMove = Math.hypot(e.clientX - dragOrigin.x, e.clientY - dragOrigin.y);
        // Wait for ~4px movement before entering dragging state so clicks don't trigger grab styling
        if (!dragOrigin.moved && totalMove < 4) {
          return;
        }
        if (!dragOrigin.moved) {
          dragOrigin.moved = true;
          setIsDragging(true);
        }
        viewport.scrollLeft -= e.clientX - prev.x;
        viewport.scrollTop -= e.clientY - prev.y;
      }
    };

    const cleanupPointer = (e: PointerEvent) => {
      const wasTapWithoutDrag =
        activePointers.has(e.pointerId) && activePointers.size === 1 && dragOrigin && !dragOrigin.moved;

      activePointers.delete(e.pointerId);
      prevPinchDistance = null;

      if (activePointers.size === 0) {
        dragOrigin = null;
        setIsDragging(false);
      }

      if (wasTapWithoutDrag) {
        setSelectedLandmark(null);
      }
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', cleanupPointer);
    viewport.addEventListener('pointercancel', cleanupPointer);
    viewport.addEventListener('lostpointercapture', cleanupPointer);

    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', cleanupPointer);
      viewport.removeEventListener('pointercancel', cleanupPointer);
      viewport.removeEventListener('lostpointercapture', cleanupPointer);
    };
  }, []);

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoomAt(zoomRef.current * ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      applyZoomAt(zoomRef.current / ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      focusMapPoint(PARK_MAP_WIDTH / 2, PARK_MAP_HEIGHT / 2, minZoomRef.current);
    } else if (e.key === 'Escape' && selectedLandmark) {
      setSelectedLandmark(null);
    }
  };

  // Group visible activities by schematic zone so multiple pins in the same sector sit side-by-side cleanly
  const groupedByZone = new Map<string, Activity[]>();
  for (const act of activities) {
    const zone = getSchematicZone(act.zoneId, act.locationName);
    const list = groupedByZone.get(zone.id) || [];
    list.push(act);
    groupedByZone.set(zone.id, list);
  }

  const surfaceWidth = Math.round(PARK_MAP_WIDTH * zoom);
  const surfaceHeight = Math.round(PARK_MAP_HEIGHT * zoom);
  const isAtMinZoom = zoom <= minZoom + 0.02;
  const isAtMaxZoom = zoom >= MAX_ZOOM - 0.02;

  return (
    <div className="space-y-2">
      {/* Outer Map Frame with Fixed HUD Overlays */}
      <div className="relative w-full aspect-[16/10] min-h-[252px] rounded-2xl overflow-hidden bg-[#e4ebe0] border border-[#bfd5b9] shadow-2xs">
        {/* 2D Scrollable & Zoomable Viewport */}
        <div
          ref={viewportRef}
          tabIndex={0}
          role="region"
          onKeyDown={handleViewportKeyDown}
          aria-label="Mapa detallado del Parque Almagro. Arrastra o usa las flechas del teclado para recorrer todo el parque, y los botones más y menos para acercar o alejar."
          className={`park-pan-viewport no-scrollbar w-full h-full ${isDragging ? 'is-dragging' : ''}`}
        >
          {/* Scaled Map Surface */}
          <div
            style={{
              width: `${surfaceWidth}px`,
              height: `${surfaceHeight}px`,
            }}
            className="relative"
          >
            {/* Detailed Cartographic SVG of Parque Almagro & Immediate Perimeter */}
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${PARK_MAP_WIDTH} ${PARK_MAP_HEIGHT}`}
              className="w-full h-full block pointer-events-none"
            >
              {/* 1. Immediate Neighborhood Context Base */}
              <rect x="0" y="0" width="960" height="600" fill="#e7ece3" />

              {/* North urban blocks (Barrio Almagro Norte) */}
              <rect x="48" y="6" width="176" height="46" rx="6" fill="#dce3d8" />
              <rect x="252" y="6" width="168" height="46" rx="6" fill="#dce3d8" />
              <rect x="448" y="6" width="24" height="46" rx="4" fill="#dce3d8" />
              <rect x="536" y="6" width="94" height="46" rx="6" fill="#dce3d8" />
              <rect x="658" y="6" width="166" height="46" rx="6" fill="#dce3d8" />
              <rect x="856" y="6" width="94" height="46" rx="6" fill="#dce3d8" />

              {/* Eje Cívico Peatonal Paseo Bulnes (North center) */}
              <rect x="476" y="0" width="56" height="58" fill="#efe8da" />
              <rect x="498" y="8" width="12" height="38" rx="6" fill="#cbe0db" stroke="#aac5be" strokeWidth="1.5" />
              <line x1="476" y1="0" x2="476" y2="58" stroke="#d5ccb9" strokeWidth="2" />
              <line x1="532" y1="0" x2="532" y2="58" stroke="#d5ccb9" strokeWidth="2" />

              {/* South urban blocks & Campus Universidad Central */}
              <rect x="48" y="484" width="176" height="96" rx="8" fill="#dce3d8" />
              <rect x="658" y="484" width="166" height="96" rx="8" fill="#dce3d8" />
              <rect x="856" y="484" width="94" height="96" rx="8" fill="#dce3d8" />

              {/* Campus Universidad Central Buildings (South of Mensía de los Nidos) */}
              <rect
                x="254"
                y="484"
                width="374"
                height="98"
                rx="10"
                fill="#d6e0d4"
                stroke="#bccab9"
                strokeWidth="1.5"
              />
              <rect x="272" y="496" width="136" height="34" rx="5" fill="#c3d0c1" />
              <rect x="424" y="496" width="184" height="34" rx="5" fill="#c3d0c1" />
              <rect x="330" y="540" width="210" height="28" rx="5" fill="#cad6c8" />
              <text
                x="440"
                y="560"
                textAnchor="middle"
                fill="#48604f"
                fontSize="10.5"
                fontWeight="800"
                letterSpacing="0.06em"
              >
                CAMPUS UNIVERSIDAD CENTRAL
              </text>

              {/* 2. Perimeter & Cross Streets Asphalt Grid */}
              {/* Horizontal: Santa Isabel (North) & Mensía de los Nidos (South) */}
              <rect x="0" y="58" width="960" height="32" fill="#cfd6cd" />
              <rect x="0" y="448" width="960" height="30" fill="#cfd6cd" />
              {/* Vertical Streets: Dieciocho, San Ignacio, Lord Cochrane, Nataniel Cox, San Diego */}
              <rect x="18" y="0" width="28" height="600" fill="#cfd6cd" />
              <rect x="226" y="0" width="24" height="600" fill="#cfd6cd" />
              <rect x="422" y="0" width="24" height="600" fill="#cfd6cd" />
              <rect x="632" y="0" width="24" height="600" fill="#cfd6cd" />
              <rect x="826" y="0" width="28" height="600" fill="#c8d0c6" />
              <rect x="950" y="0" width="10" height="600" fill="#cfd6cd" />

              {/* Dashed center lane lines on main streets */}
              <line x1="46" y1="74" x2="950" y2="74" stroke="#eef2ed" strokeWidth="1.6" strokeDasharray="8 8" />
              <line x1="46" y1="463" x2="950" y2="463" stroke="#eef2ed" strokeWidth="1.5" strokeDasharray="8 8" />
              <line x1="840" y1="0" x2="840" y2="600" stroke="#eef2ed" strokeWidth="1.8" strokeDasharray="9 8" />

              {/* 3. Five Green Blocks of Parque Almagro (West -> East) */}
              {/* Cuadra 1: Dieciocho a San Ignacio */}
              <rect x="46" y="90" width="180" height="358" rx="14" fill="#cde3c6" stroke="#b6d1ad" strokeWidth="1.5" />
              <ellipse cx="140" cy="216" rx="68" ry="72" fill="#d9edd2" />

              {/* Entorno Patrimonial Palacio Cousiño (SW corner of Cuadra 1) */}
              <rect
                x="56"
                y="336"
                width="112"
                height="98"
                rx="10"
                fill="#dfd8c8"
                stroke="#c5bba6"
                strokeWidth="1.5"
              />
              <rect x="74" y="352" width="76" height="44" rx="5" fill="#cbbda6" />
              <circle cx="112" cy="414" r="9" fill="#bad5ce" stroke="#9ab8b0" strokeWidth="1.5" />

              {/* Cuadra 2: San Ignacio a Lord Cochrane */}
              <rect x="250" y="90" width="172" height="358" rx="14" fill="#cde3c6" stroke="#b6d1ad" strokeWidth="1.5" />
              <ellipse cx="336" cy="172" rx="64" ry="52" fill="#c2dcba" />

              {/* Cuadra 3: Lord Cochrane a Nataniel Cox (Corazón Cívico) */}
              <rect x="446" y="90" width="186" height="358" rx="14" fill="#cde3c6" stroke="#b6d1ad" strokeWidth="1.5" />
              <ellipse cx="508" cy="262" rx="76" ry="76" fill="#d8ebd1" />

              {/* Cuadra 4: Nataniel Cox a San Diego */}
              <rect x="656" y="90" width="170" height="358" rx="14" fill="#cde3c6" stroke="#b6d1ad" strokeWidth="1.5" />
              <ellipse cx="734" cy="316" rx="62" ry="68" fill="#d8ebd1" />

              {/* Cabezal Oriente: San Diego a Arturo Prat (Metro L3 + Basílica Sacramentinos) */}
              <rect x="854" y="90" width="96" height="358" rx="12" fill="#d5e6cf" stroke="#b6d1ad" strokeWidth="1.5" />

              {/* 4. Pedestrian Crosswalks (Pasos de Cebra) connecting the park blocks */}
              {[228, 424, 634, 828].map((xPos) => (
                <g key={`cw-${xPos}`} fill="#f7faf6" opacity="0.9">
                  {/* Northern trail crossing */}
                  <rect x={xPos + 3} y="120" width="18" height="3.5" rx="1" />
                  <rect x={xPos + 3} y="126" width="18" height="3.5" rx="1" />
                  <rect x={xPos + 3} y="132" width="18" height="3.5" rx="1" />
                  {/* Central axis crossing */}
                  <rect x={xPos + 3} y="254" width="18" height="3.5" rx="1" />
                  <rect x={xPos + 3} y="260" width="18" height="3.5" rx="1" />
                  <rect x={xPos + 3} y="266" width="18" height="3.5" rx="1" />
                  {/* Southern trail crossing */}
                  <rect x={xPos + 3} y="398" width="18" height="3.5" rx="1" />
                  <rect x={xPos + 3} y="404" width="18" height="3.5" rx="1" />
                </g>
              ))}
              {/* Paseo Bulnes crossing over Calle Santa Isabel */}
              <g fill="#f7faf6" opacity="0.92">
                {[482, 490, 498, 506, 514, 522].map((xBar) => (
                  <rect key={`bulnes-cw-${xBar}`} x={xBar} y="62" width="4" height="24" rx="1" />
                ))}
              </g>

              {/* 5. Internal Park Footpaths & Trails (Maicillo y Baldosas) */}
              <g fill="none" stroke="#f3ede1" strokeLinecap="round">
                {/* Sendero Norte continuo (Dieciocho -> Metro L3) */}
                <path d="M 52 128 Q 138 134 226 128" strokeWidth="11" />
                <path d="M 250 128 Q 336 120 422 128" strokeWidth="11" />
                <path d="M 446 128 Q 540 124 632 128" strokeWidth="12" />
                <path d="M 656 128 L 826 128" strokeWidth="13" />

                {/* Paseo Central continuo */}
                <path d="M 52 262 C 110 250, 172 272, 226 262" strokeWidth="12" />
                <path d="M 250 262 C 308 254, 366 268, 422 262" strokeWidth="12" />
                <path d="M 446 262 L 632 262" strokeWidth="14" />
                <path d="M 656 262 C 712 262, 768 246, 826 236" strokeWidth="13" />

                {/* Eje Norte-Sur Paseo Bulnes -> Explanada Central -> Mensía de los Nidos */}
                <path d="M 504 90 L 504 446" strokeWidth="16" />

                {/* Senderos diagonales orgánicos */}
                <path d="M 78 130 C 122 184, 158 228, 218 318" strokeWidth="8.5" />
                <path d="M 262 132 C 304 188, 364 220, 416 260" strokeWidth="8.5" />
                <path d="M 454 398 C 482 342, 504 294, 586 168" strokeWidth="9.5" />
                <path d="M 664 132 C 696 196, 724 268, 772 396" strokeWidth="9.5" />
                <path d="M 54 402 L 222 402" strokeWidth="9" />
                <path d="M 254 404 L 418 404" strokeWidth="9" />
                <path d="M 450 404 L 628 404" strokeWidth="9.5" />
                <path d="M 660 404 L 822 404" strokeWidth="9.5" />
              </g>

              {/* 6. Detailed Park Landmarks & Infrastructure */}

              {/* Sector Rocas (Cuadra 2 North) */}
              <g>
                <ellipse cx="328" cy="172" rx="14" ry="9" fill="#9aa49b" stroke="#7d877e" strokeWidth="1.5" />
                <ellipse cx="348" cy="166" rx="11" ry="8" fill="#adb6ae" stroke="#858f86" strokeWidth="1.5" />
                <ellipse cx="342" cy="181" rx="9" ry="6" fill="#8d978e" />
              </g>

              {/* Canil Cerrado Municipal (Cuadra 2 South) */}
              <g>
                <rect
                  x="278"
                  y="288"
                  width="116"
                  height="94"
                  rx="12"
                  fill="#e7dcc8"
                  stroke="#8b7355"
                  strokeWidth="2.2"
                  strokeDasharray="6 3"
                />
                {/* Double entry gate */}
                <rect x="326" y="283" width="20" height="10" rx="2" fill="#f5efe4" stroke="#8b7355" strokeWidth="1.5" />
                {/* Agility tubes / benches inside canil */}
                <line x1="300" y1="322" x2="328" y2="322" stroke="#a68966" strokeWidth="5" strokeLinecap="round" />
                <circle cx="362" cy="332" r="8" fill="none" stroke="#9c7e5a" strokeWidth="3" />
              </g>

              {/* Monumento y Explanada Central (Cuadra 3 Center) */}
              <g>
                <circle cx="504" cy="262" r="52" fill="#f3ede1" stroke="#dfd5c3" strokeWidth="2.5" />
                <circle cx="504" cy="262" r="35" fill="none" stroke="#ded4c1" strokeWidth="1.8" strokeDasharray="5 4" />
                <circle cx="504" cy="262" r="16" fill="#d7dfd4" stroke="#8fa394" strokeWidth="2" />
                <circle cx="504" cy="262" r="6.5" fill="#2c6343" />
              </g>

              {/* Circuito Máquinas de Ejercicio y Calistenia (Cuadra 3 NE) */}
              <g>
                <rect
                  x="546"
                  y="134"
                  width="76"
                  height="58"
                  rx="10"
                  fill="#dfead9"
                  stroke="#94b48b"
                  strokeWidth="2"
                />
                {/* Exercise stations & bars */}
                <rect x="556" y="145" width="16" height="10" rx="2" fill="#5c8d70" />
                <rect x="578" y="145" width="16" height="10" rx="2" fill="#5c8d70" />
                <line x1="558" y1="170" x2="608" y2="170" stroke="#7d4925" strokeWidth="4" strokeLinecap="round" />
                <circle cx="606" cy="150" r="5" fill="#7d4925" />
              </g>

              {/* Luminarias del Sendero Norte (Cuadra 3 & 4) */}
              {[476, 536, 670, 710, 750, 790].map((lx) => (
                <g key={`lamp-${lx}`}>
                  <circle cx={lx} cy="118" r="6" fill="#fef08a" opacity="0.55" />
                  <circle cx={lx} cy="118" r="2.5" fill="#ca8a04" />
                </g>
              ))}

              {/* Juegos Infantiles, Pérgola y Bebedero (Cuadra 4 Center-South) */}
              <g>
                <rect
                  x="676"
                  y="286"
                  width="96"
                  height="78"
                  rx="14"
                  fill="#efe2cc"
                  stroke="#cfb997"
                  strokeWidth="2"
                />
                {/* Circular Pergola */}
                <circle cx="706" cy="322" r="18" fill="#d7b38c" stroke="#9e7449" strokeWidth="2" />
                <circle cx="706" cy="322" r="7" fill="#f5eadc" />
                {/* Slides / Swings & Drinking fountain */}
                <rect x="736" y="304" width="22" height="14" rx="4" fill="#dd8b5c" />
                <rect x="738" y="328" width="20" height="12" rx="3" fill="#6ca685" />
                {/* Bebedero (water point) */}
                <circle cx="760" cy="296" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              </g>

              {/* Escalinata y Terraza Oriente (Facing Calle San Diego) */}
              <g>
                <rect x="786" y="198" width="36" height="76" rx="6" fill="#ebe3d4" stroke="#cdc1ab" strokeWidth="1.5" />
                <line x1="794" y1="204" x2="794" y2="268" stroke="#c5b8a1" strokeWidth="2" />
                <line x1="802" y1="204" x2="802" y2="268" stroke="#c5b8a1" strokeWidth="2" />
                <line x1="810" y1="204" x2="810" y2="268" stroke="#c5b8a1" strokeWidth="2" />
                <line x1="818" y1="204" x2="818" y2="268" stroke="#c5b8a1" strokeWidth="2" />
              </g>

              {/* Plaza y Acceso Estación Metro Parque Almagro — Línea 3 (NE Corner, San Diego esq. Santa Isabel) */}
              <g>
                <rect
                  x="858"
                  y="96"
                  width="86"
                  height="104"
                  rx="10"
                  fill="#eee9df"
                  stroke="#c7bfb0"
                  strokeWidth="2"
                />
                {/* Metro stairwell canopy */}
                <rect x="870" y="108" width="62" height="36" rx="6" fill="#ffffff" stroke="#c8102e" strokeWidth="2" />
                {/* Stairs lines */}
                <line x1="878" y1="116" x2="878" y2="136" stroke="#9ca3af" strokeWidth="2" />
                <line x1="884" y1="116" x2="884" y2="136" stroke="#9ca3af" strokeWidth="2" />
                <line x1="890" y1="116" x2="890" y2="136" stroke="#9ca3af" strokeWidth="2" />
                {/* Iconic 3 Red Diamonds of Metro de Santiago */}
                <polygon points="904,119 910,126 904,133 898,126" fill="#c8102e" />
                <polygon points="913,119 919,126 913,133 907,126" fill="#c8102e" />
                <polygon points="922,119 928,126 922,133 916,126" fill="#c8102e" />
              </g>

              {/* Plazoleta y Basílica de los Sacramentinos (SE Corner) */}
              <g>
                <rect
                  x="858"
                  y="224"
                  width="86"
                  height="214"
                  rx="10"
                  fill="#ede5d8"
                  stroke="#cbbda6"
                  strokeWidth="1.8"
                />
                {/* Basilica Cruciform Footprint + Iconic Central Dome */}
                <rect x="884" y="274" width="36" height="88" rx="4" fill="#d1bfa5" stroke="#9c8466" strokeWidth="1.8" />
                <rect x="868" y="298" width="68" height="34" rx="4" fill="#d1bfa5" stroke="#9c8466" strokeWidth="1.8" />
                <circle cx="902" cy="315" r="18" fill="#bfa686" stroke="#7d6447" strokeWidth="2" />
                <circle cx="902" cy="315" r="7" fill="#ede5d8" />
              </g>

              {/* 7. Decorative Park Trees */}
              {DECORATIVE_TREES.map((tree, idx) => (
                <circle
                  key={`tree-${idx}`}
                  cx={tree.cx}
                  cy={tree.cy}
                  r={tree.r}
                  fill={TREE_FILLS[tree.tone]}
                  opacity="0.92"
                />
              ))}

              {/* 8. Crisp Street Names for Neighborhood Orientation */}
              <g fill="#485c4e" fontSize="10.5" fontWeight="800" letterSpacing="0.08em">
                <text x="295" y="78" textAnchor="middle">
                  CALLE SANTA ISABEL (NORTE)
                </text>
                <text x="735" y="78" textAnchor="middle">
                  CALLE SANTA ISABEL
                </text>
                <text x="295" y="467" textAnchor="middle">
                  CALLE MENSÍA DE LOS NIDOS (SUR)
                </text>
                <text x="735" y="467" textAnchor="middle">
                  CALLE MENSÍA DE LOS NIDOS
                </text>
              </g>

              {/* Vertical Cross-Street Labels */}
              <g fill="#4c6052" fontSize="9.5" fontWeight="800" letterSpacing="0.06em">
                <text x="35" y="270" textAnchor="middle" transform="rotate(-90 35 270)">
                  CALLE DIECIOCHO
                </text>
                <text x="241" y="210" textAnchor="middle" transform="rotate(-90 241 210)">
                  SAN IGNACIO
                </text>
                <text x="437" y="210" textAnchor="middle" transform="rotate(-90 437 210)">
                  LORD COCHRANE
                </text>
                <text x="647" y="210" textAnchor="middle" transform="rotate(-90 647 210)">
                  NATANIEL COX
                </text>
                <text x="843" y="210" textAnchor="middle" transform="rotate(-90 843 210)">
                  AV. SAN DIEGO
                </text>
              </g>
            </svg>

            {/* 9. Interactive Key Points ("Puntos Clave") of Parque Almagro */}
            {showLandmarks
              ? PARK_KEY_LANDMARKS.map((lm) => {
                  const isMetro = lm.id === 'lm-metro';
                  const isSelected = selectedLandmark?.id === lm.id;
                  const verticalOffset =
                    lm.id === 'lm-bulnes' || lm.id === 'lm-ucentral' ? 0 : 26;
                  const leftPct = (lm.x / PARK_MAP_WIDTH) * 100;
                  const topPct = ((lm.y + verticalOffset) / PARK_MAP_HEIGHT) * 100;

                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLandmark((prev) => (prev?.id === lm.id ? null : lm));
                        focusMapPoint(lm.x, lm.y, Math.max(zoomRef.current, 0.88));
                      }}
                      aria-label={`Punto clave: ${lm.name} (${lm.streetRef})`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full border text-[11px] font-extrabold whitespace-nowrap shadow-xs flex items-center gap-1 transition-transform duration-150 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#16241b] text-white border-white scale-105 z-30 ring-2 ring-[#1f6a42]/40'
                          : isMetro
                          ? 'bg-white text-[#9e0b22] border-[#c8102e] hover:bg-[#fff5f6] z-15'
                          : 'bg-white/94 text-[#1d3324] border-[#b7ccb2] hover:bg-white z-10'
                      }`}
                    >
                      {isMetro ? (
                        <span
                          aria-hidden="true"
                          className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-[#c8102e] text-white text-[9.5px] font-black tracking-tight"
                        >
                          M · L3
                        </span>
                      ) : (
                        <span aria-hidden="true" className="text-[11px] leading-none">
                          {LANDMARK_ICON[lm.id] || '📍'}
                        </span>
                      )}
                      <span>{lm.shortLabel}</span>
                    </button>
                  );
                })
              : null}

            {/* 10. Interactive 1-Tap Activity Time Pins */}
            {Array.from(groupedByZone.entries()).map(([zoneId, zoneActivities]) => {
              const zone = SCHEMATIC_ZONES.find((z) => z.id === zoneId) || SCHEMATIC_ZONES[1];
              return zoneActivities.map((activity, index) => {
                const count = zoneActivities.length;
                const offsetPx = count > 1 ? (index - (count - 1) / 2) * 56 : 0;
                const leftPct = ((zone.x + offsetPx) / PARK_MAP_WIDTH) * 100;
                const topPct = ((zone.y - 16) / PARK_MAP_HEIGHT) * 100;
                const isHighlighted = highlightedId === activity.id;
                const timeText = activity.startTime || '17:30';

                return (
                  <button
                    key={activity.id}
                    type="button"
                    onMouseEnter={() => onHighlight(activity.id)}
                    onFocus={() => onHighlight(activity.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActivity(activity);
                    }}
                    aria-label={`Actividad ${timeText}: ${activity.title} en ${activity.locationName}`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[46px] min-h-[46px] px-2.5 rounded-full border-[2.5px] border-white text-white font-extrabold text-xs tracking-tight shadow-md flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-95 ${
                      isHighlighted
                        ? 'bg-[#7d4925] scale-110 z-30 ring-3 ring-[#7d4925]/30'
                        : 'bg-[#1f6a42] hover:bg-[#185434] z-20'
                    }`}
                  >
                    <span>{timeText}</span>
                    {activity.isAttending ? (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e8f5ec] text-[#1f6a42] border border-[#1f6a42] text-[10px] font-black flex items-center justify-center"
                      >
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              });
            })}
          </div>
        </div>

        {/* Fixed Top-Left HUD: Compass + Landmarks Toggle */}
        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
          <span
            title="Norte hacia Calle Santa Isabel"
            className="px-2 py-1 rounded-lg bg-white/92 backdrop-blur-xs border border-[#c6d6c2] text-[10.5px] font-black text-[#1d3324] shadow-2xs select-none"
          >
            N ↑
          </span>
          <button
            type="button"
            aria-pressed={showLandmarks}
            onClick={() => {
              setShowLandmarks((v) => !v);
              if (showLandmarks) setSelectedLandmark(null);
            }}
            className={`min-h-[30px] px-2.5 py-1 rounded-lg border text-[11px] font-extrabold shadow-2xs transition-colors cursor-pointer ${
              showLandmarks
                ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
                : 'bg-white/92 text-[#233729] border-[#c6d6c2] hover:bg-white'
            }`}
          >
            Puntos clave
          </button>
        </div>

        {/* Fixed Top-Right HUD: Zoom In (+), Zoom Out (-), Fit Full Park */}
        <div className="absolute top-2.5 right-2.5 z-30 flex flex-col gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => applyZoomAt(zoomRef.current * ZOOM_STEP)}
            disabled={isAtMaxZoom}
            aria-label="Acercar mapa"
            title="Acercar (+)"
            className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white disabled:opacity-45 border border-[#c6d6c2] text-[#16241b] text-lg font-black shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoomAt(zoomRef.current / ZOOM_STEP)}
            disabled={isAtMinZoom}
            aria-label="Alejar mapa"
            title="Alejar (−)"
            className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white disabled:opacity-45 border border-[#c6d6c2] text-[#16241b] text-lg font-black shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              if (isAtMinZoom) {
                focusMapPoint(640, 240, DEFAULT_ZOOM);
              } else {
                focusMapPoint(PARK_MAP_WIDTH / 2, PARK_MAP_HEIGHT / 2, minZoomRef.current);
              }
            }}
            aria-label={isAtMinZoom ? 'Volver a vista cercana' : 'Ver todo el Parque Almagro'}
            title={isAtMinZoom ? 'Acercar al centro' : 'Ver todo el parque'}
            className="w-9 h-8 rounded-xl bg-white/95 hover:bg-white border border-[#c6d6c2] text-[#1f6a42] text-[10px] font-black shadow-xs flex items-center justify-center cursor-pointer"
          >
            {isAtMinZoom ? '1x' : 'Todo'}
          </button>
        </div>

        {/* Empty filter notice pill (non-blocking so user can still explore the park!) */}
        {activities.length === 0 && !selectedLandmark ? (
          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-max max-w-[90%]">
            <p className="text-xs font-bold text-[#1f3b28] bg-white/95 px-3.5 py-1.5 rounded-full border border-[#bdd4b7] shadow-xs">
              Sin actividades en este horario · Explora el parque
            </p>
          </div>
        ) : null}

        {/* Selected Key Landmark Info Card */}
        {selectedLandmark ? (
          <div
            role="region"
            aria-label={`Detalle de ${selectedLandmark.name}`}
            className="absolute inset-x-2.5 bottom-2.5 z-40 bg-white/97 backdrop-blur-xs p-3 rounded-xl border border-[#bdd0b8] shadow-md pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#16241b] leading-snug">
                  {selectedLandmark.name}
                </p>
                <p className="text-[11px] font-semibold text-[#1f6a42] mt-0.5">
                  {selectedLandmark.streetRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLandmark(null)}
                aria-label="Cerrar información del punto clave"
                className="w-7 h-7 rounded-lg bg-[#f1f5f0] hover:bg-[#e3ece1] text-[#2c3f31] text-xs font-black flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11.5px] text-[#495c4f] mt-1 leading-relaxed">
              {selectedLandmark.description}
            </p>
            {selectedLandmark.zoneId && onQuickPublishAtZone ? (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onQuickPublishAtZone(selectedLandmark.zoneId!)}
                  className="px-3 py-1.5 rounded-lg bg-[#1f6a42] hover:bg-[#185434] text-white text-[11px] font-extrabold cursor-pointer"
                >
                  Convocar actividad aquí →
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          /* Subtle helper caption when no landmark card is open */
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none"
          >
            <span className="px-2 py-0.5 rounded-md bg-white/85 text-[10px] font-bold text-[#35503d]">
              Arrastra para mover · {Math.round(zoom * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/85 text-[10px] font-semibold text-[#47614e]">
              Dieciocho ↔ Sacramentinos
            </span>
          </div>
        )}
      </div>

      {/* Quick Sector Jump Bar for 1-Tap Navigation Across All 5 Park Blocks */}
      <div
        aria-label="Accesos rápidos a sectores del Parque Almagro"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 touch-pan-x"
      >
        {QUICK_JUMP_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.mode === 'fit') {
                setSelectedLandmark(null);
                focusMapPoint(PARK_MAP_WIDTH / 2, PARK_MAP_HEIGHT / 2, minZoomRef.current);
              } else if (item.x !== undefined && item.y !== undefined) {
                focusMapPoint(item.x, item.y, item.zoom);
                if (item.landmarkId) {
                  const found = PARK_KEY_LANDMARKS.find((l) => l.id === item.landmarkId) || null;
                  setSelectedLandmark(found);
                } else {
                  setSelectedLandmark(null);
                }
              }
            }}
            className="shrink-0 min-h-[30px] px-2.5 py-1 rounded-full bg-white hover:bg-[#eef5ef] border border-[#d5e0d2] text-[11px] font-bold text-[#263a2c] transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
