/**
 * Lightweight structured logger for development.
 *
 * - Wraps console.debug/info/warn/error with a consistent [HH:MM:SS.mmm] [LEVEL] [module] prefix.
 * - All output flows to the Metro/Expo terminal where it is grep-able and AI-readable.
 * - No-ops in production builds (__DEV__ guard, tree-shaken by the bundler).
 *
 * Usage:
 *   const log = debugLog('auth');
 *   log.info('Starting Google sign-in', { redirectUri });
 *
 * Reading logs as an AI agent:
 *   Run:  pnpm start:log
 *   This tees Metro output to expo-debug.log which can be read directly.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LABEL: Record<LogLevel, string> = {
    debug: 'DEBUG',
    info:  'INFO ',
    warn:  'WARN ',
    error: 'ERROR',
};

function write(level: LogLevel, module: string, message: string, data?: unknown) {
    if (!__DEV__) return;

    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const header = `[${ts}] [${LABEL[level]}] [${module}] ${message}`;
    const formatted = data !== undefined
        ? `${header}\n${JSON.stringify(data, null, 2)}`
        : header;

    switch (level) {
        case 'debug': console.debug(formatted); break;
        case 'info':  console.info(formatted);  break;
        case 'warn':  console.warn(formatted);  break;
        case 'error': console.error(formatted); break;
    }
}

/**
 * Creates a scoped logger for a given module name.
 *
 * @example
 *   const log = debugLog('auth');
 *   log.info('Code exchanged', { userId });
 */
export function debugLog(module: string) {
    return {
        debug: (msg: string, data?: unknown) => write('debug', module, msg, data),
        info:  (msg: string, data?: unknown) => write('info',  module, msg, data),
        warn:  (msg: string, data?: unknown) => write('warn',  module, msg, data),
        error: (msg: string, data?: unknown) => write('error', module, msg, data),
    };
}
