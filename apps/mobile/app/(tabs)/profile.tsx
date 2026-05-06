import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useUpdateDisplayNameMutation, useUserQuery } from '@/src/queries/useUserQuery';
import { Typography } from '@/src/lib/typography';

export default function ProfileScreen() {
  const { session } = useAuthState();
  const authId = session?.user?.id ?? null;
  const { data: userRecord } = useUserQuery(authId);
  const { mutate: updateDisplayName, isPending, error: mutationError } = useUpdateDisplayNameMutation();

  const [nameInput, setNameInput] = useState(userRecord?.displayName ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(userRecord?.displayName ?? '');
  }, [userRecord?.displayName]);

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setValidationError('Display name cannot be empty');
      return;
    }
    setValidationError(null);
    updateDisplayName({ authId: authId!, displayName: trimmed });
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
      </View>
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
});
