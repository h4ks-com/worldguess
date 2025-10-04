import React from 'react';
import Map, {
  Layer,
  NavigationControl,
  Source,
  ViewState,
} from 'react-map-gl/maplibre';

import {
  MAP_STYLES,
  circleLayerStyle,
  fillLayer,
  outlineLayer,
} from '../constants/map';
import {GameMode, MapLayer} from '../types/game';
import {LayerSwitcher} from './LayerSwitcher';

interface MapContainerProps {
  viewState: ViewState;
  onViewStateChange: (viewState: ViewState) => void;
  gameMode: GameMode;
  mapLayer: MapLayer;
  onMapLayerChange: (layer: MapLayer) => void;
  isSettingCenter: boolean;
  onMapClick?: (event: any) => void;
  circleGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> | null;
  centerPoint: {latitude: number; longitude: number};
  showResult: boolean;
  showLayerSwitcher?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  viewState,
  onViewStateChange,
  gameMode,
  mapLayer,
  onMapLayerChange,
  isSettingCenter,
  onMapClick,
  circleGeoJSON,
  centerPoint,
  showResult,
  showLayerSwitcher = true,
}) => {
  return (
    <Map
      {...viewState}
      onMove={evt => onViewStateChange(evt.viewState)}
      {...(gameMode === 'design' && isSettingCenter && {onClick: onMapClick})}
      mapStyle={
        mapLayer === 'satellite' ? MAP_STYLES.satellite : MAP_STYLES.default
      }
      style={{width: '100%', height: '100%'}}
      cursor={isSettingCenter ? 'crosshair' : 'grab'}
      dragPan={true}
      scrollZoom={true}
      doubleClickZoom={true}
      dragRotate={false}
    >
      <NavigationControl position='top-right' />

      {/* Layer Switcher - Show in design mode always, or in game mode after result */}
      {showLayerSwitcher &&
        (gameMode === 'design' || (gameMode === 'random' && showResult)) && (
          <LayerSwitcher mapLayer={mapLayer} onChange={onMapLayerChange} />
        )}

      {circleGeoJSON && (
        <Source id='circle' type='geojson' data={circleGeoJSON}>
          <Layer {...fillLayer} />
          <Layer {...outlineLayer} />
        </Source>
      )}

      <Source
        id='circle-center'
        type='geojson'
        data={{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [centerPoint.longitude, centerPoint.latitude],
          },
        }}
      >
        <Layer {...circleLayerStyle} />
      </Source>

      {/* Labels Layer - Show in design mode always, or in game mode after result */}
      {(gameMode === 'design' || (gameMode === 'random' && showResult)) && (
        <Source
          id='labels'
          type='raster'
          tiles={[
            'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
            'https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
          ]}
          tileSize={256}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        >
          <Layer
            id='labels-layer'
            type='raster'
            paint={{
              'raster-opacity': 1,
            }}
          />
        </Source>
      )}
    </Map>
  );
};
