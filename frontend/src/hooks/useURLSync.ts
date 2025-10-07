import {useCallback} from 'react';

import {apiClient} from '../api/client';
import {SizeClass} from '../api/models/SizeClass';
import {GameState} from '../types/game';

const getSizeClassFromRadius = (radiusKm: number): SizeClass => {
  if (radiusKm <= 10) return SizeClass.REGIONAL;
  if (radiusKm <= 100) return SizeClass.COUNTRY;
  return SizeClass.CONTINENTAL;
};

export const useURLSync = (gameState: GameState) => {
  const shareGame = useCallback(async () => {
    if (gameState.latitude === 0 && gameState.longitude === 0) {
      return {success: false, message: 'Please set a center point first'};
    }

    // If in design mode, create a shareable URL with gameId
    if (gameState.mode === 'design') {
      try {
        // Auto-detect sizeClass based on radius
        const sizeClass = getSizeClassFromRadius(gameState.radiusKm);

        // Call API to create a game and get gameId
        const data = await apiClient.game.createCustomGameV1GameCreatePost({
          latitude: gameState.latitude,
          longitude: gameState.longitude,
          radius_km: gameState.radiusKm,
          size_class: sizeClass,
        });

        // Build URL with gameId and auto-detected size_class so it opens as a playable game
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('lat', gameState.latitude.toFixed(6));
        url.searchParams.set('lon', gameState.longitude.toFixed(6));
        url.searchParams.set('radius', gameState.radiusKm.toFixed(2));
        url.searchParams.set('gameId', data.game_id);
        url.searchParams.set('size_class', sizeClass);

        navigator.clipboard.writeText(url.toString());
        return {success: true, message: 'Game URL copied to clipboard!'};
      } catch (error) {
        console.error('Failed to create game:', error);
        return {success: false, message: 'Failed to create shareable link'};
      }
    }

    // For random/game mode, just share current URL
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    return {success: true, message: 'Game URL copied to clipboard!'};
  }, [
    gameState.mode,
    gameState.latitude,
    gameState.longitude,
    gameState.radiusKm,
  ]);

  return {shareGame};
};
