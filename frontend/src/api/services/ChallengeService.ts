/* generated using openapi-typescript-codegen -- do not edit */

/* istanbul ignore file */

/* tslint:disable */

/* eslint-disable */
import type {BaseHttpRequest} from '../core/BaseHttpRequest';
import type {CancelablePromise} from '../core/CancelablePromise';
import type {ChallengeDetails} from '../models/ChallengeDetails';
import type {CreateChallengeRequest} from '../models/CreateChallengeRequest';
import type {CreateChallengeResponse} from '../models/CreateChallengeResponse';
import type {EndChallengeResponse} from '../models/EndChallengeResponse';
import type {SubmitGuessRequest} from '../models/SubmitGuessRequest';
import type {SubmitGuessResponse} from '../models/SubmitGuessResponse';

export class ChallengeService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Create Challenge
   * Create a new challenge with optional webhook notifications.
   * @param requestBody
   * @returns CreateChallengeResponse Successful Response
   * @throws ApiError
   */
  public createChallengeV1ChallengeCreatePost(
    requestBody: CreateChallengeRequest,
  ): CancelablePromise<CreateChallengeResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/challenge/create',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Challenge
   * Get challenge details.
   * @param challengeId
   * @returns ChallengeDetails Successful Response
   * @throws ApiError
   */
  public getChallengeV1ChallengeChallengeIdGet(
    challengeId: string,
  ): CancelablePromise<ChallengeDetails> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/v1/challenge/{challenge_id}',
      path: {
        challenge_id: challengeId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get User Guess
   * Check if user has already submitted a guess.
   * @param challengeId
   * @param username
   * @returns any Successful Response
   * @throws ApiError
   */
  public getUserGuessV1ChallengeChallengeIdGuessUsernameGet(
    challengeId: string,
    username: string,
  ): CancelablePromise<Record<string, number | null>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/v1/challenge/{challenge_id}/guess/{username}',
      path: {
        challenge_id: challengeId,
        username: username,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Submit Guess
   * Submit a guess for a challenge.
   * @param challengeId
   * @param requestBody
   * @returns SubmitGuessResponse Successful Response
   * @throws ApiError
   */
  public submitGuessV1ChallengeChallengeIdGuessPost(
    challengeId: string,
    requestBody: SubmitGuessRequest,
  ): CancelablePromise<SubmitGuessResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/challenge/{challenge_id}/guess',
      path: {
        challenge_id: challengeId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * End Challenge
   * End a challenge, calculate rankings, send webhooks, and cleanup.
   * @param challengeId
   * @returns EndChallengeResponse Successful Response
   * @throws ApiError
   */
  public endChallengeV1ChallengeChallengeIdEndPost(
    challengeId: string,
  ): CancelablePromise<EndChallengeResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/v1/challenge/{challenge_id}/end',
      path: {
        challenge_id: challengeId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
