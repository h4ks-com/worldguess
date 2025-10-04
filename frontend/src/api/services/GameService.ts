/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {BaseHttpRequest} from '../core/BaseHttpRequest';
import type {CancelablePromise} from '../core/CancelablePromise';
import type {GameConfig} from '../models/GameConfig';
import type {PopulationResult} from '../models/PopulationResult';
import type {RandomGameResponse} from '../models/RandomGameResponse';
import type {SizeClass} from '../models/SizeClass';

export class GameService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Calculate Population
   * Calculate population within a circular area.
   * @param requestBody
   * @returns PopulationResult Successful Response
   * @throws ApiError
   */
  public calculatePopulationV1GameCalculatePost(
    requestBody: GameConfig,
  ): CancelablePromise<PopulationResult> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/game/calculate',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Create Random Game
   * Generate a random game with specified size class.
   * @param sizeClass
   * @returns RandomGameResponse Successful Response
   * @throws ApiError
   */
  public createRandomGameV1GameRandomPost(
    sizeClass: SizeClass,
  ): CancelablePromise<RandomGameResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/game/random',
      query: {
        size_class: sizeClass,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Create Custom Game
   * Create a custom game with specified location and radius.
   * @param requestBody
   * @returns RandomGameResponse Successful Response
   * @throws ApiError
   */
  public createCustomGameV1GameCreatePost(
    requestBody: GameConfig,
  ): CancelablePromise<RandomGameResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/game/create',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
