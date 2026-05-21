import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Show notification when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

/**
 * Requests OS push permission and returns the Expo push token.
 * Returns null if: running on simulator, permission denied, or any error.
 * Never throws — designed to be safe to call without try/catch.
 */
export async function requestPushPermissionAndGetToken(): Promise<string | null> {
    if (!Device.isDevice) {
        return null; // simulators cannot register for push
    }
    const {status} = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        return null; // user denied — not an error
    }
    try {
        const {data} = await Notifications.getExpoPushTokenAsync();
        return data;
    } catch {
        return null; // token fetch failed — still not blocking
    }
}

/**
 * Convenience marker for push token removal.
 * Returns null — callers pass this to useUpdatePushTokenMutation({ pushToken: null }).
 * Centralises the "remove token" intent in the notifications module per architecture constraints.
 */
export function removePushToken(): null {
    return null;
}
