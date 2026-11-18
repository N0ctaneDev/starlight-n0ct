import type { N0ctThemeColors, N0ctThemeMode, N0ctThemePalette } from './types.js';

export interface N0ctResolvedThemeMode {
  variables: Record<string, string>;
}
export interface N0ctResolvedTheme {
  dark: N0ctResolvedThemeMode;
  light: N0ctResolvedThemeMode;
}

type N0ctDefaultPalette = Required<N0ctThemePalette>;

const DEFAULTS: Record<'dark' | 'light', N0ctDefaultPalette> = {
  dark: {
    primary: '#F25CFF',
    secondary: '#8C42FF',
    accent: '#00E5FF',
    surface: '#131626',
    text: '#E6EAF8',
    highlight: '#2A85FF',
    highlightText: '#080A15',
    background: '#0B0D17',
  },
  light: {
    primary: '#C92FCF',
    secondary: '#7540CE',
    accent: '#00AFC2',
    surface: '#FFFFFF',
    text: '#191629',
    highlight: '#286DCE',
    highlightText: '#FFFFFF',
    background: '#F8F7FC',
  },
};

const DEFAULT_SURFACES = {
  dark: {
    void: '#080A15',
    elevated: '#1D2135',
    navigation: '#131626',
    sidebar: '#131626',
    code: '#0D1020',
  },
  light: {
    void: '#FFFFFF',
    elevated: '#F1EEF8',
    navigation: '#FFFFFF',
    sidebar: '#F2EFF8',
    code: '#F3F1F8',
  },
} as const;

const DEFAULT_TEXT = {
  dark: { secondary: '#C1C8E3', muted: '#7B88B8', subtle: '#59627F', inverse: '#080A15' },
  light: { secondary: '#48445E', muted: '#716B89', subtle: '#A7A1B7', inverse: '#FFFFFF' },
} as const;

const DEFAULT_BORDERS = {
  dark: { subtle: '#282C42', default: '#282C42', strong: '#59627F' },
  light: { subtle: '#DED9E9', default: '#DED9E9', strong: '#A7A1B7' },
} as const;

const SEMANTIC_DEFAULTS = {
  dark: {
    success: '#06D6A0',
    warning: '#FFD166',
    danger: '#FF4D6D',
    info: '#FF9F1C',
  },
  light: {
    success: '#087F5B',
    warning: '#956000',
    danger: '#C12D4B',
    info: '#A85A00',
  },
} as const;

const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;
const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const SHADE_MIX: Record<string, [string, number]> = {
  '50': ['white', 0.94], '100': ['white', 0.88], '200': ['white', 0.76],
  '300': ['white', 0.62], '400': ['white', 0.42], '500': ['seed', 0],
  '600': ['black', 0.13], '700': ['black', 0.27], '800': ['black', 0.42],
  '900': ['black', 0.58], '950': ['black', 0.72],
};

function normalizeHex(value: string, path: string): string {
  if (!HEX.test(value)) throw new Error('N0ctane ' + path + ' must be a 3- or 6-digit hex color (received "' + value + '").');
  const raw = value.slice(1);
  return ('#' + (raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw)).toUpperCase();
}

function rgb(hex: string): [number, number, number] {
  const value = normalizeHex(hex, 'color').slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255) as [number, number, number];
}
function linear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const channels = rgb(hex).map(linear);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
function contrastText(background: string): string {
  return contrast('#FFFFFF', background) >= contrast('#10111A', background) ? '#FFFFFF' : '#10111A';
}
function mixHex(first: string, second: string, amountSecond: number): string {
  const a = rgb(first);
  const b = rgb(second);
  return '#' + a.map((channel, index) =>
    Math.round((channel * (1 - amountSecond) + b[index]! * amountSecond) * 255)
      .toString(16).padStart(2, '0'),
  ).join('').toUpperCase();
}
function mix(a: string, b: string, amount: number): string {
  const percentB = Math.round(amount * 100);
  return 'color-mix(in oklch, ' + a + ' ' + (100 - percentB) + '%, ' + b + ' ' + percentB + '%)';
}
function declare(vars: Record<string, string>, key: string, value: string): void {
  vars['--n0ct-' + key] = value;
}
function checkObject(value: unknown, path: string): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined || child === null) continue;
    if (typeof child === 'string') normalizeHex(child, path + '.' + key);
    else checkObject(child, path + '.' + key);
  }
}

