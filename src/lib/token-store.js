/**
 * Holds the short-lived JWT access token in memory only (never localStorage
 * or sessionStorage). The refresh token lives in an httpOnly cookie set by
 * the backend, so a full page reload simply triggers a silent /auth/refresh
 * call (see AuthProvider) to re-populate this in-memory value.
 */
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}
