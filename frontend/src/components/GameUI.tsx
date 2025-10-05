import React from 'react';

import {SLIDER_STEPS} from '../constants/map';
import {GameState, MapLayer} from '../types/game';

interface GameUIProps {
  gameState: GameState;
  isLoading: boolean;
  sliderValue: number;
  mapLayer: MapLayer;
  onMapLayerChange: (layer: MapLayer) => void;
  onSliderChange: (value: number) => void;
  onManualInputChange: (value: string) => void;
  onGuess: () => void;
  onReset: () => void;
  onShare: () => void;
  onNext: () => void;
  guessSubmitted?: boolean;
  existingGuess?: number | null;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  isLoading,
  sliderValue,
  mapLayer,
  onMapLayerChange,
  onSliderChange,
  onManualInputChange,
  onGuess,
  onReset,
  onShare,
  onNext,
  guessSubmitted = false,
  existingGuess = null,
}) => {
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      onManualInputChange(value);
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className='md:hidden w-full bg-white border-b border-gray-200 pointer-events-auto'>
        {/* Compact Header */}
        <div className='flex items-center justify-between px-3 py-2 border-b border-gray-100'>
          <button
            onClick={onReset}
            className='p-1.5 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
          </button>

          <h2 className='text-sm font-bold text-gray-800 flex-1 text-center px-2'>
            Guess the population
          </h2>

          <div className='flex gap-1'>
            {/* Layer Switcher */}
            {gameState.showResult && (
              <div className='flex bg-gray-100 rounded-lg p-0.5'>
                <button
                  onClick={() => onMapLayerChange('default')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    mapLayer === 'default'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => onMapLayerChange('satellite')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    mapLayer === 'satellite'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sat
                </button>
              </div>
            )}

            <button
              onClick={onShare}
              className='p-1.5 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Controls */}
        {!gameState.showResult ? (
          guessSubmitted && existingGuess !== null ? (
            <div className='px-3 py-3'>
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <svg
                    className='w-5 h-5 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <h3 className='text-sm font-semibold text-green-800'>
                    Guess Submitted
                  </h3>
                </div>
                <p className='text-sm text-green-700'>
                  Your guess: <span className='font-bold'>{existingGuess.toLocaleString()}</span>
                </p>
                <p className='text-xs text-green-600 mt-2'>
                  Waiting for the challenge to end to see results...
                </p>
              </div>
            </div>
          ) : (
            <div className='px-3 py-3 space-y-3'>
              <div className='space-y-2'>
                <input
                  type='range'
                  min='0'
                  max={SLIDER_STEPS}
                  value={sliderValue}
                  onChange={e => onSliderChange(Number(e.target.value))}
                  className='w-full'
                />
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={gameState.userGuess || ''}
                    onChange={handleManualInput}
                    placeholder='Enter population'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <button
                    onClick={onGuess}
                    disabled={!gameState.userGuess || isLoading}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
                  >
                    {isLoading ? 'Loading...' : 'Submit'}
                  </button>
                </div>
              <button
                onClick={onNext}
                disabled={isLoading}
                className='w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {isLoading && (
                  <svg
                    className='animate-spin h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                )}
                {isLoading ? 'Loading...' : 'Skip Place'}
              </button>
            </div>
          </div>
          )
        ) : (
          <div className='px-3 py-3 space-y-2'>
            {/* Result */}
            {(() => {
              const actual = gameState.actualPopulation || 0;
              const guess = parseInt(gameState.userGuess);
              const difference = Math.abs(actual - guess);

              let colorScheme;
              let label;

              if (actual < 1000) {
                if (guess < 1000) {
                  colorScheme = {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-600',
                  };
                  label = 'GOOD';
                } else if (guess < 2000) {
                  colorScheme = {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-600',
                  };
                  label = 'MEH';
                } else {
                  colorScheme = {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-600',
                  };
                  label = 'BAD';
                }
              } else {
                const relativeError = difference / actual;
                if (relativeError <= 0.3) {
                  colorScheme = {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-600',
                  };
                  label = 'GOOD';
                } else if (relativeError <= 0.5) {
                  colorScheme = {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-600',
                  };
                  label = 'MEH';
                } else {
                  colorScheme = {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-600',
                  };
                  label = 'BAD';
                }
              }

              return (
                <div
                  className={`${colorScheme.bg} border ${colorScheme.border} rounded-lg p-3`}
                >
                  <div className='flex items-baseline justify-between mb-2'>
                    <div>
                      <div className='text-xs text-gray-500 uppercase'>
                        Actual
                      </div>
                      <div className='text-xl font-bold text-gray-800'>
                        {actual.toLocaleString()}
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${colorScheme.text}`}>
                      {label}
                    </div>
                  </div>
                  <div className='text-sm text-gray-600'>
                    Your guess: {guess.toLocaleString()}
                    {actual > 0 &&
                      ` (${((difference / actual) * 100).toFixed(1)}% off)`}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={onNext}
              disabled={isLoading}
              className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isLoading && (
                <svg
                  className='animate-spin h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
              )}
              {isLoading ? 'Loading...' : 'Next Place'}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div
        className='hidden md:block pointer-events-auto'
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
          border: '1px solid rgba(229, 231, 235, 1)',
        }}
      >
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-3'>
              <button
                onClick={onReset}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                title='Back to menu'
              >
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
              </button>
              <div>
                <h2 className='text-lg font-bold text-gray-800'>
                  How many people live inside the circle?
                </h2>
                {gameState.sizeClass && (
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      gameState.sizeClass === 'regional'
                        ? 'bg-green-100 text-green-700'
                        : gameState.sizeClass === 'country'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {gameState.sizeClass}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onShare}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title='Share game'
            >
              <svg
                className='w-5 h-5 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                />
              </svg>
            </button>
          </div>

          <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 space-y-3 border border-gray-200'>
            <div>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                Location
              </div>
              <div className='font-mono text-sm text-gray-700'>
                {gameState.latitude.toFixed(4)},{' '}
                {gameState.longitude.toFixed(4)}
              </div>
            </div>
            <div className='border-t border-gray-200 pt-3'>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                Radius
              </div>
              <div className='text-2xl font-bold text-gray-800'>
                {gameState.radiusKm.toFixed(2)}{' '}
                <span className='text-sm text-gray-500'>km</span>
              </div>
            </div>
          </div>

          {!gameState.showResult ? (
            guessSubmitted && existingGuess !== null ? (
              <div className='mt-6'>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <svg
                      className='w-6 h-6 text-green-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <h3 className='text-base font-semibold text-green-800'>
                      Guess Submitted
                    </h3>
                  </div>
                  <p className='text-sm text-green-700 mb-1'>
                    Your guess: <span className='font-bold text-lg'>{existingGuess.toLocaleString()}</span> people
                  </p>
                  <p className='text-xs text-green-600'>
                    Waiting for the challenge to end to see results...
                  </p>
                </div>
              </div>
            ) : (
              <div className='mt-6 space-y-4'>
                <div>
                  <div className='text-sm font-semibold text-gray-700 mb-3'>
                    Your Population Guess
                  </div>
                  <input
                    type='range'
                    min='0'
                    max={SLIDER_STEPS}
                    value={sliderValue}
                    onChange={e => onSliderChange(Number(e.target.value))}
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600'
                  />
                  <div className='flex items-center gap-3 mt-3'>
                    <input
                      type='text'
                      value={gameState.userGuess || ''}
                      onChange={handleManualInput}
                      placeholder='Enter population'
                      className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <div className='text-sm text-gray-600 whitespace-nowrap'>
                      {gameState.userGuess
                        ? parseInt(gameState.userGuess).toLocaleString()
                        : '0'}{' '}
                      people
                    </div>
                  </div>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={onNext}
                  disabled={isLoading}
                  className='px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 flex-1'
                >
                  {isLoading && (
                    <svg
                      className='animate-spin h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                  )}
                  {isLoading ? 'Loading...' : 'Skip Place'}
                </button>
                <button
                  onClick={onGuess}
                  disabled={!gameState.userGuess || isLoading}
                  className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20 flex-1'
                >
                  {isLoading ? 'Loading...' : 'Submit Guess'}
                </button>
              </div>
            </div>
            )
          ) : (
            <div className='mt-6 space-y-4'>
              {/* Layer Switcher */}
              <div className='flex bg-gray-100 rounded-xl p-1'>
                <button
                  onClick={() => onMapLayerChange('default')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    mapLayer === 'default'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => onMapLayerChange('satellite')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    mapLayer === 'satellite'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Satellite
                </button>
              </div>

              <div className='bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-4'>
                <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-2'>
                  Actual Population
                </div>
                <div className='text-3xl font-bold text-gray-800'>
                  {(gameState.actualPopulation || 0).toLocaleString()}
                </div>
              </div>

              {gameState.userGuess &&
                (() => {
                  const actual = gameState.actualPopulation || 0;
                  const guess = parseInt(gameState.userGuess);
                  const difference = Math.abs(actual - guess);

                  let colorScheme;
                  let label;

                  if (actual < 1000) {
                    if (guess < 1000) {
                      colorScheme = {
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        text: 'text-green-600',
                      };
                      label = 'GOOD';
                    } else if (guess < 2000) {
                      colorScheme = {
                        bg: 'from-yellow-50 to-amber-50',
                        border: 'border-yellow-200',
                        text: 'text-yellow-600',
                      };
                      label = 'MEH';
                    } else {
                      colorScheme = {
                        bg: 'from-red-50 to-rose-50',
                        border: 'border-red-200',
                        text: 'text-red-600',
                      };
                      label = 'BAD';
                    }
                  } else {
                    const relativeError = difference / actual;
                    if (relativeError <= 0.3) {
                      colorScheme = {
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        text: 'text-green-600',
                      };
                      label = 'GOOD';
                    } else if (relativeError <= 0.5) {
                      colorScheme = {
                        bg: 'from-yellow-50 to-amber-50',
                        border: 'border-yellow-200',
                        text: 'text-yellow-600',
                      };
                      label = 'MEH';
                    } else {
                      colorScheme = {
                        bg: 'from-red-50 to-rose-50',
                        border: 'border-red-200',
                        text: 'text-red-600',
                      };
                      label = 'BAD';
                    }
                  }

                  return (
                    <div
                      className={`bg-gradient-to-br ${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl p-4`}
                    >
                      <div
                        className={`text-xs font-medium ${colorScheme.text} uppercase tracking-wide mb-2`}
                      >
                        Your Guess
                      </div>
                      <div className='text-3xl font-bold text-gray-800'>
                        {guess.toLocaleString()}
                      </div>
                      <div
                        className={`mt-3 pt-3 border-t ${colorScheme.border}`}
                      >
                        <div
                          className={`text-xs font-bold ${colorScheme.text} uppercase tracking-wide mb-1`}
                        >
                          {label}
                        </div>
                        <div className='text-lg font-semibold text-gray-700'>
                          {actual === 0
                            ? `${difference.toLocaleString()} off`
                            : `${difference.toLocaleString()} off (${((difference / actual) * 100).toFixed(1)}%)`}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <button
                onClick={onNext}
                disabled={isLoading}
                className='w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2'
              >
                {isLoading && (
                  <svg
                    className='animate-spin h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                )}
                {isLoading ? 'Loading...' : 'Next Place'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
