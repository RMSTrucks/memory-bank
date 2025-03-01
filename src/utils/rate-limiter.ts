/**
 * Options for rate limiter configuration
 */
export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limiter for API requests
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[];

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.requests = [];
  }

  /**
   * Check if request is within rate limit
   */
  public async checkLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove expired timestamps
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest - windowStart;
      throw new Error(`Rate limit exceeded. Please wait ${waitTime}ms`);
    }

    this.requests.push(now);
  }

  /**
   * Get current request count
   */
  public getRequestCount(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    return this.requests.filter(timestamp => timestamp > windowStart).length;
  }

  /**
   * Reset rate limiter
   */
  public reset(): void {
    this.requests = [];
  }
}
