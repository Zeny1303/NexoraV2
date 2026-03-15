"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";

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
  category?: string;
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

// ── Every category gets a distinct color ──────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  concert:  "#f43f5e",   // red-pink
  festival: "#f97316",   // orange
  meetup:   "#3b82f6",   // blue
  sports:   "#22c55e",   // green
  other:    "#a855f7",   // purple
};
function getColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.other;
  const key = category.toLowerCase().trim();
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other;
}

const DEMO_EVENTS: EventMarker[] = [
  { id:"1", longitude:80.9462, latitude:26.8467, title:"Lucknow Music Fest",  category:"concert",  startDateTime:"2026-04-10T18:00:00", location:"Lucknow University" },
  { id:"2", longitude:80.9710, latitude:26.8200, title:"Tech Meetup Gomti",   category:"meetup",   startDateTime:"2026-04-15T11:00:00", location:"Gomti Nagar" },
  { id:"3", longitude:80.9100, latitude:26.8600, title:"Cultural Festival",   category:"festival", startDateTime:"2026-04-20T17:00:00", location:"Hazratganj" },
];

function getLngLat(e: EventMarker): [number, number] {
  if (e.coordinates) return [e.coordinates.lng, e.coordinates.lat];
  return [e.longitude ?? 0, e.latitude ?? 0];
}

function formatDate(dt?: string | Date): string {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-IN", {
    day:"numeric", month:"short", hour:"2-digit", minute:"2-digit",
  });
}

function haversineKm(lat1:number, lng1:number, lat2:number, lng2:number): number {
  const R = 6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
}

