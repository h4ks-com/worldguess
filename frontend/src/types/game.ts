import {SizeClass} from '../api/models/SizeClass';

export type {SizeClass};
export type GameMode = 'menu' | 'random' | 'design';
export type MapLayer = 'default' | 'satellite';

export interface GameState {
  mode: GameMode;
  latitude: number;
  longitude: number;
  radiusKm: number;
  sizeClass: SizeClass | null;
  gameId: string | null;
  actualPopulation: number | null;
  userGuess: string;
  showResult: boolean;
}

export interface ToastState {
  show: boolean;
  message: string;
}
