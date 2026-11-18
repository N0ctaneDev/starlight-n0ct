import type { N0ctThemeColors, N0ctThemeMode, N0ctThemePalette } from './types.js';

export interface N0ctResolvedThemeMode {
  variables: Record<string, string>;
}
export interface N0ctResolvedTheme {
  dark: N0ctResolvedThemeMode;
  light: N0ctResolvedThemeMode;
}

const DEFAULTS: Record<'dark' | 'light', Required<Pick<N0ctThemePalette, 'primary' | 'accent' | 'surface' | 'text'>>> = {
  dark: {
    primary: '#8C42FF',
    accent: '#2A85FF',
    surface: '#131626',
    text: '#E6EAF8',
  },
  light: {
    primary: '#286DCE',
    accent: '#7540CE',
    surface: '#FFFFFF',
    text: '#191629',
  },
};

const SEMANTIC_DEFAULTS = {
  dark: {
    success: '#43C995',
    warning: '#E8B95B',
    danger: '#EC7189',
    info: '#6DB9EA',
  },
  light: {
    success: '#087F5B',
    warning: '#956000',
    danger: '#C12D4B',
    info: '#2867B1',
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
  const surface = normalizeHex(supplied.surface ?? DEFAULTS[mode].surface, 'theme.colors.' + mode + '.palette.surface');
  const palette: Required<N0ctThemePalette> = {
    primary: normalizeHex(supplied.primary ?? DEFAULTS[mode].primary, 'theme.colors.' + mode + '.palette.primary'),
    accent: normalizeHex(supplied.accent ?? DEFAULTS[mode].accent, 'theme.colors.' + mode + '.palette.accent'),
    surface,
    text: normalizeHex(supplied.text ?? DEFAULTS[mode].text, 'theme.colors.' + mode + '.palette.text'),
    secondary: normalizeHex(supplied.secondary ?? mixHex(supplied.primary ?? DEFAULTS[mode].primary, supplied.accent ?? DEFAULTS[mode].accent, 0.5), 'theme.colors.' + mode + '.palette.secondary'),
    highlight: normalizeHex(supplied.highlight ?? mixHex(supplied.accent ?? DEFAULTS[mode].accent, surface, dark ? 0.78 : 0.88), 'theme.colors.' + mode + '.palette.highlight'),
    highlightText: normalizeHex(supplied.highlightText ?? contrastText(supplied.highlight ?? mixHex(supplied.accent ?? DEFAULTS[mode].accent, surface, dark ? 0.78 : 0.88)), 'theme.colors.' + mode + '.palette.highlightText'),
    background: normalizeHex(supplied.background ?? mixHex(surface, dark ? '#070812' : '#F8F7FC', dark ? 0.28 : 0.04), 'theme.colors.' + mode + '.palette.background'),
  };
  checkObject(input?.semantic, 'theme.colors.' + mode + '.semantic');
  checkObject(overrides, 'theme.colors.' + mode + '.overrides');

  const primary = normalizeHex(overrides.brand?.primary ?? palette.primary, 'theme.colors.' + mode + '.overrides.brand.primary');
  const accent = normalizeHex(overrides.brand?.accent ?? palette.accent, 'theme.colors.' + mode + '.overrides.brand.accent');
  const secondary = normalizeHex(overrides.brand?.secondary ?? (supplied.secondary ?? mixHex(primary, accent, 0.5)), 'theme.colors.' + mode + '.overrides.brand.secondary');
  const highlight = normalizeHex(overrides.brand?.highlight ?? (supplied.highlight ?? mixHex(accent, palette.surface, dark ? 0.78 : 0.88)), 'theme.colors.' + mode + '.overrides.brand.highlight');
  const highlightText = normalizeHex(overrides.brand?.highlightText ?? (supplied.highlightText ?? contrastText(highlight)), 'theme.colors.' + mode + '.overrides.brand.highlightText');

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

  const base = palette.background;
  const baseVoid = dark ? mix(base, '#000000', 0.34) : '#FFFFFF';
  const elevated = dark ? mix(palette.surface, '#FFFFFF', 0.075) : mix(palette.surface, '#111827', 0.035);
  const sunken = dark ? mix(base, '#000000', 0.12) : mix(base, palette.surface, 0.46);
  const overlay = dark ? mix(elevated, base, 0.22) : mix(elevated, '#FFFFFF', 0.38);
  const navigation = dark ? mix(palette.surface, base, 0.3) : mix(palette.surface, base, 0.22);
  const sidebar = dark ? mix(palette.surface, base, 0.38) : mix(palette.surface, base, 0.32);
  const code = dark ? mix(base, palette.surface, 0.22) : mix(base, palette.surface, 0.44);
  const surfaceRoles: Record<string, string> = {
    'base-void': baseVoid, base, surface: palette.surface, 'surface-elevated': elevated,
    'surface-sunken': sunken, 'surface-overlay': overlay, 'surface-navigation': navigation,
    'surface-sidebar': sidebar, 'surface-code': code,
  };
  for (const [key, value] of Object.entries(surfaceRoles)) declare(vars, key, value);

  const textRoles: Record<string, string> = {
    'text-primary': palette.text,
    'text-secondary': mix(palette.text, base, dark ? 0.12 : 0.10),
    'text-muted': mix(palette.text, base, dark ? 0.29 : 0.30),
    'text-subtle': mix(palette.text, base, dark ? 0.46 : 0.48),
    'text-inverse': contrastText(palette.surface),
    'text-accent': dark ? mix(accent, '#FFFFFF', 0.18) : accent,
    'text-highlight': highlightText,
    'text-on-accent': contrastText(accent),
  };
  for (const [key, value] of Object.entries(textRoles)) declare(vars, key, value);

  const borderRoles: Record<string, string> = {
    'border-subtle': mix(palette.text, base, dark ? 0.91 : 0.90),
    border: mix(palette.text, base, dark ? 0.80 : 0.83),
    'border-strong': mix(palette.text, base, dark ? 0.65 : 0.70),
    'border-focus': accent,
  };
  for (const [key, value] of Object.entries(borderRoles)) declare(vars, key, value);

  declare(vars, 'interactive-hover', mix(accent, palette.surface, dark ? 0.88 : 0.92));
  declare(vars, 'interactive-active', mix(accent, palette.surface, dark ? 0.78 : 0.84));
  declare(vars, 'interactive-selected', mix(primary, palette.surface, dark ? 0.84 : 0.90));

  declare(vars, 'highlight', highlight);
  declare(vars, 'highlight-text', highlightText);
  declare(vars, 'highlight-border', mix(highlight, palette.surface, 0.48));
  declare(vars, 'selection-background', mix(accent, palette.surface, dark ? 0.38 : 0.82));
  declare(vars, 'selection-text', dark ? '#FFFFFF' : '#101827');

  for (const semantic of ['success', 'warning', 'danger', 'info'] as const) {
    const config = input?.semantic?.[semantic] ?? {};
    const foreground = config.foreground ?? SEMANTIC_DEFAULTS[mode][semantic];
    const background = config.background ?? mix(foreground, palette.surface, dark ? 0.86 : 0.90);
    const border = config.border ?? mix(foreground, palette.surface, 0.56);
    declare(vars, semantic, foreground);
    declare(vars, semantic + '-text', config.text ?? foreground);
    declare(vars, semantic + '-bg', background);
    declare(vars, semantic + '-border', border);
  }

  const surfaceOverrides = overrides.surfaces ?? {};
  for (const [key, value] of Object.entries(surfaceOverrides)) {
    if (!value) continue;
    const target = key === 'void' ? 'base-void' : key === 'base' ? 'base' : key === 'elevated' ? 'surface-elevated' : key === 'sunken' ? 'surface-sunken' : key === 'overlay' ? 'surface-overlay' : key === 'navigation' ? 'surface-navigation' : key === 'sidebar' ? 'surface-sidebar' : key === 'code' ? 'surface-code' : 'surface';
    declare(vars, target, value);
  }
  for (const [key, value] of Object.entries(overrides.text ?? {})) {
    if (!value) continue;
    declare(vars, 'text-' + (key === 'onAccent' ? 'on-accent' : key), value);
  }
  for (const [key, value] of Object.entries(overrides.borders ?? {})) {
    if (!value) continue;
    declare(vars, key === 'default' ? 'border' : 'border-' + key, value);
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
  declare(vars, 'code-line-highlight', codeOverrides.lineHighlight ?? mix(code, palette.text, 0.08));
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
  declare(vars, 'code-tabs-active-bg', tabs.activeBackground ?? palette.surface);
  declare(vars, 'code-tabs-text', tabs.foreground ?? vars['--n0ct-text-muted']!);
  declare(vars, 'code-tabs-active-text', tabs.activeForeground ?? vars['--n0ct-text-primary']!);
  declare(vars, 'code-tabs-border', tabs.border ?? vars['--n0ct-border']!);

  declare(vars, 'gradient-monochrome', 'linear-gradient(125deg, var(--n0ct-primary-300), var(--n0ct-primary-500) 56%, var(--n0ct-primary-700))');
  declare(vars, 'gradient-accent', 'linear-gradient(125deg, var(--n0ct-accent-400), var(--n0ct-accent-600))');
  declare(vars, 'gradient-brand', 'linear-gradient(120deg, var(--n0ct-primary-500) 0%, var(--n0ct-primary-400) 56%, var(--n0ct-accent-500) 100%)');
  declare(vars, 'gradient-brand-soft', 'linear-gradient(120deg, color-mix(in srgb, var(--n0ct-primary-500) 12%, transparent), color-mix(in srgb, var(--n0ct-accent-500) 8%, transparent))');

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
    '--sl-color-accent-low': vars['--n0ct-accent-900']!,
    '--sl-color-accent': vars['--n0ct-accent-500']!,
    '--sl-color-accent-high': vars['--n0ct-accent-100']!,
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
