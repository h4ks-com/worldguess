import 'maplibre-gl/dist/maplibre-gl.css';
import * as React from 'react';
import Map, {Layer, Source} from 'react-map-gl/maplibre';
import type {RasterLayer} from 'react-map-gl/maplibre';

const populationLayer: RasterLayer = {
  id: 'population',
  type: 'raster',
  source: 'population-tiles',
  paint: {
    'raster-opacity': 0.8
  }
};

const Main: React.FC = () => {
  return (
    <Map
      initialViewState={{
        longitude: 0,
        latitude: 20,
        zoom: 7,
      }}
      mapStyle='https://demotiles.maplibre.org/style.json'
      style={{width: '100vw', height: '100vh'}}
    >
      <Source
        id='population-tiles'
        type='raster'
        tiles={['http://localhost:8000/v1/tiles/population/{z}/{x}/{y}.png']}
        tileSize={256}
        minzoom={3}
        maxzoom={15}
      >
        <Layer {...populationLayer} />
      </Source>
    </Map>
  );
};

export default Main;
