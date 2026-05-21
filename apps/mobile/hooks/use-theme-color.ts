/**
 * Dark-mode only theme colour hook.
 */

import {Colors} from '@/constants/theme';

type FlatColorKey = 'accent' | 'success' | 'jackpot' | 'captain' | 'deadline' | 'streak' | 'miss';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: FlatColorKey
) {
    const colorFromProps = props.dark;

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors[colorName];
    }
}
