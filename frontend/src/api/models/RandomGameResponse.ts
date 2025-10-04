/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {SizeClass} from './SizeClass';

/**
 * Response for random game generation.
 */
export type RandomGameResponse = {
  game_id: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  size_class?: SizeClass | null;
  share_url: string;
};
