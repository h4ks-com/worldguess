/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {GuessQualification} from './GuessQualification';
import type {SizeClass} from './SizeClass';

/**
 * Result of population calculation within a circle.
 */
export type PopulationResult = {
  population: number;
  latitude: number;
  longitude: number;
  radius_km: number;
  size_class?: SizeClass | null;
  qualification?: GuessQualification | null;
};
