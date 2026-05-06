import { SafeAreaView, Text } from 'react-native';

export default function PlayerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Player Selection</Text>
    </SafeAreaView>
  );
}

