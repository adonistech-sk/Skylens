// The motion system. One easing, a few durations, and nothing that loops: movement here
// confirms something the user did or settles a screen, then stops. Everything runs on
// the UI thread through Reanimated, and all of it respects the system's Reduce Motion.
import { ReactNode, useEffect, useRef } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';

export const motion = {
  /** A soft landing with no overshoot. */
  ease: Easing.bezier(0.22, 0.8, 0.25, 1),
  fast: 130,
  base: 260,
  reveal: 520,
  stagger: 90,
} as const;

/** Content entering a screen. It rises a little and fades, once. */
export function Reveal({ children, delay = 0, style, fade }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; fade?: boolean }) {
  const entering = (fade ? FadeIn : FadeInDown).duration(motion.reveal).delay(delay).easing(motion.ease).reduceMotion(ReduceMotion.System);
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}

/** An image settling into place: a slow, shallow push that ends and stays still. */
export function Settle({ children, style, from = 1.07, rise = 16, duration = 2400 }: { children: ReactNode; style?: StyleProp<ViewStyle>; from?: number; rise?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) t.value = withTiming(1, { duration, easing: motion.ease }); }, [reduced, duration, t]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: from + (1 - from) * t.value }, { translateY: rise * (1 - t.value) }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TapProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; depth?: number };

/** A press that gives way slightly under the finger, then returns. */
export function Tap({ style, depth = 0.965, onPressIn, onPressOut, children, ...rest }: TapProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const set = (v: number) => { if (!reduced) scale.value = withTiming(v, { duration: motion.fast, easing: motion.ease }); };
  return (
    <AnimatedPressable {...rest} style={[style, animated]}
      onPressIn={(e: GestureResponderEvent) => { set(depth); onPressIn?.(e); }}
      onPressOut={(e: GestureResponderEvent) => { set(1); onPressOut?.(e); }}>
      {children}
    </AnimatedPressable>
  );
}

/** A small lift when a state turns on, such as saving a favorite. */
export function Pop({ active, children, style }: { active: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduced) return;
    scale.value = withSequence(withTiming(active ? 1.2 : 0.92, { duration: 130, easing: motion.ease }), withTiming(1, { duration: 220, easing: motion.ease }));
  }, [active, reduced, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
