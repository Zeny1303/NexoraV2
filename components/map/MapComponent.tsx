"use client";

/**
 * NexoraMap — 3D Tilt Aerial Map
 *
 * Features:
 *  • Mapbox GL 3D buildings + terrain (aerial tilt style)
 *  • Auto device geolocation (fires instantly if permission granted)
 *  • Search any Indian city/area via Mapbox Geocoding API
 *  • Click pin → map pans + "View Event" navigates to /events/[id]
 *  • Click pin → "Directions" draws a driving route from device location
 *  • Nearby events panel with radius slider
 *  • Glassmorphism UI throughout
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface EventMarker {
  _id?: string;
  id?: string;
  longitude?: number;
  latitude?: number;
  coordinates?: { lat: number; lng: number };
  title: string;
  description?: string;
  location?: string;
  imageUrl?: string;
  startDateTime?: string | Date;
  category?: string | { _id: string; name: string };
}

interface EventMapProps {
  events?: EventMarker[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  event: EventMarker;
}

interface CardState {
  event: EventMarker;
  x: number;
  y: number;
  distKm?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  concert:   "#f43f5e",
  festival:  "#f97316",
  meetup:    "#3b82f6",
  sports:    "#22c55e",
  hackathon: "#a855f7",
  workshop:  "#eab308",
  cultural:  "#ec4899",
  other:     "#8b5cf6",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  concert:   "🎵",
  festival:  "🎉",
  meetup:    "🤝",
  sports:    "⚽",
  hackathon: "💻",
  workshop:  "🛠️",
  cultural:  "🎭",
  other:     "📍",
};

// 3D terrain + buildings style
const MAP_STYLE_3D = "mapbox://styles/mapbox/dark-v11";

const DEFAULT_PITCH   = 55;   // 3D tilt angle
const DEFAULT_BEARING = -10;  // slight rotation for depth

const DEMO_EVENTS: EventMarker[] = [
  { id:"demo-1",  longitude:77.5946, latitude:12.9716, title:"Bengaluru Tech Fest",       category:"hackathon", startDateTime:"2026-04-10T18:00:00", location:"UB City, Bengaluru",         description:"India's biggest hackathon — 48hrs of building, demos and ₹50L in prizes." },
  { id:"demo-2",  longitude:72.8777, latitude:19.0760, title:"Mumbai Music Festival",     category:"concert",   startDateTime:"2026-04-15T19:00:00", location:"Bandra Amphitheatre, Mumbai", description:"Five stages, 30 artists. Bollywood, indie and electronic all night long." },
  { id:"demo-3",  longitude:77.2090, latitude:28.6139, title:"Delhi Cultural Mela",       category:"cultural",  startDateTime:"2026-04-20T17:00:00", location:"India Gate Lawns, Delhi",     description:"Celebrate India's diversity — folk music, dance, crafts and street food." },
  { id:"demo-4",  longitude:80.2707, latitude:13.0827, title:"Chennai Sports League",     category:"sports",    startDateTime:"2026-04-18T08:00:00", location:"Nehru Stadium, Chennai",      description:"City-wide cricket and kabaddi tournament open to all age groups." },
  { id:"demo-5",  longitude:85.8245, latitude:20.2961, title:"Bhubaneswar Craft Fair",    category:"festival",  startDateTime:"2026-04-22T10:00:00", location:"Ekamra Haat, Bhubaneswar",   description:"300+ artisans showcase tribal crafts, Pattachitra painting and textiles." },
  { id:"demo-6",  longitude:73.8567, latitude:18.5204, title:"Pune Startup Summit",       category:"meetup",    startDateTime:"2026-04-25T11:00:00", location:"Hinjewadi IT Park, Pune",    description:"150 startups. Investor panels, speed networking and live pitch battles." },
  { id:"demo-7",  longitude:78.4867, latitude:17.3850, title:"Hyderabad Food Carnival",   category:"festival",  startDateTime:"2026-04-28T12:00:00", location:"Hitec City, Hyderabad",       description:"Biryani trails, tasting stalls, chef cook-offs and live qawwali evenings." },
  { id:"demo-8",  longitude:88.3639, latitude:22.5726, title:"Kolkata Book Fair",         category:"cultural",  startDateTime:"2026-05-01T09:00:00", location:"Milan Mela Ground, Kolkata",  description:"Asia's largest book fair — 2000 publishers, authors and literary talks." },
  { id:"demo-9",  longitude:76.9558, latitude:8.5241,  title:"Trivandrum Dance Festival", category:"cultural",  startDateTime:"2026-05-03T18:00:00", location:"Napier Museum Ground, TVM",   description:"Classical Bharatanatyam and Mohiniyattam performances under open skies." },
  { id:"demo-10", longitude:74.8570, latitude:32.7266, title:"Jammu Winter Workshop",     category:"workshop",  startDateTime:"2026-05-05T10:00:00", location:"Raghunath Bazar, Jammu",      description:"3-day photography and handicraft workshop in the heart of old Jammu." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────
function getCategoryName(c?: string | { _id: string; name: string }): string {
  if (!c) return "other";
  return (typeof c === "string" ? c : c.name).toLowerCase().trim();
}
function getColor(c?: string | { _id: string; name: string }): string {
  return CATEGORY_COLORS[getCategoryName(c)] ?? CATEGORY_COLORS.other;
}
function getEmoji(c?: string | { _id: string; name: string }): string {
  return CATEGORY_EMOJIS[getCategoryName(c)] ?? CATEGORY_EMOJIS.other;
}
function getLngLat(e: EventMarker): [number, number] {
  if (e.coordinates) return [e.coordinates.lng, e.coordinates.lat];
  return [e.longitude ?? 0, e.latitude ?? 0];
}
function formatDate(dt?: string | Date): string {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing user-location dot
// ─────────────────────────────────────────────────────────────────────────────
function createUserDot(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:20px;height:20px;";
  const pulse = document.createElement("div");
  pulse.style.cssText =
    "position:absolute;inset:-10px;border-radius:50%;" +
    "background:rgba(59,130,246,.2);animation:nxPulse 2s ease-out infinite;";
  const dot = document.createElement("div");
  dot.style.cssText =
    "position:absolute;inset:0;border-radius:50%;background:#3b82f6;" +
    "border:3px solid #fff;box-shadow:0 0 0 2px rgba(59,130,246,.6),0 4px 12px rgba(0,0,0,.5);";
  wrap.appendChild(pulse);
  wrap.appendChild(dot);
  return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glassmorphism Event Card
// ─────────────────────────────────────────────────────────────────────────────
function EventCard({
  card,
  onClose,
  onDirections,
  onViewEvent,
}: {
  card: CardState;
  onClose: () => void;
  onDirections: (ev: EventMarker) => void;
  onViewEvent: (ev: EventMarker) => void;
}) {
  const { event, x, y, distKm } = card;
  const color   = getColor(event.category);
  const catName = getCategoryName(event.category);
  const dateStr = formatDate(event.startDateTime);

  return (
    <div
      className="absolute z-50 w-[300px] pointer-events-auto select-none"
      style={{ left: x, top: y, animation: "nxCardPop .32s cubic-bezier(.34,1.56,.64,1) both" }}
      onClick={e => e.stopPropagation()}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg,${color},${color}55,transparent)` }}
      />

      {/* Glass body */}
      <div
        className="rounded-b-2xl overflow-hidden"
        style={{
          background: "rgba(7,7,20,0.93)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: `1px solid ${color}40`,
          borderTop: "none",
          boxShadow: `0 0 48px ${color}18,0 28px 56px rgba(0,0,0,.75)`,
        }}
      >
        {/* Image banner or gradient */}
        {event.imageUrl ? (
          <div className="relative h-[110px] overflow-hidden">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(7,7,20,.9),transparent 60%)" }} />
          </div>
        ) : (
          <div
            className="h-[52px] flex items-center px-4 gap-3"
            style={{ background: `linear-gradient(135deg,${color}14,transparent)` }}
          >
            <span className="text-2xl">{getEmoji(event.category)}</span>
            <div className="h-px flex-1" style={{ background: `${color}30` }} />
          </div>
        )}

        <div className="p-4 pt-3">
          {/* Badge row */}
          <div className="flex items-center justify-between mb-[10px] flex-wrap gap-2">
            <span
              className="text-[10px] font-bold tracking-[.1em] uppercase px-[9px] py-[3px] rounded-full"
              style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
            >
              {getEmoji(event.category)} {catName}
            </span>
            {distKm != null && (
              <span
                className="text-[10px] font-bold px-[9px] py-[3px] rounded-full"
                style={{ color:"#fb923c", background:"rgba(251,146,60,.1)", border:"1px solid rgba(251,146,60,.28)" }}
              >
                📍 {distKm} km away
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-white font-bold text-[15px] leading-snug mb-1">{event.title}</p>

          {/* Location */}
          {event.location && (
            <p className="text-white/40 text-[11px] mb-[3px] truncate">📍 {event.location}</p>
          )}

          {/* Date */}
          {dateStr && (
            <p className="text-white/32 text-[11px] mb-3">🗓 {dateStr}</p>
          )}

          {/* Description */}
          {event.description && (
            <p
              className="text-[11px] leading-relaxed mb-3"
              style={{ color:"rgba(200,216,255,.32)", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}
            >
              {event.description}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-2">
            {/* Directions — requires user location */}
            <button
              onClick={() => { onDirections(event); onClose(); }}
              className="flex-1 py-[9px] rounded-[10px] text-[11px] font-bold text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#ea580c,#f97316)" }}
            >
              🗺 Directions
            </button>

            {/* View event detail page */}
            <button
              onClick={() => onViewEvent(event)}
              className="flex-1 py-[9px] rounded-[10px] text-[11px] font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              View Event →
            </button>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[6px] right-[8px] w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer border-0 transition-all hover:bg-white/20"
        style={{ background:"rgba(0,0,0,.55)", color:"rgba(255,255,255,.55)", backdropFilter:"blur(4px)" }}
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function MapComponent({
  events,
  initialCenter = [78.9629, 20.5937],
  initialZoom   = 5,
}: EventMapProps) {

  const router = useRouter();

  // DOM refs
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<any>(null);
  const markersRef     = useRef<any[]>([]);
  const userMarkerRef  = useRef<any>(null);
  const userLocRef     = useRef<[number, number] | null>(null);
  const watchIdRef     = useRef<number | null>(null);
  const initialFitDone = useRef(false);

  // UI state
  const [mapLoaded,       setMapLoaded]       = useState(false);
  const [mapboxError,     setMapboxError]     = useState<string | null>(null);
  const [locStatus,       setLocStatus]       = useState<"idle"|"requesting"|"tracking"|"denied">("idle");
  const [routeInfo,       setRouteInfo]       = useState<RouteInfo | null>(null);
  const [card,            setCard]            = useState<CardState | null>(null);

  // Search
  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState<any[]>([]);
  const [showDrop,        setShowDrop]        = useState(false);
  const [searching,       setSearching]       = useState(false);

  // Nearby panel
  const [nearbyEvents,    setNearbyEvents]    = useState<(EventMarker & { distKm:number })[]>([]);
  const [showNearby,      setShowNearby]      = useState(false);
  const [radiusKm,        setRadiusKm]        = useState(500);

  // Stable event list
  const eventsHash = events ? JSON.stringify(events) : "";
  const displayEvents = useMemo(
    () => (events && events.length > 0 ? events : DEMO_EVENTS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsHash]
  );

  // ── Container height ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const setH = () => {
      const hdr = document.querySelector("header");
      if (wrapperRef.current)
        wrapperRef.current.style.height =
          `${window.innerHeight - (hdr?.getBoundingClientRect().height ?? 0)}px`;
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  // ── Nearby compute ────────────────────────────────────────────────────────
  const computeNearby = useCallback(() => {
    const user = userLocRef.current;
    if (!user) { setNearbyEvents([]); setShowNearby(false); return; }
    const result = displayEvents
      .map(ev => {
        const [lng, lat] = getLngLat(ev);
        return { ...ev, distKm: haversineKm(user[1], user[0], lat, lng) };
      })
      .filter(ev => ev.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);
    setNearbyEvents(result);
    setShowNearby(true);
  }, [displayEvents, radiusKm]);

  useEffect(() => {
    if (userLocRef.current) computeNearby();
  }, [radiusKm, computeNearby]);

  // ── Clear route ───────────────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    ["nx-route-glow", "nx-route"].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("nx-route")) map.removeSource("nx-route");
    setRouteInfo(null);
  }, []);

  // ── Draw driving route ────────────────────────────────────────────────────
  const drawRoute = useCallback(async (event: EventMarker) => {
    const map  = mapRef.current;
    const user = userLocRef.current;
    if (!map || !user) {
      alert("📍 Turn on 'Use My Location' first so we know where to route from.");
      return;
    }
    clearRoute();
    const [dLng, dLat] = getLngLat(event);
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${user[0]},${user[1]};${dLng},${dLat}` +
        `?geometries=geojson&overview=full&access_token=${token}`
      );
      const data  = await res.json();
      const route = data.routes?.[0];
      if (!route) { alert("Could not find a route to this event."); return; }

      const distanceKm  = +(route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);

      map.addSource("nx-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: route.geometry },
      });
      map.addLayer({
        id: "nx-route-glow", type: "line", source: "nx-route",
        layout: { "line-join":"round", "line-cap":"round" },
        paint:  { "line-color":"#fb923c", "line-width":18, "line-opacity":.18, "line-blur":10 },
      });
      map.addLayer({
        id: "nx-route", type: "line", source: "nx-route",
        layout: { "line-join":"round", "line-cap":"round" },
        paint:  { "line-color":"#f97316", "line-width":5, "line-opacity":.96 },
      });

      // Fit map to route bounds
      const coords: [number,number][] = route.geometry.coordinates;
      const lngs = coords.map((c: [number,number]) => c[0]);
      const lats = coords.map((c: [number,number]) => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 100, pitch: DEFAULT_PITCH, bearing: DEFAULT_BEARING, duration: 1800 }
      );

      setRouteInfo({ distanceKm, durationMin, event });
    } catch (err) { console.error("Route error:", err); }
  }, [clearRoute]);

  // ── Navigate to event detail ──────────────────────────────────────────────
  const viewEvent = useCallback((event: EventMarker) => {
    const id = event._id ?? event.id ?? "";
    const isRealId = /^[a-f\d]{24}$/i.test(id);
    if (isRealId) {
      router.push(`/events/${id}`);
    } else {
      // Demo event — open in new tab or show alert
      alert(`Demo event: "${event.title}"\nThis would navigate to /events/${id}`);
    }
  }, [router]);

  // ── Mapbox Geocoding search ───────────────────────────────────────────────
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim() || q.length < 3) { setSearchResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
        `?access_token=${token}&limit=6&country=IN&language=en&types=place,locality,neighborhood,address,poi`
      );
      const data = await res.json();
      setSearchResults(data.features ?? []);
      setShowDrop(true);
    } catch (err) { console.error("Search error:", err); }
    finally { setSearching(false); }
  }, []);

  const flyToResult = useCallback((feature: any) => {
    const map = mapRef.current;
    if (!map) return;
    const [lng, lat] = feature.center;
    // Use bbox if available for better framing
    if (feature.bbox) {
      map.fitBounds(
        [[feature.bbox[0], feature.bbox[1]], [feature.bbox[2], feature.bbox[3]]],
        { padding: 80, pitch: DEFAULT_PITCH, bearing: DEFAULT_BEARING, duration: 2000, maxZoom: 15 }
      );
    } else {
      map.flyTo({ center:[lng,lat], zoom:13, pitch:DEFAULT_PITCH, bearing:DEFAULT_BEARING, duration:2000, essential:true });
    }
    setSearchQuery(feature.place_name ?? feature.text);
    setSearchResults([]);
    setShowDrop(false);
  }, []);

  // ── GPS tracking ──────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) { setLocStatus("denied"); return; }
    setLocStatus("requesting");

    const mapboxgl = (await import("mapbox-gl")).default;
    const isFirst  = { value: true };

    const onSuccess = (pos: GeolocationPosition) => {
      const { longitude: lng, latitude: lat } = pos.coords;
      const firstFix = isFirst.value;
      isFirst.value  = false;
      userLocRef.current = [lng, lat];
      setLocStatus("tracking");

      if (!userMarkerRef.current && mapRef.current) {
        userMarkerRef.current = new (mapboxgl as any).Marker({
          element: createUserDot(), anchor: "center",
        }).setLngLat([lng, lat]).addTo(mapRef.current);
      } else {
        userMarkerRef.current?.setLngLat([lng, lat]);
      }

      // First fix → fly to user location (Google Maps behaviour)
      if (firstFix && mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat], zoom: 14,
          pitch: DEFAULT_PITCH, bearing: DEFAULT_BEARING,
          duration: 2600, essential: true,
        });
      }

      computeNearby();
    };

    const onError = () => setLocStatus("denied");
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts);
  }, [computeNearby]);

  // Auto-start if permission already granted
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then(r => {
        if (r.state === "granted") startTracking();
      }).catch(() => {});
    }
  }, [startTracking]);

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ── Init Mapbox GL ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current || mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) { setMapboxError("NEXT_PUBLIC_MAPBOX_TOKEN missing in .env.local"); return; }

    const boot = async () => {
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      if ((wrapperRef.current?.offsetHeight ?? 0) < 10) {
        setMapboxError("Map container has no height — check parent layout.");
        return;
      }
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        (mapboxgl as any).accessToken = token;

        const map = new (mapboxgl as any).Map({
          container: wrapperRef.current!,
          style: MAP_STYLE_3D,
          center: initialCenter,
          zoom:   initialZoom,
          pitch:  DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          antialias: true,   // smoother 3D buildings
        });

        // ── Mapbox Navigation control (zoom + compass + pitch)
        map.addControl(
          new (mapboxgl as any).NavigationControl({ visualizePitch: true }),
          "bottom-right"
        );

        map.on("load", () => {
          // ── 3D BUILDINGS layer ──────────────────────────────────────────
          const layers = map.getStyle().layers as any[];
          // Find the first symbol layer to insert buildings below labels
          let labelLayerId: string | undefined;
          for (const layer of layers) {
            if (layer.type === "symbol" && layer.layout?.["text-field"]) {
              labelLayerId = layer.id;
              break;
            }
          }
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 10,
              paint: {
                "fill-extrusion-color": [
                  "interpolate", ["linear"], ["zoom"],
                  10, "#0d0d2a",
                  15, "#141430",
                  18, "#1a1a45",
                ],
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 10, 0, 10.5, ["get", "height"]],
                "fill-extrusion-base":   ["interpolate", ["linear"], ["zoom"], 10, 0, 10.5, ["get", "min_height"]],
                "fill-extrusion-opacity": 0.85,
              },
            },
            labelLayerId
          );

          // ── Atmosphere / sky ────────────────────────────────────────────
          map.setFog({
            color: "rgba(5,5,20,0.9)",
            "high-color": "rgba(20,10,50,0.9)",
            "horizon-blend": 0.04,
            "space-color": "#0a0a1e",
            "star-intensity": 0.6,
          });

          setMapLoaded(true);
          mapRef.current = map;
        });

        map.on("error", (e: any) => setMapboxError(e?.error?.message ?? "Map error"));
        map.on("click", () => setCard(null)); // dismiss card on map click

      } catch (err: any) {
        setMapboxError("Mapbox init failed: " + err?.message);
      }
    };

    boot();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fit to events once on load ────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || initialFitDone.current || displayEvents.length === 0) return;
    initialFitDone.current = true;
    const lngs = displayEvents.map(e => getLngLat(e)[0]);
    const lats  = displayEvents.map(e => getLngLat(e)[1]);
    setTimeout(() => {
      mapRef.current?.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding:90, duration:1400, maxZoom:12, pitch:DEFAULT_PITCH, bearing:DEFAULT_BEARING }
      );
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // ── Place event markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      displayEvents.forEach(event => {
        const lngLat  = getLngLat(event);
        const color   = getColor(event.category);
        const eventId = event._id ?? event.id ?? "";
        const safeId  = eventId.replace(/[^a-z0-9]/gi, "");

        // Teardrop SVG pin
        const el = document.createElement("div");
        el.style.cssText =
          `width:36px;height:50px;cursor:pointer;` +
          `filter:drop-shadow(0 6px 12px ${color}99);` +
          `transition:transform .18s cubic-bezier(.34,1.56,.64,1),filter .18s;`;
        el.innerHTML = `
          <svg viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg" width="36" height="50">
            <defs>
              <radialGradient id="rg${safeId}" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stop-color="${color}"/>
                <stop offset="100%" stop-color="${color}bb"/>
              </radialGradient>
            </defs>
            <path fill="url(#rg${safeId})" stroke="rgba(255,255,255,.25)" stroke-width="1.2"
              d="M18 2C10.268 2 4 8.268 4 16c0 10.8 14 32 14 32S32 26.8 32 16C32 8.268 25.732 2 18 2z"/>
            <circle fill="rgba(255,255,255,.92)" cx="18" cy="16" r="7.5"/>
            <text x="18" y="20.5" text-anchor="middle" font-size="9" font-family="Segoe UI Emoji,sans-serif">${getEmoji(event.category)}</text>
          </svg>`;

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.22) translateY(-5px)";
          el.style.filter = `drop-shadow(0 12px 20px ${color}cc)`;
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "";
          el.style.filter = `drop-shadow(0 6px 12px ${color}99)`;
        });

        el.addEventListener("click", e => {
          e.stopPropagation();
          clearRoute();

          const map   = mapRef.current;
          const point = map.project(lngLat);   // pixel coords of pin on map
          const wrap  = wrapperRef.current!;

          // Clamp card so it stays within wrapper
          const cardW = 300, cardH = 340;
          let cx = point.x - cardW / 2;
          let cy = point.y - cardH - 20; // float above pin
          if (cx < 8) cx = 8;
          if (cx + cardW > wrap.clientWidth - 8) cx = wrap.clientWidth - cardW - 8;
          if (cy < 8) cy = point.y + 20;  // flip below if off-screen top

          const distKm = userLocRef.current
            ? haversineKm(userLocRef.current[1], userLocRef.current[0], lngLat[1], lngLat[0])
            : undefined;

          setCard({ event, x: cx, y: cy, distKm });

          // 3D fly-to: pan + zoom + tilt around the event location
          map.flyTo({
            center:   lngLat,
            zoom:     Math.max(map.getZoom(), 13),
            pitch:    DEFAULT_PITCH + 5,
            bearing:  DEFAULT_BEARING + (Math.random() * 10 - 5), // subtle rotation
            duration: 1100,
            offset:   [0, 100], // keep pin in lower half
            essential: true,
          });
        });

        markersRef.current.push(
          new (mapboxgl as any).Marker({ element: el, anchor: "bottom" })
            .setLngLat(lngLat)
            .addTo(mapRef.current)
        );
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, displayEvents]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (mapboxError) return (
    <div ref={wrapperRef} className="w-full flex items-center justify-center bg-[#050514]">
      <div className="text-center px-6 max-w-sm">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-white font-semibold mb-2">Map unavailable</h2>
        <p className="text-zinc-400 text-sm mb-4">{mapboxError}</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes nxPulse {
          0%   { transform:scale(1);   opacity:.75; }
          100% { transform:scale(3);   opacity:0;   }
        }
        @keyframes nxCardPop {
          from { transform:scale(.72) translateY(18px); opacity:0; }
          to   { transform:scale(1)   translateY(0);    opacity:1; }
        }
        .mapboxgl-ctrl-group {
          background:rgba(7,7,20,.88)!important;
          border:1px solid rgba(255,255,255,.1)!important;
          backdrop-filter:blur(14px)!important;
          border-radius:12px!important;
          overflow:hidden!important;
        }
        .mapboxgl-ctrl-group button {
          background:transparent!important;
          border-bottom:1px solid rgba(255,255,255,.07)!important;
          width:32px!important;height:32px!important;
        }
        .mapboxgl-ctrl-group button:hover { background:rgba(255,255,255,.1)!important; }
        .mapboxgl-ctrl-icon { filter:invert(1) opacity(.7); }
        .mapboxgl-ctrl-compass-arrow { fill:white!important; }
      `}</style>

      <div ref={wrapperRef} className="relative w-full overflow-hidden bg-[#050514]">

        {/* Loading */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-[#050514] flex flex-col items-center justify-center z-10 gap-3">
            <div className="w-8 h-8 border-2 border-white/15 border-t-white/70 rounded-full animate-spin" />
            <span className="text-zinc-500 text-sm tracking-wide">Building 3D city…</span>
          </div>
        )}

        {/* ══ SEARCH BAR — top center, Google Maps style ═══════════════════ */}
        {mapLoaded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-3">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background:"rgba(7,7,20,.92)",
                border:"1px solid rgba(255,255,255,.13)",
                backdropFilter:"blur(18px)",
                WebkitBackdropFilter:"blur(18px)",
                boxShadow:"0 8px 40px rgba(0,0,0,.55)",
              }}
            >
              <div className="flex items-center gap-2 px-3.5 py-3">
                <svg className="w-4 h-4 text-white/35 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDrop(true)}
                  placeholder="Search any city, area or landmark in India…"
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/28"
                />
                {searching
                  ? <div className="w-4 h-4 border border-white/20 border-t-white/55 rounded-full animate-spin shrink-0" />
                  : searchQuery
                    ? <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowDrop(false); }}
                        className="text-white/35 hover:text-white/65 text-xl leading-none shrink-0 bg-transparent border-0 cursor-pointer">×</button>
                    : null
                }
              </div>

              {/* Dropdown */}
              {showDrop && searchResults.length > 0 && (
                <div className="border-t border-white/[0.07] pb-1">
                  {searchResults.map((f, i) => (
                    <button key={i} onClick={() => flyToResult(f)}
                      className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-white/[0.06] transition-colors border-0 bg-transparent cursor-pointer">
                      <svg className="w-3.5 h-3.5 mt-[1px] text-white/25 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                      </svg>
                      <div className="min-w-0">
                        <p className="text-white/85 text-[12px] font-medium truncate">{f.text}</p>
                        <p className="text-white/28 text-[10px] truncate mt-[1px]">{f.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ LEFT CONTROLS ════════════════════════════════════════════════ */}
        {mapLoaded && (
          <div className="absolute top-[76px] left-4 z-20 flex flex-col gap-2 w-[220px]">

            {/* GPS button */}
            <button
              onClick={locStatus !== "requesting" ? startTracking : undefined}
              style={{
                background: locStatus === "tracking" ? "rgba(59,130,246,.22)"
                          : locStatus === "denied"   ? "rgba(239,68,68,.14)"
                          : "rgba(7,7,20,.88)",
                border: `1px solid ${
                  locStatus === "tracking" ? "rgba(59,130,246,.45)"
                  : locStatus === "denied" ? "rgba(239,68,68,.38)"
                  : "rgba(255,255,255,.12)"}`,
                color: locStatus === "tracking" ? "#93c5fd"
                     : locStatus === "denied"   ? "#fca5a5"
                     : "#ffffff",
                backdropFilter:"blur(14px)",
                WebkitBackdropFilter:"blur(14px)",
                cursor: locStatus === "requesting" ? "wait" : "pointer",
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border-0 select-none"
            >
              {locStatus === "requesting" && (<><span className="w-3 h-3 border border-white/35 border-t-white/80 rounded-full animate-spin shrink-0"/>Locating…</>)}
              {locStatus === "tracking"   && (<><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"/>Live GPS Active</>)}
              {locStatus === "denied"     && <>⚠ Location denied</>}
              {locStatus === "idle"       && <>📍 Use My Location</>}
            </button>

            {/* Event count badge */}
            <div style={{ background:"rgba(7,7,20,.88)", border:"1px solid rgba(255,255,255,.09)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
              className="px-3 py-2 rounded-xl flex items-center justify-between">
              <span className="text-white/55 text-xs">Events on map</span>
              <span className="text-white text-sm font-bold">{displayEvents.length}</span>
            </div>

            {/* Radius + nearby (when GPS active) */}
            {locStatus === "tracking" && (
              <div style={{ background:"rgba(7,7,20,.88)", border:"1px solid rgba(255,255,255,.09)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
                className="px-3 py-2.5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/45 text-xs">Search radius</span>
                  <span className="text-white text-xs font-semibold">{radiusKm} km</span>
                </div>
                <input type="range" min={50} max={2000} step={50} value={radiusKm}
                  onChange={e => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer" />
                <button onClick={computeNearby}
                  className="text-xs text-violet-400 hover:text-violet-300 text-left bg-transparent border-0 cursor-pointer p-0">
                  Show {nearbyEvents.length} event{nearbyEvents.length !== 1 ? "s" : ""} nearby →
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══ NEARBY EVENTS PANEL — right side ═════════════════════════════ */}
        {showNearby && mapLoaded && (
          <div
            className="absolute top-[76px] right-4 z-20 w-72 rounded-2xl flex flex-col overflow-hidden"
            style={{
              maxHeight: "calc(100% - 130px)",
              background:"rgba(7,7,20,.92)",
              border:"1px solid rgba(255,255,255,.08)",
              backdropFilter:"blur(18px)",
              WebkitBackdropFilter:"blur(18px)",
              boxShadow:"0 8px 40px rgba(0,0,0,.65)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
              <div>
                <p className="text-white text-sm font-semibold">{nearbyEvents.length} nearby</p>
                <p className="text-white/35 text-[10px]">within {radiusKm} km of you</p>
              </div>
              <button onClick={() => setShowNearby(false)}
                style={{ background:"rgba(255,255,255,.06)" }}
                className="w-7 h-7 rounded-full text-white/45 hover:text-white flex items-center justify-center text-base border-0 cursor-pointer transition-all">
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
              {nearbyEvents.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-white/40 text-sm">No events within {radiusKm} km</p>
                  <p className="text-white/25 text-xs mt-1">Try increasing the radius</p>
                </div>
              ) : nearbyEvents.map(ev => {
                const color   = getColor(ev.category);
                const eventId = ev._id ?? ev.id ?? "";
                return (
                  <button key={eventId}
                    onClick={() => {
                      const lngLat = getLngLat(ev);
                      mapRef.current?.flyTo({ center:lngLat, zoom:14, pitch:DEFAULT_PITCH, bearing:DEFAULT_BEARING, duration:1200 });
                      const pt = mapRef.current?.project(lngLat);
                      if (pt && wrapperRef.current) {
                        const w = wrapperRef.current;
                        let cx = pt.x - 150; let cy = pt.y - 360;
                        if (cx < 8) cx = 8;
                        if (cx + 300 > w.clientWidth - 8) cx = w.clientWidth - 308;
                        if (cy < 8) cy = pt.y + 20;
                        setCard({ event: ev, x: cx, y: cy, distKm: ev.distKm });
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.05] flex items-start gap-3 group border-0 bg-transparent cursor-pointer transition-colors">
                    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 text-lg"
                      style={{ background:`${color}1a`, border:`1px solid ${color}44` }}>
                      {ev.imageUrl
                        ? <img src={ev.imageUrl} alt="" className="w-full h-full object-cover rounded-lg"/>
                        : <span>{getEmoji(ev.category)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-violet-300 transition-colors">{ev.title}</p>
                      {ev.location && <p className="text-white/35 text-[10px] truncate mt-[2px]">📍 {ev.location}</p>}
                      {ev.startDateTime && <p className="text-white/25 text-[10px] mt-[2px]">🗓 {formatDate(ev.startDateTime)}</p>}
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className="text-xs font-bold" style={{ color }}>{ev.distKm} km</span>
                      <button
                        onClick={e => { e.stopPropagation(); viewEvent(ev); }}
                        className="text-[9px] text-violet-400 hover:text-violet-300 border-0 bg-transparent cursor-pointer p-0">
                        View →
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ GLASSMORPHISM EVENT CARD ══════════════════════════════════════ */}
        {card && (
          <EventCard
            card={card}
            onClose={() => setCard(null)}
            onDirections={drawRoute}
            onViewEvent={viewEvent}
          />
        )}

        {/* ══ ROUTE INFO BAR — bottom center ═══════════════════════════════ */}
        {routeInfo && (
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5 px-6 py-4 rounded-2xl"
            style={{
              background:"rgba(7,7,20,.94)",
              border:"1px solid rgba(249,115,22,.32)",
              backdropFilter:"blur(18px)",
              WebkitBackdropFilter:"blur(18px)",
              boxShadow:"0 8px 48px rgba(249,115,22,.22)",
              minWidth:"300px", maxWidth:"90vw",
            }}
          >
            <div className="text-center shrink-0">
              <p className="text-orange-400 text-[26px] font-black leading-none">{routeInfo.durationMin}</p>
              <p className="text-white/35 text-[9px] uppercase tracking-widest mt-0.5">min</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="text-center shrink-0">
              <p className="text-white text-[26px] font-black leading-none">{routeInfo.distanceKm}</p>
              <p className="text-white/35 text-[9px] uppercase tracking-widest mt-0.5">km</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Routing to</p>
              <p className="text-white text-sm font-semibold truncate mt-0.5">{routeInfo.event.title}</p>
              {routeInfo.event.location && (
                <p className="text-white/30 text-xs truncate">{routeInfo.event.location}</p>
              )}
            </div>
            <button onClick={clearRoute}
              style={{ background:"rgba(255,255,255,.09)" }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-base text-white/50 hover:text-white shrink-0 border-0 cursor-pointer transition-all">
              ×
            </button>
          </div>
        )}

        {/* ══ CATEGORY LEGEND — bottom left ════════════════════════════════ */}
        {mapLoaded && (
          <div
            className="absolute bottom-8 left-4 z-20 p-3 rounded-xl space-y-[5px]"
            style={{
              background:"rgba(7,7,20,.80)",
              border:"1px solid rgba(255,255,255,.07)",
              backdropFilter:"blur(12px)",
              WebkitBackdropFilter:"blur(12px)",
            }}
          >
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background:color }} />
                <span className="text-white/50 text-[10px] capitalize">{cat}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}