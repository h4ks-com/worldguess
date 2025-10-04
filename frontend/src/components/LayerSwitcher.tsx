import React from 'react';

import {MapLayer} from '../types/game';

interface LayerSwitcherProps {
  mapLayer: MapLayer;
  onChange: (layer: MapLayer) => void;
}

export const LayerSwitcher: React.FC<LayerSwitcherProps> = ({
  mapLayer,
  onChange,
}) => {
  return (
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <button
        onClick={() => onChange('default')}
        style={{
          padding: '6px 12px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: mapLayer === 'default' ? '#3b82f6' : 'transparent',
          color: mapLayer === 'default' ? 'white' : '#374151',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title='Default Map'
      >
        Map
      </button>
      <button
        onClick={() => onChange('satellite')}
        style={{
          padding: '6px 12px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: mapLayer === 'satellite' ? '#3b82f6' : 'transparent',
          color: mapLayer === 'satellite' ? 'white' : '#374151',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title='Satellite Imagery'
      >
        Satellite
      </button>
    </div>
  );
};
