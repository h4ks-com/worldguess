import React from 'react';
import Map from 'react-map-gl/maplibre';

import {DifficultyLevel} from '../api/models/DifficultyLevel';

interface MenuScreenProps {
  isLoading: boolean;
  onStartRandomGame: (difficulty: DifficultyLevel) => void;
  onStartDesignMode: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  isLoading,
  onStartRandomGame,
  onStartDesignMode,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Background Map */}
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 2,
        }}
        mapStyle='https://demotiles.maplibre.org/style.json'
        style={{width: '100%', height: '100%'}}
        interactive={false}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Centered Modal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            maxWidth: '32rem',
            width: '100%',
          }}
        >
          <h1 className='text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            World Population Guess
          </h1>
          <p className='text-center text-gray-600 mb-8'>
            Guess the population within a circle anywhere on Earth
          </p>

          <div className='space-y-6'>
            <div>
              <h2 className='text-lg font-semibold mb-3 text-gray-700'>
                Choose Difficulty
              </h2>
              <div className='grid grid-cols-1 gap-3'>
                <button
                  onClick={() => onStartRandomGame(DifficultyLevel.REGIONAL)}
                  disabled={isLoading}
                  className='px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <div className='flex justify-between items-center'>
                    <span>Regional</span>
                    <span className='text-sm opacity-90'>1-10 km</span>
                  </div>
                </button>
                <button
                  onClick={() => onStartRandomGame(DifficultyLevel.COUNTRY)}
                  disabled={isLoading}
                  className='px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <div className='flex justify-between items-center'>
                    <span>Country</span>
                    <span className='text-sm opacity-90'>10-100 km</span>
                  </div>
                </button>
                <button
                  onClick={() => onStartRandomGame(DifficultyLevel.CONTINENTAL)}
                  disabled={isLoading}
                  className='px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <div className='flex justify-between items-center'>
                    <span>Continental</span>
                    <span className='text-sm opacity-90'>100-2000 km</span>
                  </div>
                </button>
              </div>
            </div>

            <div className='border-t border-gray-200 pt-6'>
              <button
                onClick={onStartDesignMode}
                className='w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold'
              >
                Create Custom Game
              </button>
              <p className='text-sm text-gray-500 mt-2 text-center'>
                Choose your own location and radius
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
