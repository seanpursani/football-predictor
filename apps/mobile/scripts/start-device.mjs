#!/usr/bin/env node
/**
 * start-device.mjs
 *
 * Starts Expo with the correct EXPO_PUBLIC_SUPABASE_URL for physical device
 * testing (Expo Go). Automatically detects your machine's LAN IP and
 * substitutes it for 'localhost' in the env var so the phone can reach your
 * local Supabase instance.
 *
 * Usage:
 *   pnpm start:device            → LAN IP + expo start (same WiFi required)
 *   pnpm start:device --tunnel   → LAN IP for Supabase + expo tunnel for Metro
 *   pnpm start:device --clear    → add --clear to Expo flags
 *
 * Requires: Node 18+, the env vars in .env.local, and your phone on the same
 * WiFi network (unless --tunnel is also passed for the Metro bundler).
 */

import {execSync, spawn} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Detect LAN IP
// ---------------------------------------------------------------------------
function getLanIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

const lanIp = getLanIp();
if (!lanIp) {
    console.error('[start-device] ❌  Could not detect a LAN IP. Are you connected to a network?');
    process.exit(1);
}
console.log(`[start-device] 📡  Detected LAN IP: ${lanIp}`);

// ---------------------------------------------------------------------------
// 2. Read .env.local and substitute localhost → LAN IP in the Supabase URL
// ---------------------------------------------------------------------------
const envPath = join(projectRoot, '.env.local');
if (!existsSync(envPath)) {
    console.error('[start-device] ❌  .env.local not found. Copy .env.example → .env.local and fill in the values.');
    process.exit(1);
}

const envLines = readFileSync(envPath, 'utf8').split('\n');
const envVars = {};

for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

// Substitute localhost/127.0.0.1 with the LAN IP in the Supabase URL
const rawSupabaseUrl = envVars['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
const patchedSupabaseUrl = rawSupabaseUrl
    .replace(/localhost/g, lanIp)
    .replace(/127\.0\.0\.1/g, lanIp);

if (patchedSupabaseUrl !== rawSupabaseUrl) {
    console.log(`[start-device] 🔧  EXPO_PUBLIC_SUPABASE_URL: ${rawSupabaseUrl} → ${patchedSupabaseUrl}`);
} else if (!patchedSupabaseUrl) {
    console.warn('[start-device] ⚠️   EXPO_PUBLIC_SUPABASE_URL is not set in .env.local');
} else {
    console.log(`[start-device] ✅  EXPO_PUBLIC_SUPABASE_URL already uses a non-localhost address: ${patchedSupabaseUrl}`);
}

// ---------------------------------------------------------------------------
// 3. Build Expo command
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');
const useClear  = args.includes('--clear');

const expoArgs = ['start'];
if (useTunnel) expoArgs.push('--tunnel');
if (useClear)  expoArgs.push('--clear');

console.log(`[start-device] 🚀  Running: expo ${expoArgs.join(' ')}`);
if (useTunnel) {
    console.log('[start-device] 🌐  Tunnel mode — phone does not need to be on the same WiFi');
    console.log('[start-device] ⚠️   Note: Supabase still needs to be reachable via LAN IP from YOUR machine');
}

// ---------------------------------------------------------------------------
// 4. Spawn expo with patched env
// ---------------------------------------------------------------------------
const child = spawn(
    'npx',
    ['expo', ...expoArgs],
    {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
            ...process.env,
            // Spread .env.local vars (lower priority than process.env overrides)
            ...envVars,
            // Override with patched Supabase URL
            EXPO_PUBLIC_SUPABASE_URL: patchedSupabaseUrl,
        },
    }
);

child.on('exit', code => process.exit(code ?? 0));
child.on('error', err => {
    console.error('[start-device] ❌  Failed to start Expo:', err.message);
    process.exit(1);
});

