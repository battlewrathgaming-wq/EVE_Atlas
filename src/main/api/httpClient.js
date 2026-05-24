const { USER_AGENT } = require('../../shared/constants');
const { createRunId, nowIso } = require('../db/evidenceRepository');

const RETRY_STATUSES = new Set([420, 429, 503]);
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_ATTEMPTS = 3;

class HttpClient {
  constructor({
    userAgent = USER_AGENT,
    repository = null,
    runId = null,
    runType = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal = null,
    fetchImpl = fetch,
    maxAttempts = DEFAULT_MAX_ATTEMPTS
  } = {}) {
    this.userAgent = userAgent;
    this.repository = repository;
    this.runId = runId;
    this.runType = runType || (runId ? 'collection' : 'unscoped');
    this.timeoutMs = timeoutMs;
    this.signal = signal;
    this.fetchImpl = fetchImpl;
    this.maxAttempts = maxAttempts;
  }

  async json(provider, endpoint, options = {}) {
    const method = options.method || 'GET';
    const started = Date.now();
    let retryCount = 0;
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;

    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      const requestSignal = combinedSignal([this.signal, options.signal], timeoutMs);
      try {
        const response = await this.fetchImpl(endpoint, {
          ...options,
          method,
          signal: requestSignal.signal,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            ...(options.headers || {})
          }
        });

        if (response.ok) {
          const text = await response.text();
          const data = parseJsonResponse(text, provider, endpoint);
          this.log({ provider, endpoint, method, statusCode: response.status, durationMs: Date.now() - started, retryCount });
          requestSignal.cleanup();
          return data;
        }

        if (RETRY_STATUSES.has(response.status) && attempt < this.maxAttempts - 1) {
          retryCount += 1;
          await delay(retryDelay(response, attempt), requestSignal.signal);
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
        throw httpStatusError(provider, response.status, endpoint);
      } catch (error) {
        const normalized = normalizeRequestError(error, requestSignal);
        if (normalized.nonRetryable) {
          if (!normalized.error.logged) {
            this.log({
              provider,
              endpoint,
              method,
              durationMs: Date.now() - started,
              retryCount,
              errorMessage: normalized.error.message
            });
          }
          throw normalized.error;
        }

        if (attempt < this.maxAttempts - 1) {
          retryCount += 1;
          try {
            await delay(1000 * (attempt + 1), requestSignal.signal);
          } finally {
            requestSignal.cleanup();
          }
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
        throw normalized.error;
      } finally {
        requestSignal.cleanup();
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

function delay(ms, signal = null) {
  if (signal?.aborted) {
    return Promise.reject(abortError('HTTP_CANCELLED', 'HTTP request cancelled'));
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(abortError('HTTP_CANCELLED', 'HTTP request cancelled'));
      }, { once: true });
    }
  });
}

function combinedSignal(signals, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  const validSignals = signals.filter(Boolean);

  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  const timeout = Number(timeoutMs) > 0
    ? setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, Number(timeoutMs))
    : null;

  const cleanup = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    for (const signal of validSignals) {
      signal.removeEventListener('abort', onAbort);
    }
  };

  controller.signal.addEventListener('abort', cleanup, { once: true });

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup
  };
}

function normalizeRequestError(error, requestSignal) {
  if (requestSignal.timedOut()) {
    return {
      nonRetryable: true,
      error: abortError('HTTP_TIMEOUT', 'HTTP request timed out')
    };
  }
  if (error?.name === 'AbortError' || error?.code === 'HTTP_CANCELLED') {
    return {
      nonRetryable: true,
      error: abortError('HTTP_CANCELLED', 'HTTP request cancelled')
    };
  }
  if (error?.nonRetryable) {
    return {
      nonRetryable: true,
      error
    };
  }
  return {
    nonRetryable: false,
    error
  };
}

function parseJsonResponse(text, provider, endpoint) {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const wrapped = new Error(`${provider} returned invalid JSON for ${endpoint}`);
    wrapped.code = 'HTTP_INVALID_JSON';
    wrapped.name = 'SyntaxError';
    wrapped.cause = error;
    wrapped.nonRetryable = true;
    throw wrapped;
  }
}

function abortError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.name = code === 'HTTP_TIMEOUT' ? 'TimeoutError' : 'AbortError';
  return error;
}

function httpStatusError(provider, statusCode, endpoint) {
  const error = new Error(`${provider} ${statusCode} for ${endpoint}`);
  error.code = 'HTTP_STATUS_ERROR';
  error.statusCode = statusCode;
  error.nonRetryable = true;
  error.logged = true;
  return error;
}

module.exports = {
  HttpClient,
  DEFAULT_TIMEOUT_MS,
  parseJsonResponse
};
