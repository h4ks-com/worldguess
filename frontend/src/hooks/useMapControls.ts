import {useCallback, useState} from 'react';
import {ViewState} from 'react-map-gl/maplibre';

import {MapLayer} from '../types/game';
import {calculateZoomForRadius} from '../utils/geometry';

export const useMapControls = () => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 2,
    bearing: 0,
    pitch: 0,
    padding: {top: 0, bottom: 0, left: 0, right: 0},
  });
  const [isSettingCenter, setIsSettingCenter] = useState(false);
  const [radiusSliderValue, setRadiusSliderValue] = useState(10);
  const [mapLayer, setMapLayer] = useState<MapLayer>('default');

  const resetViewState = useCallback(() => {
    setViewState({
      longitude: 0,
      latitude: 20,
      zoom: 2,
      bearing: 0,
      pitch: 0,
      padding: {top: 0, bottom: 0, left: 0, right: 0},
    });
    setMapLayer('default');
    setIsSettingCenter(false);
  }, []);

  const setViewToCircle = useCallback(
    (longitude: number, latitude: number, radiusKm: number) => {
      setViewState({
        longitude,
        latitude,
        zoom: calculateZoomForRadius(radiusKm),
        bearing: 0,
        pitch: 0,
        padding: {top: 0, bottom: 0, left: 0, right: 0},
      });
    },
    [],
  );

  return {
    viewState,
    setViewState,
    isSettingCenter,
    setIsSettingCenter,
    radiusSliderValue,
    setRadiusSliderValue,
    mapLayer,
    setMapLayer,
    resetViewState,
    setViewToCircle,
  };
};
