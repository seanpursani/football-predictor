// @ts-nocheck — Deno runtime types not available in Node/TS toolchain
import * as Sentry from 'npm:@sentry/deno';

let initialized = false;

function ensureInit() {
    if (initialized) return;
    Sentry.init({
        dsn: Deno.env.get('SENTRY_DSN') ?? '',
        environment: 'edge-functions',
        tracesSampleRate: 0,
    });
    initialized = true;
}

/**
 * Capture an exception in the edge-functions Sentry environment.
 */
export function captureException(err: unknown, context?: Record<string, unknown>) {
    ensureInit();
    Sentry.withScope((scope: { setContext: (key: string, ctx: unknown) => void }) => {
        if (context) scope.setContext('additional', context);
        Sentry.captureException(err);
    });
    // Flush buffered events — Edge Functions may exit immediately after returning
    Sentry.flush(2000);
}

/**
 * Capture a high-priority exception (level: fatal) — used by run-scoring.
 */
export function captureHighPriority(err: unknown, context?: Record<string, unknown>) {
    ensureInit();
    Sentry.withScope((scope: {
        setContext: (key: string, ctx: unknown) => void;
        setLevel: (level: string) => void
    }) => {
        scope.setLevel('fatal'); // high-priority alert
        if (context) scope.setContext('additional', context);
        Sentry.captureException(err);
    });
    // Flush buffered events — Edge Functions may exit immediately after returning
    Sentry.flush(2000);
}

