# LeColpo — Mobile App

Built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction).

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Copy the environment file and fill in your values

   ```bash
   cp .env.example .env.local
   ```

   > Get the Supabase URL and anon key by running `pnpm supabase status` inside `apps/supabase`.

3. Start the app

   ```bash
   pnpm start
   ```

## Running on a physical device (Expo Go)

`localhost` is not reachable from a phone — use `start:device` which auto-detects
your machine's LAN IP and patches `EXPO_PUBLIC_SUPABASE_URL` at startup:

```bash
pnpm start:device              # phone on the same WiFi as your machine
pnpm start:device:tunnel       # phone on a different network (uses ngrok tunnel for Metro)
```

> **Prerequisite for tunnel:** `pnpm add -D @expo/ngrok` (one-time, dev only).

Your LAN IP is detected automatically — no manual edits to `.env.local` needed.

## Run modes at a glance

| Command | Use when |
|---|---|
| `pnpm start` | Simulator or browser (`-w`) |
| `pnpm start:device` | Physical device — same WiFi |
| `pnpm start:device:tunnel` | Physical device — different network |
| `pnpm start:tunnel` | Expo tunnel only (Metro), no env patching |
| `pnpm start:clear` | Cache issues — clears Metro cache on startup |
| `pnpm start:log` | Debugging — tees all output to `expo-debug.log` |

## Debugging

### Terminal logs

All `console.*` output is forwarded by Metro to the terminal. Every log line from
this project is prefixed with `[HH:MM:SS.mmm] [LEVEL] [module]` so you can grep
for a specific area:

```
[12:34:56.789] [INFO ] [auth] Starting Google sign-in
[12:34:57.012] [INFO ] [auth] Redirecting to OAuth URL
[12:34:59.345] [INFO ] [auth] Session established {"userId": "..."}
```

### Capturing logs to a file

Run `pnpm start:log` to tee all Metro output into `expo-debug.log` (gitignored).
Paste or share this file when reporting issues to an AI agent.

```bash
pnpm start:log
# ... reproduce the issue ...
cat expo-debug.log | grep "\[auth\]"
```

### Error tracking (Sentry)

All auth errors are automatically captured to Sentry with structured tags
(`flow`, `provider`, `context`). No manual reporting needed — check the
[Sentry dashboard](https://sentry.io) for `lecolpo-mobile`.

### Expo Go log viewer

Shake the device inside Expo Go → **"View Logs"** to see Metro-forwarded console
output directly on the phone.

---

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you
can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with
  our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll
  create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
