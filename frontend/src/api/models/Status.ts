/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Status = {
  status: Status.status;
  pipeline_status?: string | null;
};
export namespace Status {
  export enum status {
    READY = 'ready',
    NOT_READY = 'not ready',
  }
}
