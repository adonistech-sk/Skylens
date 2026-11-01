// Calibrated by sampling the reference PNGs: backgrounds sit around #05080F to #0B111A,
// the peach gradient runs from #F6BFA0 through #E2997D, and panels are #0F131E.
export const color = {
  base: '#060A14',
  surface: '#0B1020',
  elevated: '#111A30',
  panel: 'rgba(16, 21, 33, 0.72)',
  text: '#F5F2F0',
  textSecondary: '#A8AFBE',
  textTertiary: '#6F7687',
  peach: '#F5B394',
  peachDeep: '#E2997D',
  peachLight: '#FFCAA7',
  peachInk: '#23150F',
  cool: '#9FAFE1',
  hairline: 'rgba(255,255,255,0.10)',
  hairlineStrong: 'rgba(255,255,255,0.16)',
  peachLine: 'rgba(245,179,148,0.55)',
  peachFill: 'rgba(245,179,148,0.14)',
  danger: '#E58A7A',
} as const;

export const font = {
  serif: 'Newsreader_300Light',
  serifItalic: 'Newsreader_300Light_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const type = {
  display: { fontFamily: font.serif, fontSize: 50, lineHeight: 54, color: color.text, letterSpacing: -0.5 },
  title: { fontFamily: font.serif, fontSize: 38, lineHeight: 44, color: color.text, letterSpacing: -0.4 },
  heading: { fontFamily: font.serif, fontSize: 24, lineHeight: 30, color: color.text, letterSpacing: -0.2 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: color.textSecondary },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 21, color: color.text },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.textSecondary },
  micro: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, color: color.textSecondary },
  tracked: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, color: color.textSecondary, letterSpacing: 3.6, textTransform: 'uppercase' as const },
  data: { fontFamily: font.medium, fontSize: 14, lineHeight: 18, color: color.text, fontVariant: ['tabular-nums' as const] },
} as const;

export const peachGradient = ['#FBCBAF', '#F2B193', '#DD9378'] as const;
