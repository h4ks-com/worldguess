/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {BaseHttpRequest} from '../core/BaseHttpRequest';
import type {CancelablePromise} from '../core/CancelablePromise';
import type {Status} from '../models/Status';

export class ChecksService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Check Health
   * @returns string Successful Response
   * @throws ApiError
   */
  public checkHealthV1HealthGet(): CancelablePromise<Record<string, string>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/v1/health',
    });
  }
  /**
   * Check Ready
   * @returns Status Successful Response
   * @throws ApiError
   */
  public checkReadyV1HealthReadyGet(): CancelablePromise<Status> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/v1/health/ready',
    });
  }
}
