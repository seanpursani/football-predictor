import {TextStyle} from 'react-native';

export const Typography = {
    display: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        lineHeight: 38,
    } as TextStyle,
    heading1: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        lineHeight: 30,
    } as TextStyle,
    heading2: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    } as TextStyle,
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        lineHeight: 22,
    } as TextStyle,
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        lineHeight: 18,
    } as TextStyle,
    caption: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        lineHeight: 16,
    } as TextStyle,
    monoNumber: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        lineHeight: 24,
        fontVariant: ['tabular-nums'],
    } as TextStyle,
} as const;
