/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {DifficultyLevel} from './DifficultyLevel';

/**
 * Configuration for a population guessing game.
 */
export type GameConfig = {
  latitude: number;
  longitude: number;
  radius_km: number;
  difficulty?: DifficultyLevel | null;
};
