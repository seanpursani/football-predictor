/**
 * Edge Function Sentry helper — structural/contract tests.
 * The Deno runtime is not available in Jest; we use virtual mocks and
 * stubs to verify the module exports the expected API surface.
 *
 * Full integration validation is done after Supabase Edge Functions deployment
 * by observing errors appear in the Sentry 'edge-functions' environment.
 */
import * as fs from 'fs';
import * as path from 'path';

// Anchor to monorepo root (4 levels up from apps/mobile/src/lib)
const MONOREPO_ROOT = path.resolve(__dirname, '../../../../');
const SENTRY_HELPER_PATH = path.join(
    MONOREPO_ROOT,
    'apps/supabase/supabase/functions/_shared/sentry.ts'
);

describe('Edge Function Sentry helper — file contract', () => {
    it('file exists', () => {
        expect(fs.existsSync(SENTRY_HELPER_PATH)).toBe(true);
    });

    it('exports captureException', () => {
        const source = fs.readFileSync(SENTRY_HELPER_PATH, 'utf-8');
        expect(source).toMatch(/export function captureException/);
    });

    it('exports captureHighPriority', () => {
        const source = fs.readFileSync(SENTRY_HELPER_PATH, 'utf-8');
        expect(source).toMatch(/export function captureHighPriority/);
    });

    it('sets level fatal in captureHighPriority', () => {
        const source = fs.readFileSync(SENTRY_HELPER_PATH, 'utf-8');
        expect(source).toMatch(/setLevel\(['"]fatal['"]\)/);
    });

    it('sets environment to edge-functions', () => {
        const source = fs.readFileSync(SENTRY_HELPER_PATH, 'utf-8');
        expect(source).toMatch(/environment.*edge-functions/);
    });
});



