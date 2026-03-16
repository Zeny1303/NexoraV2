export function addEventLayers(map: any) {

  map.addLayer({
    id: "events-heat",
    type: "heatmap",
    source: "events",
    maxzoom: 9,

    paint: {
      "heatmap-intensity": 1.2,
      "heatmap-radius": 30,
      "heatmap-opacity": 0.6
    }
  })

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "events",
    filter: ["has", "point_count"],

    paint: {
      "circle-color": "#7c3aed",

      "circle-radius": [
        "step",
        ["get", "point_count"],
        20,
        10,
        25,
        30,
        30
      ]
    }
  })

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "events",
    filter: ["has", "point_count"],

    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12
    },

    paint: {
      "text-color": "#ffffff"
    }
  })

  map.addLayer({
    id: "event-points",
    type: "circle",
    source: "events",
    filter: ["!", ["has", "point_count"]],

    paint: {
      "circle-radius": 8,
      "circle-color": "#f97316",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff"
    }
  })

}