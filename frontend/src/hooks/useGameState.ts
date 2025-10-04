import {useCallback, useState} from 'react';

import {apiClient} from '../api/client';
import {GameState, SizeClass, ToastState} from '../types/game';

const initialGameState: GameState = {
  mode: 'menu',
  latitude: 0,
  longitude: 0,
  radiusKm: 10,
  sizeClass: null,
  gameId: null,
  actualPopulation: null,
  userGuess: '',
  showResult: false,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({show: false, message: ''});

  const showToast = useCallback((message: string) => {
    setToast({show: true, message});
  }, []);

  const hideToast = useCallback(() => {
    setToast({show: false, message: ''});
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialGameState);
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  const startDesignMode = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      mode: 'design',
      latitude: 0,
      longitude: 0,
      radiusKm: 10,
      sizeClass: null,
      gameId: null,
      actualPopulation: null,
      userGuess: '',
      showResult: false,
    }));
  }, []);

  const startRandomGame = useCallback(
    async (sizeClass: SizeClass) => {
      setIsLoading(true);
      try {
        const data =
          await apiClient.game.createRandomGameV1GameRandomPost(sizeClass);

        const newGameState = {
          mode: 'random' as const,
          latitude: data.latitude,
          longitude: data.longitude,
          radiusKm: data.radius_km,
          sizeClass: data.size_class || null,
          gameId: data.game_id,
          actualPopulation: null,
          userGuess: '',
          showResult: false,
        };

        setGameState(newGameState);

        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('lat', data.latitude.toFixed(6));
        url.searchParams.set('lon', data.longitude.toFixed(6));
        url.searchParams.set('radius', data.radius_km.toFixed(2));
        if (data.size_class) {
          url.searchParams.set('size_class', data.size_class);
        }
        url.searchParams.set('gameId', data.game_id);
        window.history.pushState({}, '', url);

        return newGameState;
      } catch (error) {
        console.error('Failed to start random game:', error);
        showToast('Failed to start game. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  const calculatePopulation = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.game.calculatePopulationV1GameCalculatePost({
        latitude: gameState.latitude,
        longitude: gameState.longitude,
        radius_km: gameState.radiusKm,
      });

      setGameState(prev => ({
        ...prev,
        actualPopulation: data.population,
        showResult: true,
      }));

      return data.population;
    } catch (error) {
      console.error('Failed to calculate population:', error);
      showToast('Failed to calculate population. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [gameState.latitude, gameState.longitude, gameState.radiusKm, showToast]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({...prev, ...updates}));
  }, []);

  return {
    gameState,
    isLoading,
    toast,
    showToast,
    hideToast,
    resetGame,
    startDesignMode,
    startRandomGame,
    calculatePopulation,
    updateGameState,
    setGameState,
  };
};
