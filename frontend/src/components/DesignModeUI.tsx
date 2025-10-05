import React from 'react';

import {GameState, MapLayer} from '../types/game';

interface DesignModeUIProps {
  gameState: GameState;
  isLoading: boolean;
  isSettingCenter: boolean;
  radiusSliderValue: number;
  mapLayer: MapLayer;
  onMapLayerChange: (layer: MapLayer) => void;
  onSetCenter: () => void;
  onRadiusChange: (value: number) => void;
  onCalculate: () => void;
  onReset: () => void;
  onShare: () => void;
}

export const DesignModeUI: React.FC<DesignModeUIProps> = ({
  gameState,
  isLoading,
  isSettingCenter,
  radiusSliderValue,
  mapLayer,
  onMapLayerChange,
  onSetCenter,
  onRadiusChange,
  onCalculate,
  onReset,
  onShare,
}) => {
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
            Design Game
          </h2>

          <div className='flex gap-1'>
            {/* Layer Switcher */}
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
        <div className='px-3 py-3 space-y-3'>
          <button
            onClick={onSetCenter}
            disabled={isSettingCenter}
            className={`w-full px-3 py-2 rounded-lg transition-colors font-semibold text-sm ${
              isSettingCenter
                ? 'bg-blue-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSettingCenter ? 'Click map' : 'Set Center'}
          </button>

          <div className='flex items-center gap-2'>
            <div className='text-xs font-medium text-gray-500 whitespace-nowrap'>
              R:
            </div>
            <input
              type='range'
              min='1'
              max='2000'
              value={radiusSliderValue}
              onChange={e => onRadiusChange(parseFloat(e.target.value))}
              className='flex-1'
            />
            <div className='text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[60px] text-right'>
              {gameState.radiusKm.toFixed(0)} km
            </div>
          </div>

          {gameState.actualPopulation !== null && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
              <div className='text-xs text-gray-500 uppercase mb-1'>
                Population
              </div>
              <div className='text-xl font-bold text-gray-800'>
                {gameState.actualPopulation?.toLocaleString()}
              </div>
            </div>
          )}

          <button
            onClick={onCalculate}
            disabled={isLoading || gameState.latitude === 0}
            className='w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
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
              <h2 className='text-lg font-bold text-gray-800'>Design Game</h2>
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

          <div className='space-y-4'>
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

            <button
              onClick={onSetCenter}
              disabled={isSettingCenter}
              className={`w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                isSettingCenter
                  ? 'bg-blue-500 text-white cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
              }`}
            >
              {isSettingCenter
                ? 'Click on map to set center'
                : 'Set Center Point'}
            </button>

            {gameState.latitude !== 0 && gameState.longitude !== 0 && (
              <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200'>
                <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Center Location
                </div>
                <div className='font-mono text-sm text-gray-700'>
                  {gameState.latitude.toFixed(4)},{' '}
                  {gameState.longitude.toFixed(4)}
                </div>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Radius: {gameState.radiusKm.toFixed(1)} km
              </label>
              <input
                type='range'
                min='1'
                max='2000'
                value={radiusSliderValue}
                onChange={e => onRadiusChange(parseFloat(e.target.value))}
                className='w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>1 km</span>
                <span>2000 km</span>
              </div>
            </div>

            {gameState.actualPopulation !== null && (
              <div className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4'>
                <div className='text-xs font-medium text-green-600 uppercase tracking-wide mb-2'>
                  Population
                </div>
                <div className='text-3xl font-bold text-gray-800'>
                  {gameState.actualPopulation?.toLocaleString()}
                </div>
              </div>
            )}

            <button
              onClick={onCalculate}
              disabled={isLoading || gameState.latitude === 0}
              className='w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
            >
              {isLoading ? 'Calculating...' : 'Calculate Population'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
