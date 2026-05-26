import {ActivityIndicator, View} from 'react-native';

// Landing page for web OAuth redirect. Supabase's detectSessionInUrl (enabled on
// web in supabase.ts) exchanges the code automatically; AuthGate in _layout.tsx
// then redirects to the appropriate screen once the session is set.
export default function AuthCallback() {
    return (
        <View style={{flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center'}}>
            <ActivityIndicator color="#B4FF32" size="large"/>
        </View>
    );
}