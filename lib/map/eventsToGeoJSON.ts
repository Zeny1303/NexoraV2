import { EventMarker } from "@/types/event"

function getLngLat(e: EventMarker): [number, number] {

  if (e.coordinates)
    return [e.coordinates.lng, e.coordinates.lat]

  return [e.longitude ?? 0, e.latitude ?? 0]
}

export function eventsToGeoJSON(events: EventMarker[]) {

  return {
    type: "FeatureCollection",
    features: events.map(event => {

      const [lng, lat] = getLngLat(event)

      return {
        type: "Feature",

        properties: {
          id: event._id ?? event.id,
          title: event.title
        },

        geometry: {
          type: "Point",
          coordinates: [lng, lat]
        }
      }

    })
  }
}