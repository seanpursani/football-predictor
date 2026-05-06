import { SafeAreaView, Text } from 'react-native';

export default function BuildScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Build View</Text>
    </SafeAreaView>
  );
}

