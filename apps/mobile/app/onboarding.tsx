import { SafeAreaView, Text } from 'react-native';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Onboarding</Text>
    </SafeAreaView>
  );
}

