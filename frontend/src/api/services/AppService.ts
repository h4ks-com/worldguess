/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {BaseHttpRequest} from '../core/BaseHttpRequest';
import type {CancelablePromise} from '../core/CancelablePromise';

export class AppService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Redirect To App
   * @returns any Successful Response
   * @throws ApiError
   */
  public redirectToAppGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/',
    });
  }
}
