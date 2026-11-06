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
  | 'table'
  | 'lock'
  | 'eye'
  | 'eyeOff'
  | 'fingerprint'
  | 'copy'
  | 'award'
  | 'camera'
  | 'card'
  | 'bank';

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
      case 'camera':
        return (
          <>
            <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...common} />
            <Circle cx="12" cy="13" r="3.5" {...common} />
          </>
        );
      case 'card':
        return (
          <>
            <Rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            <Path d="M3 10h18M7 15h4" {...common} />
          </>
        );
      case 'bank':
        return <Path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" {...common} />;
      case 'lock':
        return (
          <>
            <Rect x="5" y="11" width="14" height="10" rx="2" {...common} />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" {...common} />
          </>
        );
      case 'eye':
        return (
          <>
            <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" {...common} />
            <Circle cx="12" cy="12" r="3" {...common} />
          </>
        );
      case 'eyeOff':
        return (
          <>
            <Path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" {...common} />
            <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" {...common} />
          </>
        );
      case 'fingerprint':
        return (
          <>
            <Path d="M7.5 19.5A11 11 0 0 0 9 12a3 3 0 0 1 6 0c0 2.4-.3 4.7-1 7" {...common} />
            <Path d="M5 15.5A14 14 0 0 0 5.5 12a6.5 6.5 0 0 1 13 0c0 1.6-.1 3.1-.4 4.6M12 12c0 3-.6 5.8-1.8 8.4" {...common} />
            <Path d="M4 8.5A9.5 9.5 0 0 1 20 8.5" {...common} />
          </>
        );
      case 'copy':
        return (
          <>
            <Rect x="9" y="9" width="11" height="11" rx="2" {...common} />
            <Path d="M5 15V6a2 2 0 0 1 2-2h8" {...common} />
          </>
        );
      case 'award':
        return (
          <>
            <Circle cx="12" cy="9" r="5" {...common} />
            <Path d="M9 13.5L8 21l4-2 4 2-1-7.5" {...common} />
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
