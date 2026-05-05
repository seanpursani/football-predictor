import { ScrollView, Text, View } from 'react-native';

import { Typography } from '@/src/lib/typography';

/**
 * DEV SMOKE TEST — Design System Token Verification
 * Remove after visual confirmation of Story 1.2.
 */
export default function DesignSystemSmokeTest() {
  return (
    <ScrollView className="flex-1 bg-primary p-space-4">
      {/* Colour tokens */}
      <Text style={Typography.heading1} className="text-text-primary mb-space-2">
        Colour Tokens
      </Text>
      <View className="flex-row gap-space-2 mb-space-4">
        <View className="w-16 h-16 bg-primary rounded-radius-md border border-border-subtle" />
        <View className="w-16 h-16 bg-surface rounded-radius-md" />
        <View className="w-16 h-16 bg-elevated rounded-radius-md" />
      </View>
      <View className="flex-row gap-space-2 mb-space-4">
        <Text className="text-text-primary" style={Typography.body}>Primary</Text>
        <Text className="text-accent" style={Typography.body}>Accent</Text>
        <Text className="text-deadline" style={Typography.body}>Deadline</Text>
        <Text className="text-jackpot" style={Typography.body}>Jackpot</Text>
        <Text className="text-streak" style={Typography.body}>Streak</Text>
      </View>

      {/* Typography scale */}
      <Text style={Typography.heading1} className="text-text-primary mb-space-2">
        Typography Scale
      </Text>
      <Text style={Typography.display} className="text-text-primary mb-space-1">Display 32/700</Text>
      <Text style={Typography.heading1} className="text-text-primary mb-space-1">Heading1 24/700</Text>
      <Text style={Typography.heading2} className="text-text-primary mb-space-1">Heading2 18/600</Text>
      <Text style={Typography.body} className="text-text-primary mb-space-1">Body 15/400</Text>
      <Text style={Typography.label} className="text-text-primary mb-space-1">Label 13/500</Text>
      <Text style={Typography.caption} className="text-text-primary mb-space-1">Caption 11/400</Text>
      <Text style={Typography.monoNumber} className="text-text-primary mb-space-4">MonoNumber 1234567890</Text>

      {/* Spacing */}
      <Text style={Typography.heading1} className="text-text-primary mb-space-2">
        Spacing Tokens
      </Text>
      <View className="flex-row gap-space-2 mb-space-4">
        <View className="w-space-2 h-space-2 bg-accent rounded-radius-sm" />
        <View className="w-space-4 h-space-4 bg-accent rounded-radius-md" />
        <View className="w-space-6 h-space-6 bg-accent rounded-radius-lg" />
      </View>
    </ScrollView>
  );
}

