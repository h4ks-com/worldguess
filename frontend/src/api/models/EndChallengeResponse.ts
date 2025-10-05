/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for ending a challenge.
 */
export type EndChallengeResponse = {
  success: boolean;
  message: string;
  actual_population: number;
  rankings: Array<Record<string, any>>;
};
