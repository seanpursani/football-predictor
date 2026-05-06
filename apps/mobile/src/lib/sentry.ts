import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  environment: __DEV__ ? 'development' : 'production',
  debug: __DEV__,
  // No performance monitoring overhead for MVP
  tracesSampleRate: 0,
  // Only capture errors in production to reduce dev noise
  enabled: !__DEV__,
});

export { Sentry };

