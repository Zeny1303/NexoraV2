"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

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
  url?: string;
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
  other:     "#a855f7",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  concert:   "🎵",
  festival:  "🎉",
  meetup:    "🤝",
  sports:    "⚽",
  hackathon: "💻",
  workshop:  "🛠",
  cultural:  "🎭",
  other:     "📍",
};

const NEARBY_RADIUS_KM = 1000; // wide default so events show even if user is far

const DEMO_EVENTS: EventMarker[] = [
  { id:"demo-1", longitude:80.9462, latitude:26.8467, title:"Lucknow Music Fest",  category:"concert",  startDateTime:"2026-04-10T18:00:00", location:"Lucknow University", imageUrl:"" },
  { id:"demo-2", longitude:80.9710, latitude:26.8200, title:"Tech Meetup Gomti",   category:"meetup",   startDateTime:"2026-04-15T11:00:00", location:"Gomti Nagar", imageUrl:"" },
  { id:"demo-3", longitude:80.9100, latitude:26.8600, title:"Cultural Festival",   category:"festival", startDateTime:"2026-04-20T17:00:00", location:"Hazratganj", imageUrl:"" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getCategoryName(category?: string | { _id: string; name: string }): string {
  if (!category) return "other";
  if (typeof category === "string") return category.toLowerCase().trim();
  return category.name.toLowerCase().trim();
}

function getColor(category?: string | { _id: string; name: string }): string {
  const key = getCategoryName(category);
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other;
}

function getEmoji(category?: string | { _id: string; name: string }): string {
  const key = getCategoryName(category);
  return CATEGORY_EMOJIS[key] ?? CATEGORY_EMOJIS.other;
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

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
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
// Google Maps-style Popup HTML
// Matches your dark theme (#18172a) and existing card style
// ─────────────────────────────────────────────────────────────────────────────
function buildPopupHTML(event: EventMarker, distKm?: number): string {
  const color    = getColor(event.category);
  const catName  = getCategoryName(event.category);
  const dateStr  = formatDate(event.startDateTime);
  const eventId  = event._id ?? event.id ?? "";
  // Only link to event page for real MongoDB ObjectIds (24 hex chars), not demo IDs
  const isRealId = /^[a-f\d]{24}$/i.test(eventId);
  const viewHref = isRealId ? `/events/${eventId}` : "#";

  // distance badge
  const distBadge = distKm != null
    ? `<div style="
        display:inline-flex;align-items:center;gap:4px;
        background:rgba(251,146,60,.12);color:#fb923c;
        font-size:10px;font-weight:700;padding:3px 8px;
        border-radius:99px;border:1px solid rgba(251,146,60,.25);">
        📍 ${distKm} km away
      </div>`
    : "";

  // image section — show if imageUrl exists
  const imageSection = event.imageUrl
    ? `<div style="position:relative;height:120px;overflow:hidden;">
        <img src="${event.imageUrl}" alt="${event.title}"
          style="width:100%;height:100%;object-fit:cover;display:block;" />
        <div style="position:absolute;inset:0;
          background:linear-gradient(to bottom,transparent 40%,rgba(24,23,42,0.9));"></div>
        <div style="position:absolute;bottom:10px;left:12px;">${distBadge}</div>
      </div>`
    : `<div style="height:5px;background:linear-gradient(90deg,${color},${color}88);"></div>`;

  return `
    <div style="
      font-family:system-ui,-apple-system,sans-serif;
      width:260px;
      background:#18172a;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 12px 40px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.07);
    ">
      ${imageSection}

      <div style="padding:${event.imageUrl ? "10px" : "14px"} 14px 14px;">

        <!-- Category + distance (when no image) -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="
              background:${color}22;color:${color};
              font-size:10px;font-weight:700;letter-spacing:.06em;
              text-transform:uppercase;padding:2px 8px;
              border-radius:99px;border:1px solid ${color}44;">
              ${getEmoji(event.category)} ${catName}
            </span>
          </div>
          ${!event.imageUrl ? distBadge : ""}
        </div>

        <!-- Title -->
        <p style="margin:0 0 5px;font-size:14px;font-weight:700;
          color:#fff;line-height:1.35;">${event.title}</p>

        <!-- Location -->
        ${event.location
          ? `<p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,.38);">
              📍 ${event.location}
            </p>`
          : ""}

        <!-- Date -->
        ${dateStr
          ? `<p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,.35);">
              🗓 ${dateStr}
            </p>`
          : `<div style="margin-bottom:12px;"></div>`}

        <!-- Description snippet -->
        ${event.description
          ? `<p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,.28);
              line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;
              -webkit-box-orient:vertical;overflow:hidden;">${event.description}</p>`
          : ""}

        <!-- Action buttons -->
        <div style="display:flex;gap:8px;">
          <button
            onclick="window.__nexoraRoute('${eventId}')"
            style="flex:1;background:linear-gradient(135deg,#ea580c,#f97316);
              color:#fff;font-size:12px;font-weight:700;border:none;
              padding:9px 0;border-radius:9px;cursor:pointer;
              transition:opacity .15s;">
            🗺 Directions
          </button>
          <a href="${viewHref}"
            style="flex:1;display:block;text-align:center;
              background:linear-gradient(135deg,#7c3aed,#4f46e5);
              color:#fff;font-size:12px;font-weight:600;
              text-decoration:none;padding:9px 0;border-radius:9px;">
            View →
          </a>
        </div>

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing blue dot for user position
// ─────────────────────────────────────────────────────────────────────────────
function createUserDot(): HTMLDivElement {
  const w = document.createElement("div");
  w.style.cssText = "position:relative;width:20px;height:20px;";
  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position:absolute;inset:-8px;border-radius:50%;
    background:rgba(59,130,246,.25);
    animation:nexoraPulse 1.8s ease-out infinite;`;
  const dot = document.createElement("div");
  dot.style.cssText = `
    position:absolute;inset:0;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 0 0 2px rgba(59,130,246,.5),0 4px 12px rgba(0,0,0,.4);`;
  w.appendChild(pulse);
  w.appendChild(dot);
  return w;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EventMap({
  events,
  initialCenter = [78.9629, 20.5937],
  initialZoom   = 5,
}: EventMapProps) {

  const wrapperRef       = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<any>(null);
  const markersRef       = useRef<any[]>([]);
  const userMarkerRef    = useRef<any>(null);
  const popupRef         = useRef<any>(null);
  const userLocationRef  = useRef<[number, number] | null>(null);
  const watchIdRef       = useRef<number | null>(null);
  const initialFitDone   = useRef(false); // ← prevents fitBounds on every re-render

  const [mapLoaded,         setMapLoaded]         = useState(false);
  const [mapboxError,       setMapboxError]       = useState<string | null>(null);
  const [routeInfo,         setRouteInfo]         = useState<RouteInfo | null>(null);
  const [locStatus,         setLocStatus]         = useState<"idle" | "requesting" | "tracking" | "denied">("idle");
  const [manualLocation,    setManualLocation]    = useState("");
  const [manualLocationSet, setManualLocationSet] = useState(false);
  const [manualLabel,       setManualLabel]       = useState("");

  // ── NEW: nearby events panel ──────────────────────────────────────────────
  const [nearbyEvents,    setNearbyEvents]    = useState<(EventMarker & { distKm: number })[]>([]);
  const [showNearbyPanel, setShowNearbyPanel] = useState(false);
  const [radiusKm,        setRadiusKm]        = useState(NEARBY_RADIUS_KM);

  // useMemo prevents a new array reference on every render (which would re-trigger
  // the markers useEffect and cause all markers to be destroyed + recreated = "flying")
  // Since page.tsx polls every 15s, we MUST hash the events array to prevent identical data refs from changing.
  const eventsHash = events ? JSON.stringify(events) : "";
  const displayEvents = useMemo(
    () => (events && events.length > 0) ? events : DEMO_EVENTS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsHash]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Container height — real pixels minus header
  // ─────────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const setH = () => {
      const hdr = document.querySelector("header");
      if (wrapperRef.current)
        wrapperRef.current.style.height =
          `${window.innerHeight - (hdr?.getBoundingClientRect().height ?? 64)}px`;
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Compute nearby events whenever user location or radius changes
  // ─────────────────────────────────────────────────────────────────────────
  const computeNearby = useCallback(() => {
    const user = userLocationRef.current;
    if (!user) { setNearbyEvents([]); setShowNearbyPanel(false); return; }

    const result = displayEvents
      .map(ev => {
        const [lng, lat] = getLngLat(ev);
        const distKm = haversineKm(user[1], user[0], lat, lng);
        return { ...ev, distKm };
      })
      .filter(ev => ev.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);

    setNearbyEvents(result);
    setShowNearbyPanel(true);
  }, [displayEvents, radiusKm]);

  // ─────────────────────────────────────────────────────────────────────────
  // Clear route
  // ─────────────────────────────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    ["nexora-route-glow", "nexora-route"].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("nexora-route")) map.removeSource("nexora-route");
    setRouteInfo(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Draw route — no fitBounds, map stays still
  // ─────────────────────────────────────────────────────────────────────────
  const drawRoute = useCallback(async (event: EventMarker) => {
    const map  = mapRef.current;
    const user = userLocationRef.current;

    if (!map || !user) {
      alert("📍 Please set your location first.\n\nUse 'Use My Location' for GPS\nor type a location in the search box.");
      return;
    }

    clearRoute();
    const dest  = getLngLat(event);
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    try {
      const res  = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${user[0]},${user[1]};${dest[0]},${dest[1]}` +
        `?geometries=geojson&overview=full&access_token=${token}`
      );
      const data  = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      const distanceKm  = +(route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);

      map.addSource("nexora-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: route.geometry },
      });
      map.addLayer({
        id: "nexora-route-glow", type: "line", source: "nexora-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#fb923c", "line-width": 16, "line-opacity": 0.2, "line-blur": 8 },
      });
      map.addLayer({
        id: "nexora-route", type: "line", source: "nexora-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#f97316", "line-width": 5, "line-opacity": 0.95 },
      });

      setRouteInfo({ distanceKm, durationMin, event });
    } catch (err) { console.error("Route error:", err); }
  }, [clearRoute]);

  // ─────────────────────────────────────────────────────────────────────────
  // Manual location geocoding
  // ─────────────────────────────────────────────────────────────────────────
  const handleManualLocation = useCallback(async () => {
    if (!manualLocation.trim()) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    try {
      const res  = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(manualLocation)}.json?access_token=${token}&limit=1`
      );
      const data    = await res.json();
      const feature = data.features?.[0];

      if (!feature) { alert("Location not found. Try a more specific address."); return; }

      const [lng, lat] = feature.center;
      userLocationRef.current = [lng, lat];
      setManualLocationSet(true);
      setManualLabel(feature.place_name ?? manualLocation);
      setLocStatus("idle");

      // Stop GPS watch if running
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }

      // ── Compute nearby events
      setTimeout(computeNearby, 50); // after state is flushed

    } catch (err) { console.error("Geocoding error:", err); }
  }, [manualLocation, computeNearby]);

  // ─────────────────────────────────────────────────────────────────────────
  // Bridge popup → React drawRoute
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (window as any).__nexoraRoute = (eventId: string) => {
      const ev = displayEvents.find(e => (e._id ?? e.id) === eventId);
      if (ev) { popupRef.current?.remove(); drawRoute(ev); }
    };
    return () => { delete (window as any).__nexoraRoute; };
  }, [displayEvents, drawRoute]);

  // ─────────────────────────────────────────────────────────────────────────
  // Live GPS — no map movement
  // ─────────────────────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) { setLocStatus("denied"); return; }
    setLocStatus("requesting");
    setManualLocationSet(false);
    setManualLocation("");

    const mapboxgl = (await import("mapbox-gl")).default;

    const onSuccess = (pos: GeolocationPosition) => {
      const { longitude: lng, latitude: lat } = pos.coords;
      userLocationRef.current = [lng, lat];
      setLocStatus("tracking");

      if (!userMarkerRef.current) {
        if (mapRef.current) {
          userMarkerRef.current = new (mapboxgl as any).Marker({
            element: createUserDot(),
            anchor:  "center",
          })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);
        }
        // ← NO map movement when GPS activates. Map stays on events.
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }

      // Update nearby panel
      computeNearby();
    };

    const onError = (err: GeolocationPositionError) => {
      console.error("Geolocation error:", err.message);
      setLocStatus("denied");
    };

    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts);
  }, [computeNearby]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-start GPS if previously granted (Google Maps style)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if ("geolocation" in navigator && "permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          startTracking();
        }
      }).catch(() => {});
    }
  }, [startTracking]);

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Re-compute nearby whenever radius changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLocationRef.current) computeNearby();
  }, [radiusKm, computeNearby]);

  // ─────────────────────────────────────────────────────────────────────────
  // Init Mapbox
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current || mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) { setMapboxError("NEXT_PUBLIC_MAPBOX_TOKEN missing in .env.local"); return; }

    const boot = async () => {
      await new Promise(r => requestAnimationFrame(r));
      const h = wrapperRef.current?.offsetHeight ?? 0;
      if (h < 10) { setMapboxError(`Container height is ${h}px — layout issue`); return; }
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        (mapboxgl as any).accessToken = token;
        const map = new (mapboxgl as any).Map({
          container: wrapperRef.current!,
          style:     "mapbox://styles/mapbox/dark-v11",
          center:    initialCenter,
          zoom:      initialZoom,
        });

        // ── Single shared popup (Google Maps style — one at a time) ──
        popupRef.current = new (mapboxgl as any).Popup({
          closeButton:  true,
          closeOnClick: false,        // only close on X or map click
          maxWidth:     "280px",
          offset:       [0, -20],     // float above marker tip
          className:    "nexora-popup",
        });

        map.on("load",  () => { setMapLoaded(true); mapRef.current = map; });
        map.on("error", (e: any) => setMapboxError(e?.error?.message ?? "Map error"));

        // Close popup when clicking blank map area
        map.on("click", () => popupRef.current?.remove());

      } catch (err: any) { setMapboxError("Init failed: " + err?.message); }
    };
    boot();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Initial Map Bounds Fit (One-time)
  // NOTE: Isolate fitBounds into its own one-time useEffect dependent ONLY on mapLoaded
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || initialFitDone.current) return;
    if (displayEvents.length === 0) return;
    initialFitDone.current = true;
    const lngs = displayEvents.map(e => getLngLat(e)[0]);
    const lats = displayEvents.map(e => getLngLat(e)[1]);
    setTimeout(() => {
      mapRef.current?.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)],
         [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, duration: 800, maxZoom: 14 }
      );
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // ─────────────────────────────────────────────────────────────────────────
  // Place markers
  // NOTE: This effect must NOT depend on locStatus, nearbyEvents, or any other
  // state that changes after GPS/location is set.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      displayEvents.forEach(event => {
        const lngLat  = getLngLat(event);
        const color   = getColor(event.category);
        const eventId = event._id ?? event.id ?? "";

        // ── Default Google Maps-like static marker element ──
        const el = document.createElement("div");
        el.dataset.eventId = eventId;
        el.style.cssText = `
          width: 24px;
          height: 36px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="${encodeURIComponent(color)}" d="M12 0C5.373 0 0 5.373 0 12c0 8.442 11.16 23.362 11.536 23.858a.63.63 0 00.928 0C12.84 35.362 24 20.442 24 12c0-6.627-5.373-12-12-12z"/><circle fill="%23fff" cx="12" cy="12" r="5"/></svg>');
          background-size: cover;
          cursor: pointer;
        `;
        
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.1)";
          el.style.transition = "transform 0.1s ease";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        // Click reads userLocationRef.current at click-time (not at render-time)
        // so distance is always fresh without needing to re-create markers
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          clearRoute();

          const dist = userLocationRef.current
            ? haversineKm(userLocationRef.current[1], userLocationRef.current[0], lngLat[1], lngLat[0])
            : undefined;

          // Google Maps style: popup anchored to marker, map gently pans
          popupRef.current
            .setLngLat(lngLat)
            .setHTML(buildPopupHTML(event, dist))
            .addTo(mapRef.current);
        });

        markersRef.current.push(
          new (mapboxgl as any).Marker({ element: el })
            .setLngLat(lngLat)
            .addTo(mapRef.current)
        );
      });
    })();
  // ← Only re-run when map loads or event data actually changes.
  // locStatus, nearbyEvents, routeInfo etc. must NOT be here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, displayEvents]);

  // ─────────────────────────────────────────────────────────────────────────
  // Open popup from nearby panel (completely static map)
  // ─────────────────────────────────────────────────────────────────────────
  const focusEvent = useCallback((event: EventMarker & { distKm: number }) => {
    const lngLat = getLngLat(event);

    popupRef.current
      ?.setLngLat(lngLat)
      .setHTML(buildPopupHTML(event, event.distKm))
      .addTo(mapRef.current);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────────────────
  if (mapboxError) return (
    <div ref={wrapperRef} className="w-full flex items-center justify-center bg-zinc-950">
      <div className="text-center px-6 max-w-sm">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-white font-semibold mb-2">Map unavailable</h2>
        <p className="text-zinc-400 text-sm">{mapboxError}</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @keyframes nexoraPulse {
          0%   { transform:scale(1);   opacity:.8; }
          100% { transform:scale(2.8); opacity:0;  }
        }
        /* Google Maps style popup — no arrow, no white background */
        .nexora-popup .mapboxgl-popup-content {
          background:transparent!important;
          padding:0!important;
          box-shadow:none!important;
          border-radius:14px!important;
        }
        .nexora-popup .mapboxgl-popup-tip {
          display:none!important;
        }
        /* Close button styling */
        .nexora-popup .mapboxgl-popup-close-button {
          display:none!important; /* We handle close via map click */
        }
        .mapboxgl-marker { z-index:1!important; }
      `}</style>

      <div ref={wrapperRef} className="relative w-full overflow-hidden">

        {/* ── Loading overlay ── */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center z-10 gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Loading map…</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT SIDEBAR — Location controls
        ═══════════════════════════════════════════════════════════════════ */}
        {mapLoaded && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 w-64 min-w-0" style={{ maxWidth: "calc(100vw - 2rem)" }}>

            {/* Event count badge */}
            <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2
                            flex items-center justify-between">
              <p className="text-white text-sm font-medium">
                {displayEvents.length} event{displayEvents.length !== 1 ? "s" : ""}
              </p>
              {locStatus === "tracking" && (
                <span className="text-blue-400 text-xs animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  live
                </span>
              )}
            </div>

            {/* GPS button */}
            <button
              onClick={locStatus !== "requesting" ? startTracking : undefined}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                         border backdrop-blur-sm transition-all duration-200 select-none"
              style={{
                background:  locStatus === "tracking" ? "rgba(59,130,246,.25)"
                           : locStatus === "denied"   ? "rgba(239,68,68,.15)"
                           : "rgba(0,0,0,.70)",
                borderColor: locStatus === "tracking" ? "rgba(59,130,246,.5)"
                           : locStatus === "denied"   ? "rgba(239,68,68,.4)"
                           : "rgba(255,255,255,.12)",
                color:       locStatus === "tracking" ? "#93c5fd"
                           : locStatus === "denied"   ? "#fca5a5"
                           : "#ffffff",
                cursor:      locStatus === "requesting" ? "wait" : "pointer",
              }}
            >
              {locStatus === "requesting" && (
                <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full
                                   animate-spin inline-block flex-shrink-0" /> Locating…</>
              )}
              {locStatus === "tracking" && (
                <><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block flex-shrink-0" />
                  Live Location Active</>
              )}
              {locStatus === "denied"   && <>⚠ Location denied — retry</>}
              {locStatus === "idle"     && <>📍 Use My Location</>}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Manual location input */}
            <div className="flex flex-col gap-1.5">
              <p className="text-white/40 text-xs pl-1">Enter your location for distances</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={e => setManualLocation(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleManualLocation()}
                  placeholder="e.g. Koramangala, Bengaluru"
                  className="flex-1 px-3 py-2 rounded-xl text-xs text-white
                             bg-black/70 border border-white/10 backdrop-blur-sm
                             placeholder:text-white/25 outline-none
                             focus:border-violet-500/50 transition-colors"
                />
                <button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-semibold
                             bg-violet-600/80 border border-violet-500/40 text-white
                             hover:bg-violet-500/80 disabled:opacity-30
                             backdrop-blur-sm transition-all"
                >Go</button>
              </div>

              {/* Manual location set confirmation */}
              {manualLocationSet && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                                bg-green-500/10 border border-green-500/20
                                text-green-400 text-xs">
                  <span className="truncate flex-1">📍 {manualLabel || manualLocation}</span>
                  <button
                    onClick={() => {
                      setManualLocation(""); setManualLocationSet(false);
                      setManualLabel(""); userLocationRef.current = null;
                      setNearbyEvents([]); setShowNearbyPanel(false);
                      clearRoute();
                    }}
                    className="text-green-400/50 hover:text-green-300 shrink-0 text-base leading-none"
                  >×</button>
                </div>
              )}
            </div>

            {/* ── Radius slider (shown when location is set) ── */}
            {(manualLocationSet || locStatus === "tracking") && (
              <div className="bg-black/70 backdrop-blur-sm border border-white/10
                              rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs">Nearby radius</span>
                  <span className="text-white text-xs font-semibold">{radiusKm} km</span>
                </div>
                <input
                  type="range" min={10} max={2000} step={10}
                  value={radiusKm}
                  onChange={e => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-white/25 text-[10px]">
                  <span>10 km</span><span>2000 km</span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT PANEL — Nearby events list (Google Maps sidebar style)
        ═══════════════════════════════════════════════════════════════════ */}
        {showNearbyPanel && mapLoaded && (
          <div className="absolute top-4 right-4 z-20 w-72
                          bg-[#18172a]/95 backdrop-blur-md
                          border border-white/08 rounded-2xl
                          shadow-[0_8px_40px_rgba(0,0,0,.6)]
                          flex flex-col max-h-[calc(100%-120px)] overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3
                            border-b border-white/08 shrink-0">
              <div>
                <p className="text-white text-sm font-semibold">
                  {nearbyEvents.length} nearby event{nearbyEvents.length !== 1 ? "s" : ""}
                </p>
                <p className="text-white/40 text-xs">within {radiusKm} km</p>
              </div>
              <button
                onClick={() => setShowNearbyPanel(false)}
                className="w-7 h-7 rounded-full bg-white/08 hover:bg-white/15
                           text-white/50 hover:text-white flex items-center justify-center
                           text-base transition-all"
              >×</button>
            </div>

            {/* Events list */}
            <div className="overflow-y-auto flex-1 divide-y divide-white/05">
              {nearbyEvents.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-4xl mb-2">🔍</p>
                  <p className="text-white/50 text-sm">No events within {radiusKm} km</p>
                  {(() => {
                    const user = userLocationRef.current;
                    if (!user) return null;
                    const nearest = displayEvents
                      .map(ev => ({ ...ev, d: haversineKm(user[1], user[0], getLngLat(ev)[1], getLngLat(ev)[0]) }))
                      .sort((a,b) => a.d - b.d)[0];
                    return nearest
                      ? <p className="text-white/30 text-xs mt-1">Nearest event is <span className="text-violet-400 font-semibold">{nearest.d} km</span> away — increase radius</p>
                      : null;
                  })()}
                </div>
              ) : (
                nearbyEvents.map(event => {
                  const color   = getColor(event.category);
                  const eventId = event._id ?? event.id ?? "";
                  return (
                    <button
                      key={eventId}
                      onClick={() => focusEvent(event)}
                      className="w-full text-left px-4 py-3 hover:bg-white/05
                                 transition-colors flex items-start gap-3 group"
                    >
                      {/* Color dot / image */}
                      <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden
                                      flex items-center justify-center mt-0.5"
                        style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                        {event.imageUrl
                          ? <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-lg">{getEmoji(event.category)}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate
                                      group-hover:text-violet-300 transition-colors">
                          {event.title}
                        </p>
                        {event.location && (
                          <p className="text-white/40 text-xs truncate mt-0.5">
                            📍 {event.location}
                          </p>
                        )}
                        {event.startDateTime && (
                          <p className="text-white/30 text-xs mt-0.5">
                            🗓 {formatDate(event.startDateTime)}
                          </p>
                        )}
                      </div>

                      {/* Distance badge */}
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-bold"
                          style={{ color }}>
                          {event.distKm} km
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            BOTTOM CENTER — Route info card
        ═══════════════════════════════════════════════════════════════════ */}
        {routeInfo && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20
                          bg-[#18172a]/95 backdrop-blur-md
                          border border-orange-500/30 rounded-2xl px-5 py-4
                          shadow-[0_8px_40px_rgba(249,115,22,.3)]
                          flex items-center gap-5 min-w-[300px] max-w-[90vw]">
            <div className="text-center shrink-0">
              <p className="text-orange-400 text-2xl font-black leading-none">{routeInfo.durationMin}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">min</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="text-center shrink-0">
              <p className="text-white text-2xl font-black leading-none">{routeInfo.distanceKm}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">km</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">To</p>
              <p className="text-white text-sm font-semibold truncate">{routeInfo.event.title}</p>
              {routeInfo.event.location && (
                <p className="text-white/35 text-xs truncate">{routeInfo.event.location}</p>
              )}
            </div>
            <button
              onClick={clearRoute}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20
                         text-white/60 hover:text-white flex items-center justify-center
                         text-base transition-all shrink-0">×</button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            BOTTOM LEFT — Legend
        ═══════════════════════════════════════════════════════════════════ */}
        {mapLoaded && (
          <div className="absolute bottom-8 left-4 z-20 bg-black/60 backdrop-blur-sm
                          border border-white/10 rounded-xl p-3 space-y-1.5">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }} />
                <span className="text-white/60 text-xs capitalize">{cat}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}