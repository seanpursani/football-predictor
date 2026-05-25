import React, { useRef, useEffect, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Typography } from '@/src/lib/typography';

interface MinutePickerProps {
  value: number;
  onChange: (minute: number) => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 240
// Padding so first and last items can be scrolled to centre position
const CENTER_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2); // 96px (2 items)
// values 1-90 + 91 (displayed as "90+")
const MINUTES = Array.from({ length: 90 }, (_, i) => i + 1).concat([91]);

function displayMinute(value: number): string {
  return value >= 91 ? '90+' : String(value);
}

export function MinutePicker({ value, onChange }: MinutePickerProps) {
  const listRef = useRef<FlatList<number>>(null);

  const scrollToValue = useCallback(
    (val: number, animated: boolean) => {
      const index = MINUTES.indexOf(val);
      if (index >= 0 && listRef.current) {
        listRef.current.scrollToIndex({ index, animated });
      }
    },
    [],
  );

  useEffect(() => {
    // Delay to allow FlatList to lay out before scrolling
    const t = setTimeout(() => scrollToValue(value, false), 100);
    return () => clearTimeout(t);
  }, [value, scrollToValue]);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MINUTES.length - 1));
    onChange(MINUTES[clamped]);
  }

  function handleDecrement() {
    const currentIndex = MINUTES.indexOf(value);
    const newIndex = Math.max(0, currentIndex - 1);
    const newValue = MINUTES[newIndex];
    onChange(newValue);
    scrollToValue(newValue, true);
  }

  function handleIncrement() {
    const currentIndex = MINUTES.indexOf(value);
    const newIndex = Math.min(MINUTES.length - 1, currentIndex + 1);
    const newValue = MINUTES[newIndex];
    onChange(newValue);
    scrollToValue(newValue, true);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.arrowButton}
        onPress={handleDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease minute"
      >
        <Text style={styles.arrowText}>▲</Text>
      </TouchableOpacity>

      <View style={styles.listContainer}>
          <FlatList
          ref={listRef}
          data={MINUTES}
          keyExtractor={(item) => String(item)}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          contentInset={{ top: CENTER_PADDING, bottom: CENTER_PADDING }}
          contentOffset={{ x: 0, y: -CENTER_PADDING }}
          contentContainerStyle={{ paddingVertical: CENTER_PADDING }}
          getItemLayout={(_data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          style={{ height: PICKER_HEIGHT }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  item === value && styles.itemTextSelected,
                ]}
              >
                {displayMinute(item)}
              </Text>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.arrowButton}
        onPress={handleIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase minute"
      >
        <Text style={styles.arrowText}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  arrowButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  listContainer: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    ...Typography.monoNumber,
    color: '#FFFFFF',
  },
  itemTextSelected: {
    color: '#B4FF32',
    fontSize: 28,
  },
});

