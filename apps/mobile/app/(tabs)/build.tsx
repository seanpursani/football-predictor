import {Redirect} from 'expo-router';
import {Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useGameweekStore} from '@/src/stores/useGameweekStore';

export default function BuildScreen() {
    const phase = useGameweekStore((s) => s.phase);

    if (phase === null) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#080808'}} />
        );
    }

    if (phase === 'locked' || phase === 'reveal') {
        return <Redirect href="/(tabs)/moments" />;
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: '#FFFFFF', fontSize: 18}}>Build View</Text>
        </SafeAreaView>
    );
}
