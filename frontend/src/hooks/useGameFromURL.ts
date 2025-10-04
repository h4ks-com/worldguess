import {useEffect} from 'react';

import {GameState, SizeClass} from '../types/game';

interface UseGameFromURLProps {
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  setViewToCircle: (
    longitude: number,
    latitude: number,
    radiusKm: number,
  ) => void;
}

export const useGameFromURL = ({
  setGameState,
  setViewToCircle,
}: UseGameFromURLProps) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    const radius = params.get('radius');
    const sizeClass = params.get('size_class') as SizeClass | null;
    const gameId = params.get('gameId');

    if (lat && lon && radius) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      const radiusKm = parseFloat(radius);

      // If gameId exists, it's a shared game - open as random/game mode
      // Otherwise it's a design mode session
      const mode = gameId ? 'random' : 'design';

      setGameState(prev => ({
        ...prev,
        mode,
        latitude,
        longitude,
        radiusKm,
        sizeClass,
        gameId,
      }));

      setViewToCircle(longitude, latitude, radiusKm);
    }
  }, [setGameState, setViewToCircle]);
};
