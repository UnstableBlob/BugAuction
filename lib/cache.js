// Create an in-memory application cache map.
const map = new Map();

/**
 * Get data from cache.
 * @param {string} key
 * @returns {any | null} Returns the cached data if it exists and hasn't expired, else null.
 */
export function getCache(key) {
  const item = map.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    map.delete(key);
    return null;
  }
  return item.data;
}

/**
 * Set data in cache.
 * @param {string} key
 * @param {any} data
 * @param {number} ttlSeconds Time to live in seconds
 */
export function setCache(key, data, ttlSeconds = 2) {
  map.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Clears specific key from cache.
 * @param {string} key
 */
export function clearCache(key) {
  map.delete(key);
}

/**
 * Completely empties cache
 */
export function clearAllCache() {
  map.clear();
}
