/**
 * Auth utilities
 * Contains helper functions for authentication like password hashing.
 */

/**
 * Hashes a string using SHA-256.
 * We use the native Web Crypto API which is available in modern browsers.
 *
 * @param {string} password - The plaintext password.
 * @returns {Promise<string>} The SHA-256 hex hash.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
