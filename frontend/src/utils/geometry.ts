// Calculate zoom level to show circle with 2x the area
export const calculateZoomForRadius = (radiusKm: number): number => {
  // Approximate: zoom 0 shows ~40000km, each zoom level halves the distance
  // For 2x area, we want diameter * sqrt(2) visible
  const diameterKm = radiusKm * 2 * Math.sqrt(2);
  const zoom = Math.log2(40000 / diameterKm);
  return Math.max(1, Math.min(18, zoom));
};

// Create circle geometry for display
export const createCircleGeoJSON = (
  latitude: number,
  longitude: number,
  radiusKm: number,
): GeoJSON.Feature<GeoJSON.Polygon> | null => {
  if (latitude === 0 && longitude === 0) return null;

  const points = 64;
  const coords: [number, number][] = [];
  const kmToDeg = radiusKm / 111; // Rough approximation

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const dx = kmToDeg * Math.cos((angle * Math.PI) / 180);
    const dy = kmToDeg * Math.sin((angle * Math.PI) / 180);
    coords.push([longitude + dx, latitude + dy]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
};
