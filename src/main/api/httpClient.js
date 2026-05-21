const { USER_AGENT } = require('../../shared/constants');
const { createRunId, nowIso } = require('../db/evidenceRepository');

const RETRY_STATUSES = new Set([420, 429, 503]);

class HttpClient {
  constructor({ userAgent = USER_AGENT, repository = null, runId = null, runType = null } = {}) {
    this.userAgent = userAgent;
    this.repository = repository;
    this.runId = runId;
    this.runType = runType || (runId ? 'collection' : 'unscoped');
  }

  async json(provider, endpoint, options = {}) {
    const method = options.method || 'GET';
    const started = Date.now();
    let retryCount = 0;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          ...options,
          method,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            ...(options.headers || {})
          }
        });

        if (response.ok) {
          this.log({ provider, endpoint, method, statusCode: response.status, durationMs: Date.now() - started, retryCount });
          const text = await response.text();
          return text ? JSON.parse(text) : null;
        }

        if (RETRY_STATUSES.has(response.status) && attempt < 2) {
          retryCount += 1;
          await delay(retryDelay(response, attempt));
          continue;
        }

        this.log({
          provider,
          endpoint,
          method,
          statusCode: response.status,
          durationMs: Date.now() - started,
          retryCount,
          rateLimited: response.status === 420 || response.status === 429,
          errorMessage: `${provider} ${response.status}`
        });
        throw new Error(`${provider} ${response.status} for ${endpoint}`);
      } catch (error) {
        if (attempt < 2) {
          retryCount += 1;
          await delay(1000 * (attempt + 1));
          continue;
        }

        this.log({
          provider,
          endpoint,
          method,
          durationMs: Date.now() - started,
          retryCount,
          errorMessage: error.message
        });
        throw error;
      }
    }

    throw new Error(`${provider} retry limit reached for ${endpoint}`);
  }

  log(entry) {
    this.repository?.insertApiRequestLog({
      request_id: createRunId('request'),
      run_id: this.runId,
      run_type: this.runType,
      provider: entry.provider,
      endpoint: entry.endpoint,
      method: entry.method,
      status_code: entry.statusCode,
      duration_ms: entry.durationMs,
      cache_status: entry.cacheStatus || 'miss',
      retry_count: entry.retryCount || 0,
      rate_limited: entry.rateLimited || false,
      error_message: entry.errorMessage || null,
      requested_at: nowIso()
    });
  }
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }
  return Math.min(30000, 1500 * (attempt + 1) * (attempt + 1));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  HttpClient
};
