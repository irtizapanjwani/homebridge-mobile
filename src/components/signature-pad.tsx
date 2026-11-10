import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { T } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Sign with a finger (or mouse). Reports whether anything has been drawn, and the strokes as SVG paths. */
export function SignaturePad({ label, onChange }: { label: string; onChange: (paths: string[]) => void }) {
  const [paths, setPaths] = useState<string[]>([]);
  const pathsRef = useRef<string[]>([]);
  const current = useRef('');
  const [live, setLive] = useState('');

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          current.current = `M${x.toFixed(1)},${y.toFixed(1)}`;
          setLive(current.current);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          current.current += ` L${x.toFixed(1)},${y.toFixed(1)}`;
          setLive(current.current);
        },
        onPanResponderRelease: () => {
          const done = current.current;
          current.current = '';
          setLive('');
          const next = [...pathsRef.current, done];
          pathsRef.current = next;
          setPaths(next);
        },
      }),
    [],
  );

  // Tell the form after React has finished rendering, never during it.
  useEffect(() => {
    onChange(paths);
  }, [paths, onChange]);

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.between}>
        <T size={13} weight="medium">
          {label}
        </T>
        {paths.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              pathsRef.current = [];
              setPaths([]);
            }}
            hitSlop={8}>
            <T size={13} weight="semibold" color={colors.muted}>
              Clear
            </T>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.pad} {...responder.panHandlers} accessibilityLabel={`${label} box. Sign with your finger.`}>
        <Svg width="100%" height="100%" pointerEvents="none">
          {[...paths, live].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={colors.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        {!paths.length && !live ? (
          <T size={13} color={colors.muted} style={styles.hint} pointerEvents="none">
            Sign here with your finger
          </T>
        ) : null}
        <View style={styles.line} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pad: { height: 140, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, backgroundColor: colors.white, overflow: 'hidden' },
  hint: { position: 'absolute', alignSelf: 'center', top: 56 },
  line: { position: 'absolute', left: 16, right: 16, bottom: 30, height: 1, backgroundColor: colors.line },
});
