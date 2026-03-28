/**
 * App theme tokens. Primary palette: white surfaces + brand green accent.
 */
export const theme = {
  colors: {
    white: '#ffffff',
    pageBackground: '#f6f7fb',
    /** Main brand / accent (buttons, links, emphasis) */
    primary: '#4cae4f',
    /** Primary button disabled / inactive fill */
    primaryDisabled: '#b9d9b9',
    /** Text and icons on primary (green) backgrounds */
    onPrimary: '#ffffff',
    textPrimary: '#111111',
    textSecondary: '#555555',
    textMuted: '#888888',
    border: '#e5e7eb',
    borderStrong: '#dddddd',
    /** Hero / streak gradient (green) */
    gradientStart: '#4cae4f',
    gradientEnd: '#2f8f3a',
    /** Pastel circles for quick actions */
    quickTintPurple: '#ede9fe',
    quickTintBlue: '#dbeafe',
    quickTintGreen: '#dcfce7',
    quickTintOrange: '#ffedd5',
    iconPurple: '#7c3aed',
    iconBlue: '#2563eb',
    iconGreen: '#16a34a',
    iconOrange: '#ea580c',
    /** Selected list/card background (primary tint) */
    surfaceSelected: 'rgba(76, 174, 79, 0.12)',
  },
} as const;

export type Theme = typeof theme;
