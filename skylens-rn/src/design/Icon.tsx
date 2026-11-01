// Fine outline icons drawn for SkyLens on a 24pt grid.
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color } from './tokens';

const PATHS = {
  search: [['c', 11, 11, 6.5], 'M16 16l4.5 4.5'],
  layers: ['M12 4l8.5 4.5L12 13 3.5 8.5 12 4z', 'M3.5 12.5L12 17l8.5-4.5', 'M3.5 16.2L12 20.7l8.5-4.5'],
  navigate: ['M20 4L4 10.8l6.9 2.3 2.3 6.9L20 4z'],
  calendar: [['r', 4, 5.5, 16, 15, 3], 'M4 10h16', 'M8.5 3.5v4', 'M15.5 3.5v4', 'M8 14h2', 'M14 14h2', 'M8 17h2'],
  scan: ['M4 9V6a2 2 0 012-2h3', 'M15 4h3a2 2 0 012 2v3', 'M20 15v3a2 2 0 01-2 2h-3', 'M9 20H6a2 2 0 01-2-2v-3', 'M8.5 12h7', 'M12 8.5v7'],
  dots: [['f', 5, 12, 1.5], ['f', 12, 12, 1.5], ['f', 19, 12, 1.5]],
  back: ['M15 5l-7 7 7 7'],
  chevron: ['M9.5 5.5L16 12l-6.5 6.5'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  heart: ['M12 20s-7.8-4.9-7.8-10.3A4.4 4.4 0 0112 7.2a4.4 4.4 0 017.8 2.5C19.8 15.1 12 20 12 20z'],
  share: ['M12 15V4', 'M8 7.5L12 3.5l4 4', 'M7 11H5.5v9.5h13V11H17'],
  star: ['M12 3.6l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.6z'],
  pin: ['M12 21s7-6.3 7-11.5a7 7 0 10-14 0C5 14.7 12 21 12 21z', ['c', 12, 9.5, 2.5]],
  arrowRight: ['M4 12h15', 'M14 7l5 5-5 5'],
  arrowUpRight: ['M7 17L17 7', 'M9 7h8v8'],
  crown: ['M4 18.5h16', 'M4.5 15.5L3 7.5l5 3.5 4-6.5 4 6.5 5-3.5-1.5 8h-15z'],
  cube: ['M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z', 'M4 7.5l8 4.5 8-4.5', 'M12 12v9'],
  bell: ['M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15l1.5-2z', 'M10 20.5a2 2 0 004 0'],
  gear: [['c', 12, 12, 3], 'M12 3v2.5', 'M12 18.5V21', 'M3 12h2.5', 'M18.5 12H21', 'M5.6 5.6l1.8 1.8', 'M16.6 16.6l1.8 1.8', 'M5.6 18.4l1.8-1.8', 'M16.6 7.4l1.8-1.8', ['c', 12, 12, 6.7]],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  pulse: ['M3 13h4l2.5-7 4 13 2.6-6H21'],
  size: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5', 'M4 4l6 6', 'M20 4l-6 6', 'M4 20l6-6', 'M20 20l-6-6'],
  diamond: ['M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z'],
  target: [['c', 12, 12, 6.5], ['f', 12, 12, 1.4], 'M12 2.5v4', 'M12 17.5v4', 'M2.5 12h4', 'M17.5 12h4'],
  sparkle: ['M9 4l1.6 5.4L16 11l-5.4 1.6L9 18l-1.6-5.4L2 11l5.4-1.6L9 4z', 'M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8L18 3z', 'M18 15l.6 1.4L20 17l-1.4.6L18 19l-.6-1.4L16 17l1.4-.6L18 15z'],
  moonRing: ['M20 12a8 8 0 11-5-7.4', ['c', 12, 12, 3], 'M18.5 3.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z'],
  exploreOrb: [['c', 12, 12, 8.5], 'M6 18L18 6', 'M4.8 8.2A15 15 0 0115.8 19'],
  horizon: ['M3 18h18', 'M6.5 18a5.5 5.5 0 0111 0', 'M12 7.5V4', 'M9.5 9.5l-1.5-2', 'M14.5 9.5l1.5-2', 'M5 21h14'],
  play: ['M8 5.5v13l10.5-6.5L8 5.5z'],
  pause: ['M8.5 5.5v13', 'M15.5 5.5v13'],
  rewind: ['M12 6.5v11L4 12l8-5.5z', 'M20 6.5v11L12 12l8-5.5z'],
  forward: ['M4 6.5v11l8-5.5-8-5.5z', 'M12 6.5v11l8-5.5-8-5.5z'],
  skipBack: ['M18 6.5v11L10 12l8-5.5z', 'M6 6.5v11'],
  skipForward: ['M6 6.5v11l8-5.5-8-5.5z', 'M18 6.5v11'],
  fullscreen: ['M4 9V6a2 2 0 012-2h3', 'M15 4h3a2 2 0 012 2v3', 'M20 15v3a2 2 0 01-2 2h-3', 'M9 20H6a2 2 0 01-2-2v-3', 'M9 12h6'],
  info: [['c', 12, 12, 8.5], 'M12 11v5.5', ['f', 12, 7.8, 1.1]],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  refresh: ['M19.5 12a7.5 7.5 0 11-2.2-5.3', 'M17.5 3.5v3.7h-3.7'],
  shield: ['M12 3l7.5 2.8v5.5c0 4.7-3.1 8-7.5 9.7-4.4-1.7-7.5-5-7.5-9.7V5.8L12 3z'],
  doc: ['M6.5 3.5h8l4 4v13h-12v-17z', 'M14 3.5V8h4.5', 'M9 12.5h6', 'M9 16h6'],
  nightEye: [['c', 12, 12, 8.5], ['f', 12, 12, 3]],
} as const;

export type IconName = keyof typeof PATHS;

const FILLED = new Set<IconName>(['play', 'rewind', 'forward', 'skipBack', 'skipForward']);

export function Icon({ name, size = 22, tint = color.text, weight = 1.5, filled }: { name: IconName; size?: number; tint?: string; weight?: number; filled?: boolean }) {
  const solid = filled ?? FILLED.has(name);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {(PATHS[name] as readonly (string | readonly (string | number)[])[]).map((p, i) => {
        if (typeof p === 'string') {
          return <Path key={i} d={p} stroke={tint} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" fill={solid ? tint : 'none'} />;
        }
        const [kind, a, b, c, d, e] = p as [string, number, number, number, number?, number?];
        if (kind === 'c') return <Circle key={i} cx={a} cy={b} r={c} stroke={tint} strokeWidth={weight} />;
        if (kind === 'f') return <Circle key={i} cx={a} cy={b} r={c} fill={tint} />;
        return <Rect key={i} x={a} y={b} width={c} height={d} rx={e} stroke={tint} strokeWidth={weight} />;
      })}
    </Svg>
  );
}

/** The four-point celestial emblem from the brand lockup. */
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 1c1 9.2 5.8 14 15 15-9.2 1-14 5.8-15 15-1-9.2-5.8-14-15-15 9.2-1 14-5.8 15-15z" fill={color.peachLight} />
      <Circle cx={16} cy={16} r={2.2} fill="#FFF3E8" />
    </Svg>
  );
}
