import 'maplibre-gl/dist/maplibre-gl.css';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Map, { Layer, Source, NavigationControl, ViewState } from 'react-map-gl/maplibre';

type DifficultyLevel = 'regional' | 'country' | 'continental';
type GameMode = 'menu' | 'random' | 'design';
type MapLayer = 'default' | 'satellite';

interface GameState {
  mode: GameMode;
  latitude: number;
  longitude: number;
  radiusKm: number;
  difficulty: DifficultyLevel | null;
  gameId: string | null;
  actualPopulation: number | null;
  userGuess: string;
  showResult: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
}

// Exponential scale for population slider (10^x)
const MIN_EXPONENT = 0; // 10^0 = 1
const MAX_EXPONENT = 10; // 10^10 = 10 billion
const SLIDER_STEPS = 100;

// Map styles
const MAP_STYLES = {
  default: 'https://demotiles.maplibre.org/style.json',
  satellite: {
    version: 8 as const,
    sources: {
      'esri-satellite': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '© Esri'
      }
    },
    layers: [{
      id: 'esri-satellite-layer',
      type: 'raster' as const,
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    }]
  }
};

const circleLayerStyle = {
  id: 'circle-center',
  type: 'circle' as const,
  paint: {
    'circle-radius': 8,
    'circle-color': '#3b82f6',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};

const Main: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'menu',
    latitude: 0,
    longitude: 0,
    radiusKm: 10,
    difficulty: null,
    gameId: null,
    actualPopulation: null,
    userGuess: '',
    showResult: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [sliderValue, setSliderValue] = useState(0); // Start from 0
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 2,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  const [isSettingCenter, setIsSettingCenter] = useState(false);
  const [radiusSliderValue, setRadiusSliderValue] = useState(50); // For design mode radius
  const [mapLayer, setMapLayer] = useState<MapLayer>('default');

  // Calculate zoom level to show circle with 2x the area
  const calculateZoomForRadius = (radiusKm: number): number => {
    // Approximate: zoom 0 shows ~40000km, each zoom level halves the distance
    // For 2x area, we want diameter * sqrt(2) visible
    const diameterKm = radiusKm * 2 * Math.sqrt(2);
    const zoom = Math.log2(40000 / diameterKm);
    return Math.max(1, Math.min(18, zoom));
  };

  // Convert slider position (0-100) to population (10^0 to 10^10)
  const sliderToPopulation = (slider: number): number => {
    if (slider === 0) return 0;
    const exponent = MIN_EXPONENT + (slider / SLIDER_STEPS) * (MAX_EXPONENT - MIN_EXPONENT);
    return Math.round(Math.pow(10, exponent));
  };

  // Convert population to slider position
  const populationToSlider = (population: number): number => {
    if (population <= 1) return 0;
    const exponent = Math.log10(population);
    const slider = ((exponent - MIN_EXPONENT) / (MAX_EXPONENT - MIN_EXPONENT)) * SLIDER_STEPS;
    return Math.max(0, Math.min(SLIDER_STEPS, Math.round(slider)));
  };

  // Update slider when manual input changes
  useEffect(() => {
    if (gameState.userGuess !== '' && !gameState.showResult) {
      const pop = parseInt(gameState.userGuess);
      if (!isNaN(pop) && pop >= 0) {
        setSliderValue(populationToSlider(pop));
      }
    }
  }, [gameState.userGuess, gameState.showResult]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Load game from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    const radius = params.get('radius');
    const difficulty = params.get('difficulty') as DifficultyLevel | null;
    const gameId = params.get('gameId');

    if (lat && lon && radius) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      const radiusKm = parseFloat(radius);

      setGameState((prev) => ({
        ...prev,
        mode: 'design',
        latitude,
        longitude,
        radiusKm,
        difficulty,
        gameId,
      }));

      // Set view to show the circle
      setViewState({
        longitude,
        latitude,
        zoom: calculateZoomForRadius(radiusKm),
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
      });
    }
  }, []);

  const startRandomGame = async (difficulty: DifficultyLevel) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/v1/game/random?difficulty=${difficulty}`,
        { method: 'POST' }
      );
      const data = await response.json();

      const newGameState = {
        mode: 'random' as GameMode,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusKm: data.radius_km,
        difficulty: data.difficulty,
        gameId: data.game_id,
        actualPopulation: null,
        userGuess: '',
        showResult: false,
      };

      setGameState(newGameState);
      setSliderValue(0);
      setMapLayer('default');

      // Update view to show the circle with 2x area
      setViewState({
        longitude: data.longitude,
        latitude: data.latitude,
        zoom: calculateZoomForRadius(data.radius_km),
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('lat', data.latitude.toFixed(6));
      url.searchParams.set('lon', data.longitude.toFixed(6));
      url.searchParams.set('radius', data.radius_km.toFixed(2));
      url.searchParams.set('difficulty', data.difficulty);
      url.searchParams.set('gameId', data.game_id);
      window.history.pushState({}, '', url);
    } catch (error) {
      console.error('Failed to start random game:', error);
      setToast({ show: true, message: 'Failed to start game. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePopulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/v1/game/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: gameState.latitude,
          longitude: gameState.longitude,
          radius_km: gameState.radiusKm,
        }),
      });
      const data = await response.json();

      setGameState((prev) => ({
        ...prev,
        actualPopulation: data.population,
        showResult: true,
      }));

      // Switch to satellite in game mode after revealing answer
      if (gameState.mode === 'random') {
        setMapLayer('satellite');
      }
    } catch (error) {
      console.error('Failed to calculate population:', error);
      setToast({ show: true, message: 'Failed to calculate population. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = () => {
    // In design mode, always calculate without requiring a guess
    if (gameState.mode === 'design') {
      calculatePopulation();
      return;
    }

    // In game mode, require a guess
    if (!gameState.userGuess) {
      setToast({ show: true, message: 'Please enter a population guess' });
      return;
    }
    calculatePopulation();
  };

  const shareGame = () => {
    if (gameState.latitude === 0 && gameState.longitude === 0) {
      setToast({ show: true, message: 'Please set a center point first' });
      return;
    }
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setToast({ show: true, message: 'Copied URL to clipboard' });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    const population = sliderToPopulation(value);
    setGameState((prev) => ({ ...prev, userGuess: population.toString() }));
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setGameState((prev) => ({ ...prev, userGuess: value }));
    }
  };

  const resetGame = () => {
    setGameState({
      mode: 'menu',
      latitude: 0,
      longitude: 0,
      radiusKm: 10,
      difficulty: null,
      gameId: null,
      actualPopulation: null,
      userGuess: '',
      showResult: false,
    });
    setSliderValue(0);
    setMapLayer('default');
    setViewState({
      longitude: 0,
      latitude: 20,
      zoom: 2,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    setIsSettingCenter(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const startDesignMode = () => {
    setGameState((prev) => ({
      ...prev,
      mode: 'design',
      latitude: 0,
      longitude: 0,
      radiusKm: 10,
      difficulty: null,
      gameId: null,
      actualPopulation: null,
      userGuess: '',
      showResult: false,
    }));
    setViewState({
      longitude: 0,
      latitude: 20,
      zoom: 2,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    setRadiusSliderValue(10); // Default 10km
  };

  const handleMapClick = (event: any) => {
    if (gameState.mode === 'design' && isSettingCenter) {
      const { lngLat } = event;
      setGameState((prev) => ({
        ...prev,
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      }));
      setIsSettingCenter(false);
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setRadiusSliderValue(value);
    setGameState((prev) => ({
      ...prev,
      radiusKm: value,
    }));
  };

  // Create circle geometry for display
  const createCircleGeoJSON = useCallback(() => {
    if (gameState.mode === 'menu') return null;
    // In design mode, only show circle if center is set (lat/lng not 0,0)
    if (gameState.mode === 'design' && gameState.latitude === 0 && gameState.longitude === 0) return null;

    const points = 64;
    const coords: [number, number][] = [];
    const kmToDeg = gameState.radiusKm / 111; // Rough approximation

    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points;
      const dx = kmToDeg * Math.cos((angle * Math.PI) / 180);
      const dy = kmToDeg * Math.sin((angle * Math.PI) / 180);
      coords.push([gameState.longitude + dx, gameState.latitude + dy]);
    }

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords],
      },
    };
  }, [gameState.latitude, gameState.longitude, gameState.radiusKm, gameState.mode]);

  const circleGeoJSON = createCircleGeoJSON();

  const fillLayer = {
    id: 'circle-fill',
    type: 'fill' as const,
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.2,
    },
  };

  const outlineLayer = {
    id: 'circle-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
    },
  };

  if (gameState.mode === 'menu') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        {/* Background Map */}
        <Map
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 2,
          }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          interactive={false}
        />

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

        {/* Centered Modal */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(24px)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '2rem', maxWidth: '32rem', width: '100%' }}>
            <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              World Population Guess
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Guess the population within a circle anywhere on Earth
            </p>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Choose Difficulty</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => startRandomGame('regional')}
                    disabled={isLoading}
                    className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center">
                      <span>Regional</span>
                      <span className="text-sm opacity-90">1-10 km</span>
                    </div>
                  </button>
                  <button
                    onClick={() => startRandomGame('country')}
                    disabled={isLoading}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center">
                      <span>Country</span>
                      <span className="text-sm opacity-90">10-100 km</span>
                    </div>
                  </button>
                  <button
                    onClick={() => startRandomGame('continental')}
                    disabled={isLoading}
                    className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center">
                      <span>Continental</span>
                      <span className="text-sm opacity-90">100-2000 km</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={startDesignMode}
                  className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold"
                >
                  Create Custom Game
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Choose your own location and radius
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={gameState.mode === 'design' && isSettingCenter ? handleMapClick : undefined}
        mapStyle={mapLayer === 'satellite' ? MAP_STYLES.satellite : MAP_STYLES.default}
        style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
        cursor={isSettingCenter ? 'crosshair' : 'grab'}
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
      >
        <NavigationControl position="top-right" />

        {/* Layer Switcher - Show in design mode always, or in game mode after result */}
        {(gameState.mode === 'design' || (gameState.mode === 'random' && gameState.showResult)) && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '50px',
              zIndex: 1,
              display: 'flex',
              gap: '4px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <button
              onClick={() => setMapLayer('default')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: mapLayer === 'default' ? '#3b82f6' : 'transparent',
                color: mapLayer === 'default' ? 'white' : '#374151',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Default Map"
            >
              Map
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: mapLayer === 'satellite' ? '#3b82f6' : 'transparent',
                color: mapLayer === 'satellite' ? 'white' : '#374151',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Satellite Imagery"
            >
              Satellite
            </button>
          </div>
        )}

        {circleGeoJSON && (
          <Source id="circle" type="geojson" data={circleGeoJSON}>
            <Layer {...fillLayer} />
            <Layer {...outlineLayer} />
          </Source>
        )}

        <Source
          id="circle-center"
          type="geojson"
          data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [gameState.longitude, gameState.latitude],
            },
          }}
        >
          <Layer {...circleLayerStyle} />
        </Source>

        {/* Labels Layer - Show in design mode always, or in game mode after result */}
        {(gameState.mode === 'design' || (gameState.mode === 'random' && gameState.showResult)) && (
          <Source
            id="labels"
            type="raster"
            tiles={[
              'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png'
            ]}
            tileSize={256}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          >
            <Layer
              id="labels-layer"
              type="raster"
              paint={{
                'raster-opacity': 1
              }}
            />
          </Source>
        )}
      </Map>

      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            color: 'rgb(31, 41, 55)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 1)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Game UI Overlay (Random mode) */}
      {gameState.mode === 'random' && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 10,
            minWidth: '340px',
            maxWidth: '420px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(229, 231, 235, 1)'
          }}
        >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={resetGame}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {gameState.mode === 'random' ? 'Random Game' : 'Custom Game'}
                </h2>
                {gameState.difficulty && (
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                    gameState.difficulty === 'regional' ? 'bg-green-100 text-green-700' :
                    gameState.difficulty === 'country' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {gameState.difficulty}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={shareGame}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share game"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</div>
              <div className="font-mono text-sm text-gray-700">
                {gameState.latitude.toFixed(4)}, {gameState.longitude.toFixed(4)}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Radius</div>
              <div className="text-2xl font-bold text-gray-800">{gameState.radiusKm.toFixed(2)} <span className="text-sm text-gray-500">km</span></div>
            </div>
          </div>
        </div>

        {!gameState.showResult ? (
          <div className="space-y-4 px-6 pb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Your Population Guess</label>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max={SLIDER_STEPS}
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                disabled={isLoading}
              />

              {/* Manual Input */}
              <div className="mt-3">
                <input
                  type="text"
                  value={gameState.userGuess}
                  onChange={handleManualInput}
                  placeholder="Enter population"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-blue-400 transition-all text-center font-semibold text-lg"
                  disabled={isLoading}
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {gameState.userGuess ? parseInt(gameState.userGuess).toLocaleString() : '0'} people
                </div>
              </div>
            </div>

            <button
              onClick={handleGuess}
              disabled={isLoading || !gameState.userGuess}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? 'Calculating...' : 'Submit Guess'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-6 pb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">Actual Population</div>
              <div className="text-3xl font-bold text-gray-800">
                {gameState.actualPopulation?.toLocaleString()}
              </div>
            </div>

            {gameState.userGuess && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Your Guess</div>
                <div className="text-3xl font-bold text-gray-800">
                  {parseInt(gameState.userGuess).toLocaleString()}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Difference</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {Math.abs(
                      (gameState.actualPopulation || 0) - parseInt(gameState.userGuess)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => gameState.difficulty && startRandomGame(gameState.difficulty)}
              disabled={isLoading || !gameState.difficulty}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Next'}
            </button>
          </div>
        )}
        </div>
      )}

      {/* Design Mode UI Overlay */}
      {gameState.mode === 'design' && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 10,
            minWidth: '340px',
            maxWidth: '420px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(229, 231, 235, 1)'
          }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={resetGame}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to menu"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold text-gray-800">Design Game</h2>
              </div>
              <button
                onClick={shareGame}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share game"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Set Center Tool */}
              <button
                onClick={() => {
                  if (!isSettingCenter) {
                    // Clear current point and enable setting mode
                    setGameState((prev) => ({
                      ...prev,
                      latitude: 0,
                      longitude: 0,
                      actualPopulation: null,
                      showResult: false
                    }));
                    setIsSettingCenter(true);
                  }
                }}
                disabled={isSettingCenter}
                className={`w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                  isSettingCenter
                    ? 'bg-blue-500 text-white cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                }`}
              >
                {isSettingCenter ? 'Click on map to set center' : 'Set Center Point'}
              </button>

              {/* Location Display */}
              {gameState.latitude !== 0 && gameState.longitude !== 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Center Location</div>
                  <div className="font-mono text-sm text-gray-700">
                    {gameState.latitude.toFixed(4)}, {gameState.longitude.toFixed(4)}
                  </div>
                </div>
              )}

              {/* Radius Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius: {gameState.radiusKm.toFixed(1)} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="2000"
                  value={radiusSliderValue}
                  onChange={handleRadiusChange}
                  className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>2000 km</span>
                </div>
              </div>

              {/* Population Result */}
              {gameState.actualPopulation !== null && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">Population</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {gameState.actualPopulation?.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Calculate Button */}
              <button
                onClick={handleGuess}
                disabled={isLoading || gameState.latitude === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? 'Calculating...' : 'Calculate Population'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