function resolveMode(mode: 'dark' | 'light', input?: N0ctThemeMode): N0ctResolvedThemeMode {
  const dark = mode === 'dark';
  const supplied = input?.palette ?? {};
  const overrides = input?.overrides ?? {};
  checkObject(supplied, 'theme.colors.' + mode + '.palette');
  checkObject(input?.semantic, 'theme.colors.' + mode + '.semantic');
  checkObject(overrides, 'theme.colors.' + mode + '.overrides');

  const pageSurface = normalizeHex(supplied.surface ?? DEFAULTS[mode].surface, 'theme.colors.' + mode + '.palette.surface');
  const suppliedPrimary = supplied.primary ?? DEFAULTS[mode].primary;
  const suppliedAccent = supplied.accent ?? DEFAULTS[mode].accent;
  const palette: N0ctDefaultPalette = {
    ...DEFAULTS[mode],
    ...supplied,
    primary: normalizeHex(suppliedPrimary, 'theme.colors.' + mode + '.palette.primary'),
    secondary: normalizeHex(
      supplied.secondary ?? (supplied.primary !== undefined || supplied.accent !== undefined
        ? mixHex(suppliedPrimary, suppliedAccent, 0.5)
        : DEFAULTS[mode].secondary),
      'theme.colors.' + mode + '.palette.secondary',
    ),
    accent: normalizeHex(suppliedAccent, 'theme.colors.' + mode + '.palette.accent'),
    surface: pageSurface,
    text: normalizeHex(supplied.text ?? DEFAULTS[mode].text, 'theme.colors.' + mode + '.palette.text'),
    highlight: normalizeHex(
      supplied.highlight ?? (supplied.accent !== undefined || supplied.surface !== undefined
        ? mixHex(suppliedAccent, pageSurface, dark ? 0.78 : 0.88)
        : DEFAULTS[mode].highlight),
      'theme.colors.' + mode + '.palette.highlight',
    ),
    highlightText: normalizeHex(
      supplied.highlightText ?? (supplied.highlight !== undefined
        ? contrastText(supplied.highlight)
        : supplied.accent !== undefined || supplied.surface !== undefined
          ? contrastText(mixHex(suppliedAccent, pageSurface, dark ? 0.78 : 0.88))
          : DEFAULTS[mode].highlightText),
      'theme.colors.' + mode + '.palette.highlightText',
    ),
    background: normalizeHex(
      supplied.background ?? (supplied.surface !== undefined
        ? mixHex(pageSurface, dark ? '#070812' : '#F8F7FC', dark ? 0.28 : 0.04)
        : DEFAULTS[mode].background),
      'theme.colors.' + mode + '.palette.background',
    ),
  };

  const primary = normalizeHex(overrides.brand?.primary ?? palette.primary, 'theme.colors.' + mode + '.overrides.brand.primary');
  const accent = normalizeHex(overrides.brand?.accent ?? palette.accent, 'theme.colors.' + mode + '.overrides.brand.accent');
  const secondary = normalizeHex(
    overrides.brand?.secondary ?? (supplied.secondary !== undefined
      ? palette.secondary
      : overrides.brand?.primary !== undefined || overrides.brand?.accent !== undefined
        ? mixHex(primary, accent, 0.5)
        : palette.secondary),
    'theme.colors.' + mode + '.overrides.brand.secondary',
  );
  const surface = normalizeHex(overrides.surfaces?.surface ?? palette.surface, 'theme.colors.' + mode + '.overrides.surfaces.surface');
  const textPrimary = normalizeHex(overrides.text?.primary ?? palette.text, 'theme.colors.' + mode + '.overrides.text.primary');
  const highlight = normalizeHex(
    overrides.highlight?.background ?? overrides.brand?.highlight ?? palette.highlight,
    'theme.colors.' + mode + '.overrides.highlight.background',
  );
  const highlightText = normalizeHex(
    overrides.highlight?.text ?? overrides.brand?.highlightText ?? (
      overrides.highlight?.background !== undefined || overrides.brand?.highlight !== undefined
        ? contrastText(highlight)
        : palette.highlightText
    ),
    'theme.colors.' + mode + '.overrides.highlight.text',
  );

  const vars: Record<string, string> = {};
  for (const [family, seed] of Object.entries({ primary, secondary, accent })) {
    const normalized = normalizeHex(seed, 'theme.colors.' + mode + '.palette.' + family);
    for (const step of SHADE_STEPS) {
      const [target, amount] = SHADE_MIX[step]!;
      const value = target === 'seed' ? normalized : mix(normalized, target, amount);
      declare(vars, family + '-' + step, value);
    }
    declare(vars, family, 'var(--n0ct-' + family + '-500)');
  }

  const base = normalizeHex(overrides.surfaces?.base ?? palette.background, 'theme.colors.' + mode + '.overrides.surfaces.base');
  const hasCustomSurface = supplied.surface !== undefined || supplied.background !== undefined
    || overrides.surfaces?.base !== undefined || overrides.surfaces?.surface !== undefined;
  const hasCustomText = supplied.text !== undefined || overrides.text?.primary !== undefined;
  const defaultSurfaces = DEFAULT_SURFACES[mode];

  const baseVoid = overrides.surfaces?.void ?? (hasCustomSurface
    ? dark ? mix(base, '#000000', 0.34) : '#FFFFFF'
    : defaultSurfaces.void);
  const elevated = overrides.surfaces?.elevated ?? (hasCustomSurface
    ? dark ? mix(surface, '#FFFFFF', 0.075) : mix(surface, '#111827', 0.035)
    : defaultSurfaces.elevated);
  const sunken = overrides.surfaces?.sunken ?? (dark ? mix(base, '#000000', 0.12) : mix(base, surface, 0.46));
  const overlay = overrides.surfaces?.overlay ?? (hasCustomSurface
    ? dark ? mix(elevated, base, 0.22) : mix(elevated, '#FFFFFF', 0.38)
    : dark ? mix(elevated, base, 0.22) : '#FFFFFF');
  const navigation = overrides.surfaces?.navigation ?? (hasCustomSurface
    ? dark ? mix(surface, base, 0.3) : mix(surface, base, 0.22)
    : defaultSurfaces.navigation);
  const sidebar = overrides.surfaces?.sidebar ?? (hasCustomSurface
    ? dark ? mix(surface, base, 0.38) : mix(surface, base, 0.32)
    : defaultSurfaces.sidebar);
  const code = overrides.code?.background ?? overrides.surfaces?.code ?? (hasCustomSurface
    ? dark ? mix(base, surface, 0.22) : mix(base, surface, 0.44)
    : defaultSurfaces.code);
  const surfaceRoles: Record<string, string> = {
    'base-void': baseVoid,
    base,
    surface,
    'surface-elevated': elevated,
    'surface-sunken': sunken,
    'surface-overlay': overlay,
    'surface-navigation': navigation,
    'surface-sidebar': sidebar,
    'surface-code': code,
  };
  for (const [key, value] of Object.entries(surfaceRoles)) declare(vars, key, value);

  const defaultText = DEFAULT_TEXT[mode];
  const textSecondary = overrides.text?.secondary ?? (hasCustomText
    ? mix(textPrimary, base, dark ? 0.12 : 0.10)
    : defaultText.secondary);
  const textMuted = overrides.text?.muted ?? (hasCustomText
    ? mix(textPrimary, base, dark ? 0.29 : 0.30)
    : defaultText.muted);
  const textSubtle = overrides.text?.subtle ?? (hasCustomText
    ? mix(textPrimary, base, dark ? 0.46 : 0.48)
    : defaultText.subtle);
  const textAccent = overrides.text?.accent ?? (dark
    ? mix(primary, '#FFFFFF', 0.18)
    : mix(primary, '#000000', 0.27));
  const textInverse = overrides.text?.inverse ?? (hasCustomSurface ? contrastText(surface) : defaultText.inverse);
  const textRoles: Record<string, string> = {
    'text-primary': textPrimary,
    'text-secondary': textSecondary,
    'text-muted': textMuted,
    'text-subtle': textSubtle,
    'text-inverse': textInverse,
    'text-accent': textAccent,
    'text-highlight': highlightText,
    'text-on-accent': contrastText(accent),
  };
  for (const [key, value] of Object.entries(textRoles)) declare(vars, key, value);

  const defaultBorders = DEFAULT_BORDERS[mode];
  const hasCustomBorders = hasCustomSurface || hasCustomText;
  const borderRoles: Record<string, string> = {
    'border-subtle': hasCustomBorders ? mix(textPrimary, base, dark ? 0.91 : 0.90) : defaultBorders.subtle,
    border: hasCustomBorders ? mix(textPrimary, base, dark ? 0.80 : 0.83) : defaultBorders.default,
    'border-strong': hasCustomBorders ? mix(textPrimary, base, dark ? 0.65 : 0.70) : defaultBorders.strong,
    'border-focus': accent,
  };
  for (const [key, value] of Object.entries(borderRoles)) declare(vars, key, value);

  declare(vars, 'interactive-hover', mix(accent, surface, dark ? 0.88 : 0.92));
  declare(vars, 'interactive-active', mix(accent, surface, dark ? 0.78 : 0.84));
  declare(vars, 'interactive-selected', mix(primary, surface, dark ? 0.84 : 0.90));

  declare(vars, 'highlight', highlight);
  declare(vars, 'highlight-text', highlightText);
  declare(vars, 'highlight-border', mix(highlight, surface, 0.48));
  declare(vars, 'selection-background', vars['--n0ct-primary-300']!);
  declare(vars, 'selection-text', defaultSurfaces.void);

  for (const semantic of ['success', 'warning', 'danger', 'info'] as const) {
    const config = input?.semantic?.[semantic] ?? {};
    const foreground = config.foreground ?? SEMANTIC_DEFAULTS[mode][semantic];
    const background = config.background ?? mix(foreground, surface, dark ? 0.86 : 0.90);
    const border = config.border ?? mix(foreground, surface, 0.56);
    declare(vars, semantic, foreground);
    declare(vars, semantic + '-text', config.text ?? foreground);
    declare(vars, semantic + '-bg', background);
    declare(vars, semantic + '-border', border);
  }

  for (const [key, value] of Object.entries(overrides.interactive ?? {})) {
    if (value) declare(vars, 'interactive-' + key, value);
  }
  for (const [key, value] of Object.entries(overrides.highlight ?? {})) {
    if (!value) continue;
    const target = key === 'background' ? 'highlight' : key === 'text' ? 'highlight-text' : key === 'selectionBackground' ? 'selection-background' : key === 'selectionText' ? 'selection-text' : key === 'border' ? 'highlight-border' : key;
    declare(vars, target, value);
  }

  const codeOverrides = overrides.code ?? {};
  declare(vars, 'code-background', codeOverrides.background ?? vars['--n0ct-surface-code']!);
  declare(vars, 'code-foreground', codeOverrides.foreground ?? vars['--n0ct-text-primary']!);
  declare(vars, 'code-cursor', codeOverrides.cursor ?? vars['--n0ct-text-accent']!);
  declare(vars, 'code-selection-background', codeOverrides.selectionBackground ?? vars['--n0ct-selection-background']!);
  declare(vars, 'code-line-highlight', codeOverrides.lineHighlight ?? mix(vars['--n0ct-code-background'] ?? vars['--n0ct-surface-code']!, accent, dark ? 0.12 : 0.06));
  declare(vars, 'code-line-number', codeOverrides.lineNumber ?? vars['--n0ct-text-subtle']!);
  declare(vars, 'code-line-number-active', codeOverrides.lineNumberActive ?? vars['--n0ct-text-secondary']!);
  declare(vars, 'code-diff-added-bg', codeOverrides.diffAdded?.background ?? vars['--n0ct-success-bg']!);
  declare(vars, 'code-diff-added-text', codeOverrides.diffAdded?.text ?? codeOverrides.diffAdded?.foreground ?? vars['--n0ct-success-text']!);
  declare(vars, 'code-diff-added-border', codeOverrides.diffAdded?.border ?? vars['--n0ct-success']!);
  declare(vars, 'code-diff-removed-bg', codeOverrides.diffRemoved?.background ?? vars['--n0ct-danger-bg']!);
  declare(vars, 'code-diff-removed-text', codeOverrides.diffRemoved?.text ?? codeOverrides.diffRemoved?.foreground ?? vars['--n0ct-danger-text']!);
  declare(vars, 'code-diff-removed-border', codeOverrides.diffRemoved?.border ?? vars['--n0ct-danger']!);

  const tabs = codeOverrides.tabs ?? {};
  declare(vars, 'code-tabs-bg', tabs.background ?? elevated);
  declare(vars, 'code-tabs-active-bg', tabs.activeBackground ?? surface);
  declare(vars, 'code-tabs-text', tabs.foreground ?? vars['--n0ct-text-muted']!);
  declare(vars, 'code-tabs-active-text', tabs.activeForeground ?? vars['--n0ct-text-primary']!);
  declare(vars, 'code-tabs-border', tabs.border ?? vars['--n0ct-border']!);

  declare(vars, 'gradient-monochrome', 'linear-gradient(125deg, var(--n0ct-primary-300), var(--n0ct-primary-500) 56%, var(--n0ct-primary-700))');
  declare(vars, 'gradient-accent', 'linear-gradient(125deg, var(--n0ct-accent-400), var(--n0ct-accent-600))');
  declare(vars, 'gradient-brand', 'linear-gradient(125deg, var(--n0ct-primary-500) 0%, var(--n0ct-secondary-500) 38%, var(--n0ct-highlight) 70%, var(--n0ct-accent-500) 100%)');
  declare(vars, 'gradient-brand-soft', 'linear-gradient(125deg, color-mix(in srgb, var(--n0ct-primary-500) 18%, transparent), color-mix(in srgb, var(--n0ct-secondary-500) 12%, transparent) 45%, color-mix(in srgb, var(--n0ct-accent-500) 11%, transparent))');

  declare(vars, 'nav-glass', mix(navigation, base, 0.12));
  declare(vars, 'file-selected-bg', vars['--n0ct-highlight']!);
  declare(vars, 'file-selected-text', vars['--n0ct-highlight-text']!);

  const starlight: Record<string, string> = {
    '--sl-color-white': vars['--n0ct-text-primary']!,
    '--sl-color-gray-1': vars['--n0ct-text-primary']!,
    '--sl-color-gray-2': vars['--n0ct-text-secondary']!,
    '--sl-color-gray-3': vars['--n0ct-text-muted']!,
    '--sl-color-gray-4': vars['--n0ct-text-subtle']!,
    '--sl-color-gray-5': vars['--n0ct-border']!,
    '--sl-color-gray-6': vars['--n0ct-surface-elevated']!,
    '--sl-color-gray-7': vars['--n0ct-base']!,
    '--sl-color-black': vars['--n0ct-base-void']!,
    '--sl-color-accent-low': vars['--n0ct-primary-900']!,
    '--sl-color-accent': vars['--n0ct-primary-500']!,
    '--sl-color-accent-high': vars['--n0ct-primary-100']!,
    '--sl-color-text-accent': vars['--n0ct-text-accent']!,
    '--sl-color-bg': vars['--n0ct-base']!,
    '--sl-color-bg-nav': vars['--n0ct-surface-navigation']!,
    '--sl-color-bg-sidebar': vars['--n0ct-surface-sidebar']!,
    '--sl-color-hairline': vars['--n0ct-border']!,
    '--sl-color-hairline-light': vars['--n0ct-border-subtle']!,
    '--sl-color-text': vars['--n0ct-text-secondary']!,
    '--sl-color-text-invert': vars['--n0ct-text-inverse']!,
  };
  Object.assign(vars, starlight);
  return { variables: vars };
}
export function resolveN0ctThemeColors(input?: N0ctThemeColors): N0ctResolvedTheme {
  return { dark: resolveMode('dark', input?.dark), light: resolveMode('light', input?.light) };
}

