class ProviderTimeoutError extends Error {
  constructor(providerLabel, timeoutMs) {
    super(`Provider "${providerLabel}" timed out after ${timeoutMs}ms`);
    this.name = 'ProviderTimeoutError';
    this.isTimeout = true;
  }
}


function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

module.exports = { ProviderTimeoutError, createTimeoutSignal };
