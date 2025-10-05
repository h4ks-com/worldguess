/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {SizeClass} from './SizeClass';

/**
 * Request to create a challenge.
 */
export type CreateChallengeRequest = {
  latitude: number;
  longitude: number;
  radius_km: number;
  size_class?: SizeClass | null;
  webhook_url?: string | null;
  webhook_token?: string | null;
  webhook_extra_params?: Record<string, any> | null;
};
