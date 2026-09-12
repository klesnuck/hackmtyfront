/**
 * Single source of truth for visual design, shared by both catalogs
 * (`catalog/standard`, `catalog/voz-color`). See MOBILE_ARCHITECTURE.md §5.
 *
 * Brand colors are taken from the Banorte identity used in the earlier
 * Figma login design (`ARQUITECTURA_MOBILE.md` history) — swap freely if
 * the team settles on different brand values.
 */

export const colors = {
  brand: {
    primary: '#EC0029',
    primaryDark: '#B0001D',
    primaryPressed: '#C40023',
  },
  text: {
    primary: '#1C1C1E',
    secondary: '#757579',
    placeholder: '#AEAEB2',
    onBrand: '#FFFFFF',
    onBrandMuted: 'rgba(255,255,255,0.8)',
    link: '#EC0029',
    danger: '#D70015',
    success: '#1D8A4A',
  },
  surface: {
    app: '#F4F5F7',
    card: '#FFFFFF',
    field: '#F4F5F7',
    overlay: 'rgba(0,0,0,0.4)',
  },
  border: {
    subtle: '#E5E5EA',
    strong: '#C7C7CC',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  pill: 100,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 17 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 20 },
} as const;

/** High-contrast, larger-scale overrides for the `voz-color` catalog (REQ-ACC-02). */
export const accessibleTypography = {
  ...typography,
  body: { fontSize: 19, fontWeight: '500' as const, lineHeight: 27 },
  bodyStrong: { fontSize: 19, fontWeight: '700' as const, lineHeight: 27 },
  label: { fontSize: 16, fontWeight: '700' as const, lineHeight: 21 },
  button: { fontSize: 20, fontWeight: '800' as const, lineHeight: 25 },
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Minimum touch target for the accessible catalog (WCAG 2.5.5 AAA is 44x44; we go larger). */
export const accessibleMinTouchTarget = 56;
