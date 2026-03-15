export async function getCoordinates(place: string) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        place
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );

    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const [lng, lat] = data.features[0].center;

    return { lat, lng };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}