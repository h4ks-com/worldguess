/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {DifficultyLevel} from './DifficultyLevel';

/**
 * Result of population calculation within a circle.
 */
export type PopulationResult = {
  population: number;
  latitude: number;
  longitude: number;
  radius_km: number;
  difficulty?: DifficultyLevel | null;
};
