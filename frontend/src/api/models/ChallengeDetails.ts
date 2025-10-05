/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {SizeClass} from './SizeClass';

/**
 * Details of a challenge.
 */
export type ChallengeDetails = {
  challenge_id: string;
  game_id: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  size_class?: SizeClass | null;
};
