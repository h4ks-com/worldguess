import {DifficultyLevel} from '../api/models/DifficultyLevel';

export type {DifficultyLevel};
export type GameMode = 'menu' | 'random' | 'design';
export type MapLayer = 'default' | 'satellite';

export interface GameState {
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

export interface ToastState {
  show: boolean;
  message: string;
}
