import * as React from 'react';
import Map, {Source, Layer} from 'react-map-gl/maplibre';
import type {CircleLayer, FillLayer, LineLayer} from 'react-map-gl/maplibre';
import type {FeatureCollection} from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

const geojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {type: 'Feature', geometry: {type: 'Point', coordinates: [-122.4, 37.8]}, properties: {}},
  ]
};

const layerStyle: CircleLayer = {
  id: 'point',
  type: 'circle',
  source: 'circle',
  paint: {
    'circle-radius': 20,
    'circle-color': '#007cbfd0'
  }
};

const polygon: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.4, 37.8],
          [-122.5, 37.8],
          [-122.5, 37.9],
          [-122.4, 37.9],
          [-122.4, 37.8]
        ]]
      },
      properties: {}
    }
  ]
};

const polygonFill: FillLayer = {
  id: 'data-fill',
  type: 'fill',
  source: 'polyFill',
  paint: {
    'fill-color': '#ff0',
    'fill-opacity': 0.3
  },
  filter: ['==', '$type', 'Polygon']
};

const polygonLine: LineLayer = {
  id: 'data-line',
  type: 'line',
  paint: {
    'line-color': '#00f',
    'line-width': 4
  },
  source: 'poly',
  filter: ['==', '$type', 'Polygon']
};

function App() {
  return (
    <Map
      initialViewState={{
        longitude: -122.45,
        latitude: 37.78,
        zoom: 11
      }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{width: "100vw", height: "100vh"}}
    >
      <Source id="circle" type="geojson" data={geojson}>
        <Layer {...layerStyle} />
      </Source>
      <Source id="data-line" type="geojson" data={polygon}>
        <Layer {...polygonLine} />
      </Source>
      <Source id="data-fill" type="geojson" data={polygon}>
        <Layer {...polygonFill} />
      </Source>
    </Map>
  );
}

export default App;