export function generateN0ctThemeCss(input?: N0ctThemeColors): string {
  const resolved = resolveN0ctThemeColors(input);
  const declarations = (variables: Record<string, string>) => Object.entries(variables)
    .map(([name, value]) => name + ': ' + value + ';')
     .join('\n  ');
  return [
    ':root { color-scheme: dark;\n  ' + declarations(resolved.dark.variables) + '\n}',
    ':root[data-theme="dark"] { color-scheme: dark;\n  ' + declarations(resolved.dark.variables) + '\n}',
    ':root[data-theme="light"] { color-scheme: light;\n  ' + declarations(resolved.light.variables) + '\n}',
  ].join('\n\n') + '\n';
}

export function validateN0ctThemeColors(input?: N0ctThemeColors): string[] {
  const warnings: string[] = [];
  for (const mode of ['dark', 'light'] as const) {
    const variables = resolveMode(mode, input?.[mode]).variables;
    const ratio = contrast(variables['--n0ct-text-primary']!, variables['--n0ct-base']!);
    if (ratio < 4.5) {
      warnings.push('N0ctane theme.colors.' + mode + '.palette.text has a contrast ratio of ' + ratio.toFixed(2) + ':1 against its page background; 4.5:1 is recommended for body text.');
    }
    if (contrast(variables['--n0ct-highlight-text']!, variables['--n0ct-highlight']!) < 4.5) {
      warnings.push('N0ctane theme.colors.' + mode + '.palette.highlightText may not have sufficient contrast against palette.highlight.');
    }
  }
  return warnings;
}
