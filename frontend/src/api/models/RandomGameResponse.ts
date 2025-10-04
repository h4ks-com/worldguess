/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {DifficultyLevel} from './DifficultyLevel';

/**
 * Response for random game generation.
 */
export type RandomGameResponse = {
  game_id: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  difficulty?: DifficultyLevel | null;
  share_url: string;
};