function buildPopupHTML(event: EventMarker, distKm?: number): string {
  const color    = getColor(event.category);
  const catLabel = (event.category ?? "other");
  const dateStr  = formatDate(event.startDateTime);
  const eventId  = event._id ?? event.id ?? "";
  const viewHref = eventId ? `/events/${eventId}` : "#";
  const distBadge = distKm != null
    ? `<span style="background:rgba(251,146,60,.15);color:#fb923c;font-size:10px;font-weight:700;
        padding:2px 8px;border-radius:99px;border:1px solid rgba(251,146,60,.3);">${distKm} km away</span>`
    : "";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:220px;max-width:260px;
      background:#18172a;border-radius:14px;overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.08);">
      <div style="height:4px;background:${color};"></div>
      <div style="padding:14px 16px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:4px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
            <span style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.45);">${catLabel}</span>
          </div>
          ${distBadge}
        </div>
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;line-height:1.35;">${event.title}</p>
        ${event.location ? `<p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,.35);">📍 ${event.location}</p>` : ""}
        ${dateStr        ? `<p style="margin:0 0 14px;font-size:11px;color:rgba(255,255,255,.4);">📅 ${dateStr}</p>` : '<div style="margin-bottom:14px;"></div>'}
        <div style="display:flex;gap:8px;">
          <button onclick="window.__nexoraRoute('${eventId}')" style="
            flex:1;background:linear-gradient(135deg,#ea580c,#f97316);
            color:#fff;font-size:12px;font-weight:700;border:none;padding:8px 0;
            border-radius:8px;cursor:pointer;">🗺 Directions</button>
          <a href="${viewHref}" style="
            flex:1;display:block;text-align:center;
            background:linear-gradient(135deg,#7c3aed,#4f46e5);
            color:#fff;font-size:12px;font-weight:600;
            text-decoration:none;padding:8px 0;border-radius:8px;">View →</a>
        </div>
      </div>
    </div>`;
}

// Pulsing blue dot for user position
function createUserDot(): HTMLDivElement {
  const w = document.createElement("div");
  w.style.cssText = "position:relative;width:20px;height:20px;";
  const pulse = document.createElement("div");
  pulse.style.cssText = `position:absolute;inset:-8px;border-radius:50%;
    background:rgba(59,130,246,.25);animation:nexoraPulse 1.8s ease-out infinite;`;
  const dot = document.createElement("div");
  dot.style.cssText = `position:absolute;inset:0;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 0 0 2px rgba(59,130,246,.5),0 4px 12px rgba(0,0,0,.4);`;
  w.appendChild(pulse);
  w.appendChild(dot);
  return w;
}

export default function EventMap({ events, initialCenter=[80.9462,26.8467], initialZoom=12 }: EventMapProps) {
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markersRef      = useRef<any[]>([]);
  const userMarkerRef   = useRef<any>(null);
  const popupRef        = useRef<any>(null);
  const userLocationRef = useRef<[number,number]|null>(null);
  const watchIdRef      = useRef<number|null>(null);

  const [mapLoaded,   setMapLoaded]   = useState(false);
  const [mapboxError, setMapboxError] = useState<string|null>(null);
  const [routeInfo,   setRouteInfo]   = useState<RouteInfo|null>(null);
  const [locStatus,   setLocStatus]   = useState<"idle"|"requesting"|"tracking"|"denied">("idle");

  const displayEvents = events ?? DEMO_EVENTS;

  // ── Real pixel height ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const setH = () => {
      const hdr = document.querySelector("header");
      if (wrapperRef.current)
        wrapperRef.current.style.height = `${window.innerHeight - (hdr?.getBoundingClientRect().height ?? 64)}px`;
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  // ── Clear route ───────────────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    ["nexora-route-glow","nexora-route"].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource("nexora-route")) map.removeSource("nexora-route");
    setRouteInfo(null);
  }, []);

  // ── Draw route via Mapbox Directions ─────────────────────────────────────
  const drawRoute = useCallback(async (event: EventMarker) => {
    const map  = mapRef.current;
    const user = userLocationRef.current;
    if (!map || !user) {
      alert("📍 Please tap 'Locate Me' first so we know your starting point.");
      return;
    }
    clearRoute();
    const dest  = getLngLat(event);
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    try {
      const res  = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/`+
        `${user[0]},${user[1]};${dest[0]},${dest[1]}`+
        `?geometries=geojson&overview=full&access_token=${token}`
      );
      const data  = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      const distanceKm  = +(route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);

      map.addSource("nexora-route", {
        type:"geojson",
        data:{ type:"Feature", properties:{}, geometry:route.geometry },
      });
      map.addLayer({
        id:"nexora-route-glow", type:"line", source:"nexora-route",
        layout:{ "line-join":"round","line-cap":"round" },
        paint:{ "line-color":"#fb923c","line-width":16,"line-opacity":0.2,"line-blur":8 },
      });
      map.addLayer({
        id:"nexora-route", type:"line", source:"nexora-route",
        layout:{ "line-join":"round","line-cap":"round" },
        paint:{ "line-color":"#f97316","line-width":5,"line-opacity":0.95 },
      });
      setRouteInfo({ distanceKm, durationMin, event });

      const coords:[number,number][] = route.geometry.coordinates;
      const bounds = coords.reduce(
        (b,c)=>([[Math.min(b[0][0],c[0]),Math.min(b[0][1],c[1])],[Math.max(b[1][0],c[0]),Math.max(b[1][1],c[1])]]),
        [[coords[0][0],coords[0][1]],[coords[0][0],coords[0][1]]] as [[number,number],[number,number]]
      );
      map.fitBounds(bounds, { padding:{top:120,bottom:200,left:80,right:80}, duration:1200 });
    } catch(err) { console.error("Route error:",err); }
  }, [clearRoute]);

  // ── Bridge popup button → React drawRoute ────────────────────────────────
  useEffect(() => {
    (window as any).__nexoraRoute = (eventId: string) => {
      const ev = displayEvents.find(e => (e._id ?? e.id) === eventId);
      if (ev) { popupRef.current?.remove(); drawRoute(ev); }
    };
    return () => { delete (window as any).__nexoraRoute; };
  }, [displayEvents, drawRoute]);

  // ── Locate Me — request + watch ──────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) { setLocStatus("denied"); return; }
    setLocStatus("requesting");

    const mapboxgl = (await import("mapbox-gl")).default;

    const onSuccess = (pos: GeolocationPosition) => {
      const { longitude: lng, latitude: lat } = pos.coords;
      userLocationRef.current = [lng, lat];
      setLocStatus("tracking");

      if (!userMarkerRef.current) {
        userMarkerRef.current = new (mapboxgl as any).Marker({
          element: createUserDot(),
          anchor:  "center",
        })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        mapRef.current?.flyTo({ center:[lng,lat], zoom:14, duration:1600 });
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }

      // Refresh marker distance badges if popup is open
      markersRef.current.forEach(m => {
        const el = m.getElement?.();
        if (el) {
          const eventId = el.dataset.eventId;
          const ev = displayEvents.find(e => (e._id ?? e.id) === eventId);
          if (ev) {
            const dist = haversineKm(lat, lng, getLngLat(ev)[1], getLngLat(ev)[0]);
            el.title = `${dist} km away`;
          }
        }
      });
    };

    const onError = (err: GeolocationPositionError) => {
      console.error("Geolocation error:", err.message);
      setLocStatus("denied");
    };

    const opts: PositionOptions = { enableHighAccuracy:true, timeout:10000, maximumAge:0 };
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts);
  }, [displayEvents]);

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ── Init Mapbox ───────────────────────────────────────────────────────────
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
        popupRef.current = new (mapboxgl as any).Popup({
          closeButton:false, closeOnClick:true,
          maxWidth:"280px", offset:[0,-14], className:"nexora-popup",
        });
        map.on("load",  () => { setMapLoaded(true); mapRef.current = map; });
        map.on("error", (e:any) => setMapboxError(e?.error?.message ?? "Map error"));
        map.on("click", () => popupRef.current?.remove());
      } catch(err:any) { setMapboxError("Init failed: " + err?.message); }
    };
    boot();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Place event markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      displayEvents.forEach(event => {
        const lngLat  = getLngLat(event);
        const color   = getColor(event.category);          // ← uses correct color fn
        const eventId = event._id ?? event.id ?? "";
        const distKm  = userLocationRef.current
          ? haversineKm(userLocationRef.current[1], userLocationRef.current[0], lngLat[1], lngLat[0])
          : undefined;

        const el = document.createElement("div");
        el.dataset.eventId = eventId;
        el.style.cssText = `
          width:34px;height:34px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${color};
          border:3px solid rgba(255,255,255,0.9);
          box-shadow:0 4px 16px ${color}99;
          cursor:pointer;
          transition:transform .18s ease,box-shadow .18s ease;
          z-index:1;
        `;
        el.addEventListener("mouseenter", () => {
          el.style.transform  = "rotate(-45deg) scale(1.3)";
          el.style.boxShadow  = `0 8px 28px ${color}cc,0 0 0 6px ${color}30`;
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform  = "rotate(-45deg) scale(1)";
          el.style.boxShadow  = `0 4px 16px ${color}99`;
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          clearRoute();
          const dist = userLocationRef.current
            ? haversineKm(userLocationRef.current[1], userLocationRef.current[0], lngLat[1], lngLat[0])
            : undefined;
          popupRef.current
            .setLngLat(lngLat)
            .setHTML(buildPopupHTML(event, dist))
            .addTo(mapRef.current);
        });

        markersRef.current.push(
          new (mapboxgl as any).Marker({ element:el })
            .setLngLat(lngLat)
            .addTo(mapRef.current)
        );
      });
    })();
  }, [mapLoaded, displayEvents, clearRoute]);

  if (mapboxError) return (
    <div ref={wrapperRef} className="w-full flex items-center justify-center bg-zinc-950">
      <div className="text-center px-6 max-w-sm">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-white font-semibold mb-2">Map unavailable</h2>
        <p className="text-zinc-400 text-sm">{mapboxError}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes nexoraPulse {
          0%   { transform:scale(1);   opacity:.8; }
          100% { transform:scale(2.8); opacity:0;  }
        }
        .nexora-popup .mapboxgl-popup-content {
          background:transparent!important;padding:0!important;
          box-shadow:none!important;border-radius:14px!important;
        }
        .nexora-popup .mapboxgl-popup-tip { border-top-color:#18172a!important; }
        .mapboxgl-marker { z-index:1!important; }
      `}</style>

      <div ref={wrapperRef} className="relative w-full overflow-hidden">

        {/* Loading */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center z-10 gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Loading map…</span>
          </div>
        )}

        {/* Top-left controls — z-20 so always above markers */}
        {mapLoaded && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {/* Event count */}
            <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
              <p className="text-white text-sm font-medium">
                {displayEvents.length} event{displayEvents.length !== 1 ? "s" : ""}
                {locStatus === "tracking" && (
                  <span className="ml-2 text-blue-400 text-xs animate-pulse">● live</span>
                )}
              </p>
            </div>

            {/* Locate Me button */}
            <button
              onClick={locStatus !== "requesting" ? startTracking : undefined}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         border backdrop-blur-sm transition-all duration-200 select-none"
              style={{
                background:   locStatus==="tracking" ? "rgba(59,130,246,.25)"
                            : locStatus==="denied"   ? "rgba(239,68,68,.15)"
                            : "rgba(0,0,0,.70)",
                borderColor:  locStatus==="tracking" ? "rgba(59,130,246,.5)"
                            : locStatus==="denied"   ? "rgba(239,68,68,.4)"
                            : "rgba(255,255,255,.12)",
                color:        locStatus==="tracking" ? "#93c5fd"
                            : locStatus==="denied"   ? "#fca5a5"
                            : "#ffffff",
                cursor:       locStatus==="requesting" ? "wait" : "pointer",
              }}
            >
              {locStatus === "requesting" && (
                <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin inline-block" /> Locating…</>
              )}
              {locStatus === "tracking"   && <><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" /> Live Location</>}
              {locStatus === "denied"     && <>⚠ Tap to retry</>}
              {locStatus === "idle"       && <>📍 Locate Me</>}
            </button>
          </div>
        )}

        {/* Uber-style route card — bottom center */}
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
            <button onClick={clearRoute}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20
                         text-white/60 hover:text-white flex items-center justify-center
                         text-base transition-all shrink-0">×</button>
          </div>
        )}

        {/* Legend */}
        {mapLoaded && (
          <div className="absolute bottom-8 left-4 z-20 bg-black/60 backdrop-blur-sm
                          border border-white/10 rounded-xl p-3 space-y-1.5">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:color }} />
                <span className="text-white/70 text-xs capitalize">{cat}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}