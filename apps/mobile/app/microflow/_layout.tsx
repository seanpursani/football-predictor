import {Stack} from 'expo-router';

export default function MicroflowLayout() {
    return (
        <Stack>
            <Stack.Screen name="player" options={{title: 'Player Selection'}}/>
            <Stack.Screen name="timing" options={{title: 'Timing & Zone'}}/>
        </Stack>
    );
}

