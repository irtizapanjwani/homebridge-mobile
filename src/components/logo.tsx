import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

type Props = { size?: number; background?: string };

// HomeBridge mark: gold house on a bridge, two people, water below.
export function Logo({ size = 40, background = colors.green }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="HomeBridge logo">
      <Rect width="64" height="64" rx="14" fill={background} />
      <Path d="M14 30 L32 16 L50 30 Z" fill={colors.gold} />
      <Path d="M18 30 H46 V44 H38 V40 A6 6 0 0 0 26 40 V44 H18 Z" fill={colors.gold} />
      <Rect x="7" y="44" width="50" height="3" rx="1.5" fill={colors.gold} />
      <Circle cx="11" cy="37" r="2.2" fill={colors.cream} />
      <Rect x="9.5" y="39.8" width="3" height="4.2" rx="1" fill={colors.cream} />
      <Circle cx="53" cy="37" r="2.2" fill={colors.cream} />
      <Rect x="51.5" y="39.8" width="3" height="4.2" rx="1" fill={colors.cream} />
      <Path
        d="M17 53 q3.75 -3 7.5 0 t7.5 0 t7.5 0 t7.5 0"
        stroke={colors.cream}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
