import { SafeAreaView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function FixtureCatalogScreen() {
  const { fixtureId } = useLocalSearchParams<{ fixtureId: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Moment Catalog — Fixture {fixtureId}</Text>
    </SafeAreaView>
  );
}

