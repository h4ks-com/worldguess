import {ApiClient} from './ApiClient';

// Create a singleton API client instance
// Use window.location.origin as the base URL since frontend is served from the same backend
export const apiClient = new ApiClient({
  BASE: window.location.origin,
});
