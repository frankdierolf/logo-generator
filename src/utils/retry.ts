import { RateLimitError } from "../core/generator.ts";

export class RetryStrategy {
  async execute<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(
            `⚠️ Rate limited. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`,
          );
          await this.sleep(delay);
          continue;
        }

        // Check if it's a temporary network error
        if (this.isRetryableError(error) && attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(
            `⚠️ Temporary error. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`,
          );
          await this.sleep(delay);
          continue;
        }

        // If it's not retryable or we've exhausted retries, throw immediately
        throw error;
      }
    }

    throw lastError!;
  }

  private isRateLimitError(error: unknown): boolean {
    if (error instanceof RateLimitError) return true;

    const errorMessage = (error as Error)?.message?.toLowerCase() || "";
    return errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests") ||
      errorMessage.includes("quota exceeded");
  }

  private isRetryableError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || "";

    // Network-related errors that might be temporary
    return errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("econnreset") ||
      errorMessage.includes("socket hang up");
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter: base delay * 2^(attempt-1) + random jitter
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const maxDelay = 30000; // Max 30 seconds
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
