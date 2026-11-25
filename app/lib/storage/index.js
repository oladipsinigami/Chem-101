'use strict';

/**
 * Storage backend selection.
 *
 *   CHEM_STORAGE=file    force the local filesystem (single-process host)
 *   CHEM_STORAGE=redis   force the shared Redis REST store
 *   CHEM_STORAGE=auto    (default) Redis when credentials exist, else file
 *
 * On Vercel the filesystem is per-instance and ephemeral, so the file backend
 * would silently lose attempts. The server refuses to start examinations in
 * that combination rather than accept answers it cannot keep.
 */

const { FileBackend } = require('./file');
const { RedisBackend } = require('./redis');

function redisCredentials(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '';
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url, token, prefix: env.CHEM_REDIS_PREFIX || 'chem101' };
}

function createBackend({ root, env = process.env }) {
  const requested = String(env.CHEM_STORAGE || 'auto').toLowerCase();
  const credentials = redisCredentials(env);

  if (requested === 'redis' || (requested === 'auto' && credentials)) {
    if (!credentials) {
      throw new Error('CHEM_STORAGE=redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    }
    return new RedisBackend(credentials);
  }
  if (requested !== 'file' && requested !== 'auto') {
    throw new Error(`CHEM_STORAGE must be "file", "redis" or "auto" (received "${env.CHEM_STORAGE}").`);
  }
  return new FileBackend({ root });
}

module.exports = { createBackend, redisCredentials };
