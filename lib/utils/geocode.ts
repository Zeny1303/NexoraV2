export async function geocodeLocation(place: string) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(place)}.json` +
    `?limit=1&access_token=${token}`

  const res = await fetch(url)

  if (!res.ok) throw new Error("Geocoding failed")

  const data = await res.json()

  if (!data.features || data.features.length === 0)
    return null

  const [lng, lat] = data.features[0].center

  return { lat, lng }
}