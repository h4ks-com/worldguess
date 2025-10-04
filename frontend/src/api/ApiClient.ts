/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {BaseHttpRequest} from './core/BaseHttpRequest';
import {FetchHttpRequest} from './core/FetchHttpRequest';
import type {OpenAPIConfig} from './core/OpenAPI';
import {AppService} from './services/AppService';
import {ChecksService} from './services/ChecksService';
import {GameService} from './services/GameService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class ApiClient {
  public readonly app: AppService;
  public readonly checks: ChecksService;
  public readonly game: GameService;
  public readonly request: BaseHttpRequest;
  constructor(
    config?: Partial<OpenAPIConfig>,
    HttpRequest: HttpRequestConstructor = FetchHttpRequest,
  ) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '0.0.1',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });
    this.app = new AppService(this.request);
    this.checks = new ChecksService(this.request);
    this.game = new GameService(this.request);
  }
}
