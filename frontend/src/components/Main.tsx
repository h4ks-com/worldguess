import 'maplibre-gl/dist/maplibre-gl.css';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';

import {useChallengeMode} from '../hooks/useChallengeMode';
import {useGameFromURL} from '../hooks/useGameFromURL';
import {useGameState} from '../hooks/useGameState';
import {useMapControls} from '../hooks/useMapControls';
import {usePopulationSlider} from '../hooks/usePopulationSlider';
import {useURLSync} from '../hooks/useURLSync';
import {createCircleGeoJSON} from '../utils/geometry';
import {DesignModeUI} from './DesignModeUI';
import {GameUI} from './GameUI';
import {MapContainer} from './MapContainer';
import {MenuScreen} from './MenuScreen';
import {NotFoundPage} from './NotFoundPage';
import {Toast} from './Toast';
import {UsernameDialog} from './UsernameDialog';

const Main: React.FC = () => {
  const {
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
  } = useGameState();

  const {
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
  } = useMapControls();

  const {sliderValue, setSliderValue, handleSliderChange} = usePopulationSlider(
    gameState.userGuess,
    gameState.showResult,
  );

  const {shareGame} = useURLSync(gameState);

  // Challenge mode state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get('challengeId');
    if (challenge) {
      setChallengeId(challenge);
    }
  }, []);

  const {
    showUsernameDialog,
    guessSubmitted,
    challengeNotFound,
    existingGuess,
    handleUsernameSubmit,
    submitChallengeGuess,
  } = useChallengeMode(challengeId, setGameState, setViewToCircle);

  // Load game from URL on mount (only if not a challenge)
  useGameFromURL({setGameState, setViewToCircle});

  const handleStartRandomGame = useCallback(
    async (sizeClass: string) => {
      const newGameState = await startRandomGame(sizeClass as any);
      if (newGameState) {
        setSliderValue(0);
        setMapLayer('default');
        setViewToCircle(
          newGameState.longitude,
          newGameState.latitude,
          newGameState.radiusKm,
        );
      }
    },
    [startRandomGame, setSliderValue, setMapLayer, setViewToCircle],
  );

  const handleStartDesignMode = useCallback(() => {
    startDesignMode();
    resetViewState();
    setRadiusSliderValue(10);
  }, [startDesignMode, resetViewState, setRadiusSliderValue]);

  const handleResetGame = useCallback(() => {
    resetGame();
    setSliderValue(0);
    resetViewState();
    setIsSettingCenter(false);

    // Clear challengeId and remove from URL
    setChallengeId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('challengeId');
    window.history.replaceState({}, '', url.toString());
  }, [resetGame, setSliderValue, resetViewState, setIsSettingCenter]);

  const handleGuess = useCallback(async () => {
    // In design mode, always calculate without requiring a guess
    if (gameState.mode === 'design') {
      await calculatePopulation();
      return;
    }

    // In game mode, require a guess
    if (!gameState.userGuess) {
      showToast('Please enter a population guess');
      return;
    }

    // Challenge mode: just submit guess without revealing
    if (challengeId) {
      const success = await submitChallengeGuess(gameState.userGuess);
      if (success) {
        showToast('Guess submitted successfully!');
      } else {
        showToast('Failed to submit guess');
      }
      return;
    }

    const population = await calculatePopulation();

    // Switch to satellite in game mode after revealing answer
    if (gameState.mode === 'random' && population !== null) {
      setMapLayer('satellite');
    }
  }, [
    gameState.mode,
    gameState.userGuess,
    challengeId,
    calculatePopulation,
    submitChallengeGuess,
    showToast,
    setMapLayer,
  ]);

  const handleShare = useCallback(async () => {
    const result = await shareGame();
    showToast(result.message);
  }, [shareGame, showToast]);

  const handleMapClick = useCallback(
    (event: any) => {
      if (gameState.mode === 'design' && isSettingCenter) {
        const {lngLat} = event;
        updateGameState({
          latitude: lngLat.lat,
          longitude: lngLat.lng,
        });
        setIsSettingCenter(false);
      }
    },
    [gameState.mode, isSettingCenter, updateGameState, setIsSettingCenter],
  );

  const handleSetCenter = useCallback(() => {
    if (!isSettingCenter) {
      updateGameState({
        latitude: 0,
        longitude: 0,
        actualPopulation: null,
        showResult: false,
      });
      setIsSettingCenter(true);
    }
  }, [isSettingCenter, updateGameState, setIsSettingCenter]);

  const handleRadiusChange = useCallback(
    (value: number) => {
      setRadiusSliderValue(value);
      updateGameState({radiusKm: value});
    },
    [setRadiusSliderValue, updateGameState],
  );

  const handleSliderInput = useCallback(
    (value: number) => {
      const newGuess = handleSliderChange(value);
      updateGameState({userGuess: newGuess});
    },
    [handleSliderChange, updateGameState],
  );

  const handleManualInput = useCallback(
    (value: string) => {
      updateGameState({userGuess: value});
    },
    [updateGameState],
  );

  const handleNext = useCallback(() => {
    if (gameState.sizeClass) {
      handleStartRandomGame(gameState.sizeClass);
    }
  }, [gameState.sizeClass, handleStartRandomGame]);

  const circleGeoJSON = createCircleGeoJSON(
    gameState.latitude,
    gameState.longitude,
    gameState.radiusKm,
  );

  // Show 404 page if challenge not found
  if (challengeNotFound) {
    return <NotFoundPage />;
  }

  // If challengeId exists but still in menu mode, show loading or username dialog
  if (challengeId && gameState.mode === 'menu') {
    return (
      <>
        {showUsernameDialog && (
          <UsernameDialog onSubmit={handleUsernameSubmit} />
        )}
        {!showUsernameDialog && (
          <div className='fixed inset-0 flex items-center justify-center'>
            <div className='text-2xl text-gray-600'>Loading challenge...</div>
          </div>
        )}
      </>
    );
  }

  // Show menu only if no challengeId
  if (gameState.mode === 'menu' && !challengeId) {
    return (
      <MenuScreen
        isLoading={isLoading}
        onStartRandomGame={handleStartRandomGame}
        onStartDesignMode={handleStartDesignMode}
      />
    );
  }

  return (
    <div className='fixed inset-0 flex flex-col md:block'>
      {/* Mobile: Controls on top, Desktop: Overlaid on map */}
      <div className='flex-shrink-0 md:absolute md:inset-0 md:pointer-events-none'>
        <Toast toast={toast} onHide={hideToast} />

        {gameState.mode === 'random' && (
          <GameUI
            gameState={gameState}
            isLoading={isLoading}
            sliderValue={sliderValue}
            mapLayer={mapLayer}
            onMapLayerChange={setMapLayer}
            onSliderChange={handleSliderInput}
            onManualInputChange={handleManualInput}
            onGuess={handleGuess}
            onReset={handleResetGame}
            onShare={handleShare}
            onNext={handleNext}
            guessSubmitted={guessSubmitted}
            existingGuess={existingGuess}
            challengeId={challengeId}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />
        )}

        {gameState.mode === 'design' && (
          <DesignModeUI
            gameState={gameState}
            isLoading={isLoading}
            isSettingCenter={isSettingCenter}
            radiusSliderValue={radiusSliderValue}
            mapLayer={mapLayer}
            onMapLayerChange={setMapLayer}
            onSetCenter={handleSetCenter}
            onRadiusChange={handleRadiusChange}
            onCalculate={handleGuess}
            onReset={handleResetGame}
            onShare={handleShare}
          />
        )}
      </div>

      {/* Mobile: Map on bottom, Desktop: Full screen behind controls */}
      <div className='flex-1 md:absolute md:inset-0'>
        <MapContainer
          viewState={viewState}
          onViewStateChange={setViewState}
          gameMode={gameState.mode}
          mapLayer={mapLayer}
          onMapLayerChange={setMapLayer}
          isSettingCenter={isSettingCenter}
          onMapClick={handleMapClick}
          circleGeoJSON={circleGeoJSON}
          centerPoint={{
            latitude: gameState.latitude,
            longitude: gameState.longitude,
          }}
          showResult={gameState.showResult}
          showLayerSwitcher={false}
        />
      </div>

      {showUsernameDialog && <UsernameDialog onSubmit={handleUsernameSubmit} />}
    </div>
  );
};

export default Main;
