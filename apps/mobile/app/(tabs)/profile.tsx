import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useUpdateDisplayNameMutation, useUpdatePushTokenMutation, useUserQuery } from '@/src/queries/useUserQuery';
import { Typography } from '@/src/lib/typography';
import { requestPushPermissionAndGetToken } from '@/src/lib/notifications';

export default function ProfileScreen() {
  const { session } = useAuthState();
  const authId = session?.user?.id ?? null;
  const { data: userRecord } = useUserQuery(authId);
  const { mutate: updateDisplayName, isPending, error: mutationError, reset: resetMutation } = useUpdateDisplayNameMutation();
  const { mutateAsync: updatePushTokenAsync } = useUpdatePushTokenMutation();

  const [nameInput, setNameInput] = useState(userRecord?.displayName ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifDeniedMessage, setNotifDeniedMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNameInput(userRecord?.displayName ?? '');
  }, [userRecord?.displayName]);

  // Clear toast timer on unmount to prevent stale state updates
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  const hasNotifications = !!userRecord?.pushToken;

  const handleToggleNotifications = async () => {
    if (!authId) return;
    if (hasNotifications) {
      try {
        await updatePushTokenAsync({ authId, pushToken: null });
        setNotifDeniedMessage(null);
        showToast('Notifications disabled');
      } catch {
        showToast('Could not update notifications — please try again');
      }
    } else {
      const token = await requestPushPermissionAndGetToken();
      if (token) {
        try {
          await updatePushTokenAsync({ authId, pushToken: token });
          setNotifDeniedMessage(null);
          showToast('Notifications enabled');
        } catch {
          showToast('Could not save notification preference — please try again');
        }
      } else {
        setNotifDeniedMessage('To enable notifications, allow them in your device Settings');
      }
    }
  };

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setValidationError('Display name cannot be empty');
      return;
    }
    if (!authId) return;
    setValidationError(null);
    resetMutation();
    updateDisplayName({ authId, displayName: trimmed });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Profile</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="Enter display name"
          placeholderTextColor="#7A7A7A"
          accessibilityLabel="Display Name"
        />

        {validationError ? (
          <Text style={styles.errorText}>{validationError}</Text>
        ) : mutationError ? (
          <Text style={styles.errorText}>{"Couldn't save — please try again"}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isPending}
          accessibilityLabel="Save"
        >
          {isPending ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        {/* Notification toggle */}
        <View style={styles.notifRow}>
          <Text style={styles.notifLabel}>Push Notifications</Text>
          <Switch
            value={hasNotifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#3A3A3A', true: '#B4FF32' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Enable notifications"
            style={styles.notifSwitch}
          />
        </View>
        {notifDeniedMessage ? (
          <Text style={styles.notifDeniedText}>{notifDeniedMessage}</Text>
        ) : null}
      </View>

      {/* Bottom toast */}
      {toastMessage ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heading: {
    ...Typography.heading1,
    color: '#FFFFFF',
    marginBottom: 32,
  },
  label: {
    ...Typography.label,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  input: {
    ...Typography.body,
    color: '#FFFFFF',
    backgroundColor: '#1C1C1C',
    borderColor: '#1E1E1E',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
  },
  errorText: {
    ...Typography.caption,
    color: '#FF4444',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#B4FF32',
    borderRadius: 6,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    ...Typography.label,
    color: '#000000',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    minHeight: 44,
  },
  notifLabel: {
    ...Typography.body,
    color: '#FFFFFF',
  },
  notifSwitch: {
    minWidth: 44,
    minHeight: 44,
  },
  notifDeniedText: {
    ...Typography.caption,
    color: '#7A7A7A',
    marginTop: 6,
  },
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    ...Typography.body,
    color: '#FFFFFF',
  },
});
