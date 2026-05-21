// Works in both Deno (prod) and Node (test)
const getEnv = (key: string): string | undefined => {
    // @ts-ignore - Deno global available in Edge Function runtime
    if (typeof Deno !== 'undefined') return Deno.env.get(key);
    return process.env[key];
};

export {getEnv};

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const ERROR_CODES = {
    RATE_LIMITED: 'RATE_LIMITED',
    FETCH_ERROR: 'FETCH_ERROR',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface HttpSuccess {
    data: Response;
    error: null;
}

export interface HttpError {
    data: null;
    error: { code: string; message: string };
}

export type HttpResult = HttpSuccess | HttpError;

// ---------------------------------------------------------------------------
// Retry constants
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s → 2s → (after 3rd attempt: return error)

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with exponential backoff retry logic.
 *
 * Retry schedule:
 *   Attempt 1 — immediate
 *   Attempt 2 — wait 1000 ms
 *   Attempt 3 — wait 2000 ms
 *   After 3 failures — return structured error (never throw)
 *
 * Non-retryable:
 *   HTTP 4xx  → immediate error (client error)
 *   HTTP 429  → immediate { code: 'RATE_LIMITED' } (no retry)
 */
export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    maxRetries: number = MAX_RETRIES,
): Promise<HttpResult> {
    let attempt = 0;
    let delayMs = BASE_DELAY_MS;

    while (attempt < maxRetries) {
        if (attempt > 0) {
            await sleep(delayMs);
            delayMs *= 2;
        }

        attempt++;

        let response: Response;
        try {
            response = await fetch(url, options);
        } catch (err) {
            // Network / timeout error — retryable
            if (attempt >= maxRetries) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    data: null,
                    error: {code: ERROR_CODES.FETCH_ERROR, message},
                };
            }
            continue;
        }

        // Rate limited — never retry
        if (response.status === 429) {
            return {
                data: null,
                error: {
                    code: ERROR_CODES.RATE_LIMITED,
                    message: 'API rate limit exceeded (HTTP 429)',
                },
            };
        }

        // Client errors (4xx, not 429) — not retryable
        if (response.status >= 400 && response.status < 500) {
            return {
                data: null,
                error: {
                    code: ERROR_CODES.FETCH_ERROR,
                    message: `Client error: HTTP ${response.status}`,
                },
            };
        }

        // Server errors (5xx) — retryable
        if (response.status >= 500) {
            if (attempt >= maxRetries) {
                return {
                    data: null,
                    error: {
                        code: ERROR_CODES.FETCH_ERROR,
                        message: `Server error after ${maxRetries} attempts: HTTP ${response.status}`,
                    },
                };
            }
            continue;
        }

        // Success (2xx / 3xx)
        return {data: response, error: null};
    }

    // TypeScript requires a return here; the loop always returns before exhausting retries.
    /* istanbul ignore next */
    throw new Error('fetchWithRetry: unreachable — loop always returns');
}

