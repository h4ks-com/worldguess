/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {SizeClass} from './SizeClass';

/**
 * Configuration for a population guessing game.
 */
export type GameConfig = {
  latitude: number;
  longitude: number;
  radius_km: number;
  size_class?: SizeClass | null;
};
