export const MAP_STYLES = {
  default: 'https://demotiles.maplibre.org/style.json',
  satellite: {
    version: 8 as const,
    sources: {
      'esri-satellite': {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri',
      },
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster' as const,
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
};

export const circleLayerStyle = {
  id: 'circle-center',
  type: 'circle' as const,
  paint: {
    'circle-radius': 8,
    'circle-color': '#3b82f6',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};

export const fillLayer = {
  id: 'circle-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': '#3b82f6',
    'fill-opacity': 0.2,
  },
};

export const outlineLayer = {
  id: 'circle-outline',
  type: 'line' as const,
  paint: {
    'line-color': '#3b82f6',
    'line-width': 2,
  },
};

// Population slider configuration
export const MIN_EXPONENT = 0; // 10^0 = 1
export const MAX_EXPONENT = 10; // 10^10 = 10 billion
export const SLIDER_STEPS = 100;
