export interface ColorScheme {
  nodePurple: string;
  warmBackground: string;
  enterpriseBlue: string;
  primaryBlue: string;
  accentCyan: string;
  marginGreen: string;
  moqOrange: string;
  deepNavy: string;
  surfaceWhite: string;
  errorRed: string;
  borderLight: string;

  // Theme text & surface colors
  surface: string;
  cardColor: string;
  scaffoldBackground: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceMuted: string;
  onSurfaceVariant: string;
  onPrimary: string;
  primary: string;
  error: string;
  cardBorder: string;
}

export const lightColors: ColorScheme = {
  nodePurple: '#9C27B0',
  warmBackground: '#F9F6F2',
  enterpriseBlue: '#12BBF0',
  primaryBlue: '#12BBF0',
  accentCyan: '#00B8D9',
  marginGreen: '#36B37E',
  moqOrange: '#FFAB00',
  deepNavy: '#172B4D',
  surfaceWhite: '#FFFFFF',
  errorRed: '#DE350B',
  borderLight: '#DFE1E6',

  // Theme text & surface colors
  surface: '#FFFFFF',
  cardColor: '#FFFFFF',
  scaffoldBackground: '#F8F9FA',
  surfaceContainerHighest: '#E0E2EC',
  onSurface: '#172B4D',
  onSurfaceMuted: 'rgba(23, 43, 77, 0.6)',
  onSurfaceVariant: '#42526E',
  onPrimary: '#FFFFFF',
  primary: '#12BBF0', // Enterprise Blue / Node Primary Blue
  error: '#DE350B',
  cardBorder: 'rgba(23, 43, 77, 0.08)',
};

export const darkColors: ColorScheme = {
  nodePurple: '#CE93D8',
  warmBackground: '#1C1C21',
  enterpriseBlue: '#12BBF0',
  primaryBlue: '#12BBF0',
  accentCyan: '#00C7E6',
  marginGreen: '#4ADE80',
  moqOrange: '#FBBF24',
  deepNavy: '#FFFFFF',
  surfaceWhite: '#1C1C21',
  errorRed: '#FF5722',
  borderLight: '#2D2E33',

  // Theme text & surface colors
  surface: '#1C1C21',
  cardColor: '#1C1C21',
  scaffoldBackground: '#0E0E12',
  surfaceContainerHighest: '#2B2B30',
  onSurface: '#FFFFFF',
  onSurfaceMuted: 'rgba(255, 255, 255, 0.6)',
  onSurfaceVariant: '#CAC4D0',
  onPrimary: '#0E0E12',
  primary: '#12BBF0', // Enterprise Blue in dark mode
  error: '#FF5722',
  cardBorder: '#2D2E33',
};

let _activeColors: ColorScheme = lightColors;

export function setActiveThemeColors(isDark: boolean) {
  _activeColors = isDark ? darkColors : lightColors;
}

export const AppColors: ColorScheme = new Proxy(lightColors, {
  get(_, prop: keyof ColorScheme) {
    return _activeColors[prop] !== undefined ? _activeColors[prop] : lightColors[prop];
  },
});
