import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timer first — handles the case where a new message fires
    // while the toast is already visible (visible stays true, message changes)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (visible) {
      timerRef.current = setTimeout(() => {
        onHide();
      }, 4000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, message, onHide]);

  if (!visible) return null;

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    padding: 12,
  },
  text: {
    ...Typography.body,
    color: '#FFFFFF',
  },
});

