import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

// Line icons copied from the client design (24x24 viewBox, stroke based).
export type IconName =
  | 'back'
  | 'chevron'
  | 'bell'
  | 'globe'
  | 'home'
  | 'contribute'
  | 'projects'
  | 'vote'
  | 'statement'
  | 'profile'
  | 'arrowUp'
  | 'check'
  | 'plus'
  | 'building'
  | 'trend'
  | 'housing'
  | 'photo'
  | 'clock'
  | 'download'
  | 'shield'
  | 'chat'
  | 'mail'
  | 'doc'
  | 'table';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color = colors.green, strokeWidth = 1.8 }: Props) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const body = (() => {
    switch (name) {
      case 'back':
        return <Path d="M15 5l-7 7 7 7" {...common} />;
      case 'chevron':
        return <Path d="M9 5l7 7-7 7" {...common} />;
      case 'bell':
        return (
          <>
            <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...common} />
            <Path d="M10 20a2 2 0 0 0 4 0" {...common} />
          </>
        );
      case 'globe':
        return (
          <>
            <Circle cx="12" cy="12" r="9" {...common} />
            <Path
              d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"
              {...common}
            />
          </>
        );
      case 'home':
        return <Path d="M3 11 L12 4 L21 11 V20 H14 V14 H10 V20 H3 Z" {...common} />;
      case 'contribute':
        return (
          <>
            <Circle cx="12" cy="12" r="9" {...common} />
            <Path d="M12 8v8M8 12h8" {...common} />
          </>
        );
      case 'projects':
        return (
          <>
            <Rect x="3" y="4" width="18" height="6" rx="1.5" {...common} />
            <Rect x="3" y="14" width="18" height="6" rx="1.5" {...common} />
          </>
        );
      case 'vote':
        return (
          <>
            <Path d="M4 12h16v8H4z" {...common} />
            <Path d="M8 8l3 3 5-6" {...common} />
          </>
        );
      case 'statement':
        return (
          <>
            <Path d="M6 3h9l4 4v14H6z" {...common} />
            <Path d="M9 12h7M9 16h7" {...common} />
          </>
        );
      case 'doc':
        return <Path d="M6 3h9l4 4v14H6z" {...common} />;
      case 'table':
        return (
          <>
            <Path d="M4 6h16v12H4z" {...common} />
            <Path d="M4 9h16" {...common} />
          </>
        );
      case 'profile':
        return (
          <>
            <Circle cx="12" cy="8" r="4" {...common} />
            <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...common} />
          </>
        );
      case 'arrowUp':
        return <Path d="M12 19V5M6 11l6-6 6 6" {...common} />;
      case 'check':
        return <Path d="M5 12l4 4 10-10" {...common} />;
      case 'plus':
        return <Path d="M12 5v14M5 12h14" {...common} />;
      case 'building':
        return (
          <>
            <Path d="M4 21V9l8-5 8 5v12" {...common} />
            <Path d="M9 21v-6h6v6M4 21h16" {...common} />
          </>
        );
      case 'trend':
        return (
          <>
            <Path d="M4 19l5-6 4 3 7-9" {...common} />
            <Path d="M15 7h5v5" {...common} />
          </>
        );
      case 'housing':
        return <Path d="M3 20h18M5 20V10l4-3 4 3v10M13 20v-7l3-2 3 2v7" {...common} />;
      case 'photo':
        return (
          <>
            <Rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            <Circle cx="9" cy="10" r="2" {...common} />
            <Path d="M21 16l-5-5-9 8" {...common} />
          </>
        );
      case 'clock':
        return (
          <>
            <Circle cx="12" cy="12" r="9" {...common} />
            <Path d="M12 7v5l3 2" {...common} />
          </>
        );
      case 'download':
        return <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" {...common} />;
      case 'shield':
        return (
          <>
            <Path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" {...common} />
            <Path d="M8.5 12l2.5 2.5 4.5-5" {...common} />
          </>
        );
      case 'chat':
        return <Path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z" {...common} />;
      case 'mail':
        return (
          <>
            <Rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            <Path d="M3 7l9 6 9-6" {...common} />
          </>
        );
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

// Gold filled tick used for "selected" and "vote recorded" states.
export function CheckBadge({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill={colors.gold} />
      <Path
        d="M7 12.5l3.2 3.2L17 9"
        stroke={colors.ink}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
