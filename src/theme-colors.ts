import type {
  N0ctThemeCodePalette,
  N0ctThemeColors,
  N0ctThemeConfig,
  N0ctThemeMode,
  N0ctThemePalette,
  N0ctThemeEffects,
} from './types.js';

export interface N0ctResolvedThemeMode {
  variables: Record<string, string>;
}
export interface N0ctResolvedTheme {
  dark: N0ctResolvedThemeMode;
  light: N0ctResolvedThemeMode;
}

type Mode = 'dark' | 'light';
type N0ctDefaultPalette = Required<N0ctThemePalette>;
type N0ctDefaultCodePalette = Required<Omit<N0ctThemeCodePalette, 'background' | 'foreground'>>;

const DEFAULTS: Record<Mode, N0ctDefaultPalette> = {
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
    primary: '#B72DBF',
    secondary: '#7540CE',
    accent: '#00AFC2',
    surface: '#FFFFFF',
    text: '#211D32',
    highlight: '#286DCE',
    highlightText: '#FFFFFF',
    background: '#F6F5FB',
  },
};

const DEFAULT_SURFACES = {
  dark: {
    void: '#080A15',
    elevated: '#20263D',
    navigation: '#131626',
    sidebar: '#131626',
    code: '#0D1020',
  },
  light: {
    void: '#FFFFFF',
    elevated: '#F0EDF7',
    navigation: '#FFFFFF',
    sidebar: '#F1EEF8',
    code: '#F3F1F8',
  },
} as const;

const DEFAULT_TEXT = {
  dark: { secondary: '#C1C8E3', muted: '#8793BA', subtle: '#687394', inverse: '#080A15' },
  light: { secondary: '#48445E', muted: '#69627E', subtle: '#89829A', inverse: '#FFFFFF' },
} as const;

const DEFAULT_BORDERS = {
  dark: { subtle: '#282C42', default: '#343B59', strong: '#59627F' },
  light: { subtle: '#E3DFEC', default: '#D5CFE2', strong: '#ADA5C0' },
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

const DEFAULT_CODE_PALETTE: Record<Mode, N0ctDefaultCodePalette> = {
  dark: {
    comment: '#A3AED1',
    keyword: '#FF8DD6',
    string: '#9FE6B8',
    number: '#FFD18A',
    function: '#79DDF8',
    type: '#BDAAFF',
    variable: '#E8ECFA',
    tag: '#72DCEB',
    attribute: '#F6A8D8',
    punctuation: '#C0CBE5',
    invalid: '#FF829A',
  },
  light: {
    comment: '#68627F',
    keyword: '#92247E',
    string: '#08764D',
    number: '#875400',
    function: '#00688F',
    type: '#5D3BA5',
    variable: '#29253D',
    tag: '#006F88',
    attribute: '#92266B',
    punctuation: '#514B64',
    invalid: '#B42345',
  },
};

const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;
const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const SHADE_MIX: Record<string, [string, number]> = {
  '50': ['white', 0.94], '100': ['white', 0.88], '200': ['white', 0.76],
  '300': ['white', 0.62], '400': ['white', 0.42], '500': ['seed', 0],
  '600': ['black', 0.13], '700': ['black', 0.27], '800': ['black', 0.42],
  '900': ['black', 0.58], '950': ['black', 0.72],
};

function normalizeHex(value: string, path: string): string {
  if (!HEX.test(value)) {
    throw new Error('N0ctane ' + path + ' must be a 3- or 6-digit hex color (received "' + value + '").');
  }
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

/** Calculate WCAG relative-luminance contrast between two hex colors. */
export function getN0ctContrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Pick the higher-contrast of white and near-black for a colored surface. */
export function getN0ctContrastText(background: string): string {
  return getN0ctContrastRatio('#FFFFFF', background) >= getN0ctContrastRatio('#10111A', background)
    ? '#FFFFFF'
    : '#10111A';
}

/** Mix two hex colors in sRGB and return a concrete hex result. */
export function mixN0ctHex(first: string, second: string, amountSecond: number): string {
  const amount = Math.min(1, Math.max(0, amountSecond));
  const a = rgb(first);
  const b = rgb(second);
  return '#' + a.map((channel, index) =>
    Math.round((channel * (1 - amount) + b[index]! * amount) * 255)
      .toString(16).padStart(2, '0'),
  ).join('').toUpperCase();
}

/** Produce a CSS color-mix expression for surfaces derived at runtime. */
function mixColor(first: string, second: string, amount: number): string {
  const percent = Math.round(amount * 100);
  return 'color-mix(in oklch, ' + first + ' ' + (100 - percent) + '%, ' + second + ' ' + percent + '%)';
}

function set(vars: Record<string, string>, key: string, value: string): void {
  vars['--n0ct-' + key] = value;
}

function normalizeCssEffect(value: string, path: string): string {
  const normalized = value.trim();
  if (
    !normalized ||
    /[;{}<>]/.test(normalized) ||
    /url\s*\(|expression\s*\(|javascript:/i.test(normalized)
  ) {
    throw new Error('N0ctane ' + path + ' must be a non-empty CSS value without declarations, URLs, or executable expressions.');
  }
  return normalized;
}

function resolveEffects(
  vars: Record<string, string>,
  input: N0ctThemeEffects | undefined,
  mode: Mode,
  primary: string,
  secondary: string,
  accent: string,
  highlight: string,
): void {
  const dark = mode === 'dark';
  const gradients: Required<NonNullable<N0ctThemeEffects['gradients']>> = {
    monochrome: 'linear-gradient(125deg, var(--n0ct-primary-300), var(--n0ct-primary-500) 56%, var(--n0ct-primary-700))',
    accent: 'linear-gradient(125deg, var(--n0ct-accent-400), var(--n0ct-accent-600))',
    brand: 'linear-gradient(125deg, var(--n0ct-primary-500) 0%, var(--n0ct-secondary-500) 38%, var(--n0ct-highlight) 70%, var(--n0ct-accent-500) 100%)',
    brandSoft: 'linear-gradient(125deg, color-mix(in srgb, var(--n0ct-primary-500) 18%, transparent), color-mix(in srgb, var(--n0ct-secondary-500) 12%, transparent) 45%, color-mix(in srgb, var(--n0ct-accent-500) 11%, transparent))',
    canvas: 'radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--n0ct-primary-500) var(--n0ct-glow-background-strength, 7%), transparent), transparent 34rem), radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--n0ct-accent-500) var(--n0ct-glow-accent-strength, 5%), transparent), transparent 38rem)',
    shimmer: 'linear-gradient(115deg, transparent 0%, color-mix(in srgb, var(--n0ct-primary-500) 10%, transparent) 35%, color-mix(in srgb, var(--n0ct-accent-500) 9%, transparent) 52%, transparent 75%)',
    callout: 'linear-gradient(125deg, color-mix(in srgb, var(--n0ct-accent-500) 8%, transparent), transparent 62%)',
    card: 'linear-gradient(145deg, color-mix(in srgb, var(--n0ct-secondary-500) 6%, transparent), transparent 58%)',
    cardHover: 'linear-gradient(145deg, color-mix(in srgb, var(--n0ct-secondary-500) 9%, transparent), transparent 58%)',
    steps: 'linear-gradient(135deg, color-mix(in srgb, var(--n0ct-secondary-500) 9%, transparent), transparent 54%), linear-gradient(315deg, color-mix(in srgb, var(--n0ct-accent-500) 6%, transparent), transparent 55%)',
    fileTree: 'linear-gradient(135deg, color-mix(in srgb, var(--n0ct-secondary-500) 7%, transparent), transparent 58%)',
    sidebar: 'linear-gradient(150deg, color-mix(in srgb, var(--n0ct-primary-500) 7%, transparent), transparent 43%), linear-gradient(320deg, color-mix(in srgb, var(--n0ct-highlight) 4%, transparent), transparent 48%)',
    sidebarActive: 'linear-gradient(100deg, color-mix(in srgb, var(--n0ct-primary-500) 17%, transparent), color-mix(in srgb, var(--n0ct-accent-500) 9%, transparent))',
    versionSelect: 'linear-gradient(120deg, color-mix(in srgb, var(--n0ct-primary-500) 7%, transparent), transparent 65%)',
    scrollbar: 'linear-gradient(180deg, var(--n0ct-primary-500), var(--n0ct-accent-500))',
    scrollbarHover: 'linear-gradient(180deg, var(--n0ct-primary-400), var(--n0ct-accent-400))',
    divider: 'linear-gradient(90deg, var(--n0ct-primary-500), var(--n0ct-secondary-500) 52%, var(--n0ct-accent-500))',
  };
  for (const [key, fallback] of Object.entries(gradients)) {
    const value = input?.gradients?.[key as keyof NonNullable<N0ctThemeEffects['gradients']>] ?? fallback;
    set(vars, 'gradient-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()), normalizeCssEffect(value, 'theme.effects.gradients.' + key));
  }

  const shadowColor = mixColor(primary, dark ? '#000000' : '#FFFFFF', dark ? 0.68 : 0.78);
  set(vars, 'shadow-color', shadowColor);
  const shadows: Required<NonNullable<N0ctThemeEffects['shadows']>> = {
    soft: '0 10px 34px color-mix(in srgb, var(--n0ct-shadow-color) 18%, transparent)',
    float: '0 16px 44px color-mix(in srgb, var(--n0ct-shadow-color) 30%, transparent)',
    callout: '0 5px 18px color-mix(in srgb, var(--n0ct-shadow-color) 12%, transparent)',
    card: '0 10px 30px color-mix(in srgb, var(--n0ct-shadow-color) 16%, transparent)',
    cardHover: '0 10px 28px color-mix(in srgb, var(--n0ct-shadow-color) 20%, transparent)',
    control: '0 2px 8px color-mix(in srgb, var(--n0ct-shadow-color) 10%, transparent)',
    popover: '0 12px 32px color-mix(in srgb, var(--n0ct-shadow-color) 32%, transparent)',
    sidebar: '8px 0 28px color-mix(in srgb, var(--n0ct-shadow-color) 11%, transparent)',
    wordmark: '0 0 .9rem color-mix(in srgb, var(--n0ct-primary-500) 42%, transparent)',
    step: '0 0 0 3px color-mix(in srgb, var(--n0ct-primary-500) 9%, transparent)',
  };
  for (const [key, fallback] of Object.entries(shadows)) {
    const value = input?.shadows?.[key as keyof NonNullable<N0ctThemeEffects['shadows']>] ?? fallback;
    set(vars, 'shadow-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()), normalizeCssEffect(value, 'theme.effects.shadows.' + key));
  }
  set(vars, 'steps-marker-text', getN0ctContrastText(primary));
  set(vars, 'steps-connector', mixColor(primary, highlight, dark ? 0.22 : 0.18));
}

function checkObject(value: unknown, path: string): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined || child === null) continue;
    if (typeof child === 'string') normalizeHex(child, path + '.' + key);
    else checkObject(child, path + '.' + key);
  }
}

/**
 * Prefix references as well as declarations. A mode-qualified token must remain
 * tied to its source palette even when the document switches color schemes.
 */
function namespaceValue(value: string, mode: Mode): string {
  return value.replace(/var\((--n0ct-[\w-]+)/g, (_match, name: string) => {
    if (name.startsWith('--n0ct-dark-') || name.startsWith('--n0ct-light-')) return 'var(' + name;
    return 'var(--n0ct-' + mode + '-' + name.slice('--n0ct-'.length);
  });
}

function resolveMode(mode: Mode, input?: N0ctThemeMode): N0ctResolvedThemeMode {
  const dark = mode === 'dark';
  const supplied = input?.palette ?? {};
  const overrides = input?.overrides ?? {};
  const codePalette = input?.codePalette ?? {};
  checkObject(supplied, 'theme.colors.' + mode + '.palette');
  checkObject(input?.semantic, 'theme.colors.' + mode + '.semantic');
  checkObject(codePalette, 'theme.colors.' + mode + '.codePalette');
  checkObject(overrides, 'theme.colors.' + mode + '.overrides');
  // Effects are CSS values, not hex colors; validate them separately before emitting CSS.
  if (input?.effects) {
    for (const [key, value] of Object.entries(input.effects.gradients ?? {})) {
      if (value) normalizeCssEffect(value, 'theme.colors.' + mode + '.effects.gradients.' + key);
    }
    for (const [key, value] of Object.entries(input.effects.shadows ?? {})) {
      if (value) normalizeCssEffect(value, 'theme.colors.' + mode + '.effects.shadows.' + key);
    }
  }

  const pageSurface = normalizeHex(
    supplied.surface ?? DEFAULTS[mode].surface,
    'theme.colors.' + mode + '.palette.surface',
  );
  const suppliedPrimary = supplied.primary ?? DEFAULTS[mode].primary;
  const suppliedAccent = supplied.accent ?? DEFAULTS[mode].accent;
  const palette: N0ctDefaultPalette = {
    ...DEFAULTS[mode],
    ...supplied,
    primary: normalizeHex(suppliedPrimary, 'theme.colors.' + mode + '.palette.primary'),
    secondary: normalizeHex(
      supplied.secondary ?? (supplied.primary !== undefined || supplied.accent !== undefined
        ? mixN0ctHex(suppliedPrimary, suppliedAccent, 0.5)
        : DEFAULTS[mode].secondary),
      'theme.colors.' + mode + '.palette.secondary',
    ),
    accent: normalizeHex(suppliedAccent, 'theme.colors.' + mode + '.palette.accent'),
    surface: pageSurface,
    text: normalizeHex(supplied.text ?? DEFAULTS[mode].text, 'theme.colors.' + mode + '.palette.text'),
    highlight: normalizeHex(
      supplied.highlight ?? (supplied.accent !== undefined || supplied.surface !== undefined
        ? mixN0ctHex(suppliedAccent, pageSurface, dark ? 0.78 : 0.88)
        : DEFAULTS[mode].highlight),
      'theme.colors.' + mode + '.palette.highlight',
    ),
    highlightText: normalizeHex(
      supplied.highlightText ?? (supplied.highlight !== undefined
        ? getN0ctContrastText(supplied.highlight)
        : supplied.accent !== undefined || supplied.surface !== undefined
          ? getN0ctContrastText(mixN0ctHex(suppliedAccent, pageSurface, dark ? 0.78 : 0.88))
          : DEFAULTS[mode].highlightText),
      'theme.colors.' + mode + '.palette.highlightText',
    ),
    background: normalizeHex(
      supplied.background ?? (supplied.surface !== undefined
        ? mixN0ctHex(pageSurface, dark ? '#070812' : '#F8F7FC', dark ? 0.28 : 0.04)
        : DEFAULTS[mode].background),
      'theme.colors.' + mode + '.palette.background',
    ),
  };

  const primary = normalizeHex(
    overrides.brand?.primary ?? palette.primary,
    'theme.colors.' + mode + '.overrides.brand.primary',
  );
  const accent = normalizeHex(
    overrides.brand?.accent ?? palette.accent,
    'theme.colors.' + mode + '.overrides.brand.accent',
  );
  const secondary = normalizeHex(
    overrides.brand?.secondary ?? (supplied.secondary !== undefined
      ? palette.secondary
      : overrides.brand?.primary !== undefined || overrides.brand?.accent !== undefined
        ? mixN0ctHex(primary, accent, 0.5)
        : palette.secondary),
    'theme.colors.' + mode + '.overrides.brand.secondary',
  );
  const surface = normalizeHex(
    overrides.surfaces?.surface ?? palette.surface,
    'theme.colors.' + mode + '.overrides.surfaces.surface',
  );
  const textPrimary = normalizeHex(
    overrides.text?.primary ?? palette.text,
    'theme.colors.' + mode + '.overrides.text.primary',
  );
  const highlight = normalizeHex(
    overrides.highlight?.background ?? overrides.brand?.highlight ?? palette.highlight,
    'theme.colors.' + mode + '.overrides.highlight.background',
  );
  const highlightText = normalizeHex(
    overrides.highlight?.text ?? overrides.brand?.highlightText ?? (
      overrides.highlight?.background !== undefined || overrides.brand?.highlight !== undefined
        ? getN0ctContrastText(highlight)
        : palette.highlightText
    ),
    'theme.colors.' + mode + '.overrides.highlight.text',
  );

  const vars: Record<string, string> = {};
  for (const [family, seed] of Object.entries({ primary, secondary, accent })) {
    const normalized = normalizeHex(seed, 'theme.colors.' + mode + '.palette.' + family);
    for (const step of SHADE_STEPS) {
      const [target, amount] = SHADE_MIX[step]!;
      const value = target === 'seed'
        ? normalized
        : mixColor(normalized, target, amount);
      set(vars, family + '-' + step, value);
    }
    set(vars, family, normalized);
  }

  const base = normalizeHex(
    overrides.surfaces?.base ?? palette.background,
    'theme.colors.' + mode + '.overrides.surfaces.base',
  );
  const hasCustomSurface = supplied.surface !== undefined || supplied.background !== undefined
    || overrides.surfaces?.base !== undefined || overrides.surfaces?.surface !== undefined;
  const hasCustomText = supplied.text !== undefined || overrides.text?.primary !== undefined;
  const defaults = DEFAULT_SURFACES[mode];

  const baseVoid = overrides.surfaces?.void ?? (hasCustomSurface
    ? dark ? mixColor(base, '#000000', 0.34) : '#FFFFFF'
    : defaults.void);
  const elevated = overrides.surfaces?.elevated ?? (hasCustomSurface
    ? dark ? mixColor(surface, '#FFFFFF', 0.075) : mixColor(surface, '#111827', 0.035)
    : defaults.elevated);
  const sunken = overrides.surfaces?.sunken ?? (dark
    ? mixColor(base, '#000000', 0.12)
    : mixColor(base, surface, 0.46));
  const overlay = overrides.surfaces?.overlay ?? (hasCustomSurface
    ? dark ? mixColor(elevated, base, 0.22) : mixColor(elevated, '#FFFFFF', 0.38)
    : dark ? mixColor(elevated, base, 0.22) : '#FFFFFF');
  const navigation = overrides.surfaces?.navigation ?? (hasCustomSurface
    ? dark ? mixColor(surface, base, 0.3) : mixColor(surface, base, 0.22)
    : defaults.navigation);
  const sidebar = overrides.surfaces?.sidebar ?? (hasCustomSurface
    ? dark ? mixColor(surface, base, 0.38) : mixColor(surface, base, 0.32)
    : defaults.sidebar);
  const codeBackground = normalizeHex(
    overrides.code?.background ?? codePalette.background ?? overrides.surfaces?.code ?? defaults.code,
    'theme.colors.' + mode + '.codePalette.background',
  );

  const surfaceRoles: Record<string, string> = {
    'base-void': baseVoid,
    base,
    surface,
    'surface-elevated': elevated,
    'surface-sunken': sunken,
    'surface-overlay': overlay,
    'surface-navigation': navigation,
    'surface-sidebar': sidebar,
    'surface-code': codeBackground,
  };
  for (const [key, value] of Object.entries(surfaceRoles)) set(vars, key, value);

  const defaultText = DEFAULT_TEXT[mode];
  const textSecondary = overrides.text?.secondary ?? (hasCustomText
    ? mixColor(textPrimary, base, dark ? 0.12 : 0.10)
    : defaultText.secondary);
  const textMuted = overrides.text?.muted ?? (hasCustomText
    ? mixColor(textPrimary, base, dark ? 0.29 : 0.30)
    : defaultText.muted);
  const textSubtle = overrides.text?.subtle ?? (hasCustomText
    ? mixColor(textPrimary, base, dark ? 0.46 : 0.48)
    : defaultText.subtle);
  const textAccent = overrides.text?.accent ?? (dark
    ? mixColor(primary, '#FFFFFF', 0.18)
    : mixColor(primary, '#000000', 0.27));
  const textInverse = overrides.text?.inverse ?? (hasCustomSurface
    ? getN0ctContrastText(surface)
    : defaultText.inverse);
  const textRoles: Record<string, string> = {
    'text-primary': textPrimary,
    'text-secondary': textSecondary,
    'text-muted': textMuted,
    'text-subtle': textSubtle,
    'text-inverse': textInverse,
    'text-accent': textAccent,
    'text-highlight': overrides.text?.highlight ?? highlightText,
    'text-on-accent': overrides.text?.onAccent ?? getN0ctContrastText(accent),
  };
  for (const [key, value] of Object.entries(textRoles)) set(vars, key, value);

  const defaultBorders = DEFAULT_BORDERS[mode];
  const hasCustomBorders = hasCustomSurface || hasCustomText;
  const borderRoles: Record<string, string> = {
    'border-subtle': overrides.borders?.subtle ?? (
      hasCustomBorders ? mixColor(textPrimary, base, dark ? 0.91 : 0.90) : defaultBorders.subtle
    ),
    border: overrides.borders?.default ?? (
      hasCustomBorders ? mixColor(textPrimary, base, dark ? 0.80 : 0.83) : defaultBorders.default
    ),
    'border-strong': overrides.borders?.strong ?? (
      hasCustomBorders ? mixColor(textPrimary, base, dark ? 0.65 : 0.70) : defaultBorders.strong
    ),
    'border-focus': overrides.borders?.focus ?? accent,
  };
  for (const [key, value] of Object.entries(borderRoles)) set(vars, key, value);

  set(vars, 'interactive-hover', mixColor(accent, surface, dark ? 0.88 : 0.92));
  set(vars, 'interactive-active', mixColor(accent, surface, dark ? 0.78 : 0.84));
  set(vars, 'interactive-selected', mixColor(primary, surface, dark ? 0.84 : 0.90));

  set(vars, 'highlight', highlight);
  set(vars, 'highlight-text', highlightText);
  set(vars, 'highlight-border', mixColor(highlight, surface, 0.48));
  set(vars, 'selection-background', vars['--n0ct-primary-300']!);
  set(vars, 'selection-text', baseVoid);

  for (const semantic of ['success', 'warning', 'danger', 'info'] as const) {
    const config = input?.semantic?.[semantic] ?? {};
    const foreground = normalizeHex(
      config.foreground ?? SEMANTIC_DEFAULTS[mode][semantic],
      'theme.colors.' + mode + '.semantic.' + semantic + '.foreground',
    );
    const background = config.background ?? mixColor(foreground, surface, dark ? 0.86 : 0.90);
    const border = config.border ?? mixColor(foreground, surface, 0.56);
    set(vars, semantic, foreground);
    set(vars, semantic + '-text', config.text ?? foreground);
    set(vars, semantic + '-bg', background);
    set(vars, semantic + '-border', border);
  }

  for (const [key, value] of Object.entries(overrides.interactive ?? {})) {
    if (value) set(vars, 'interactive-' + key, value);
  }
  for (const [key, value] of Object.entries(overrides.highlight ?? {})) {
    if (!value) continue;
    const target = key === 'background' ? 'highlight'
      : key === 'text' ? 'highlight-text'
        : key === 'selectionBackground' ? 'selection-background'
          : key === 'selectionText' ? 'selection-text'
            : key === 'border' ? 'highlight-border'
              : key;
    set(vars, target, value);
  }

  const codeOverrides = overrides.code ?? {};
  const codeForeground = normalizeHex(
    codeOverrides.foreground ?? codePalette.foreground ?? textPrimary,
    'theme.colors.' + mode + '.codePalette.foreground',
  );
  set(vars, 'code-background', codeBackground);
  set(vars, 'code-foreground', codeForeground);
  set(vars, 'code-cursor', codeOverrides.cursor ?? accent);
  set(vars, 'code-selection-background', codeOverrides.selectionBackground ?? mixN0ctHex(accent, codeBackground, dark ? 0.38 : 0.82));
  set(vars, 'code-line-highlight', codeOverrides.lineHighlight ?? mixN0ctHex(codeBackground, accent, dark ? 0.12 : 0.06));
  set(vars, 'code-line-number', codeOverrides.lineNumber ?? (dark ? '#687394' : '#89829A'));
  set(vars, 'code-line-number-active', codeOverrides.lineNumberActive ?? codeForeground);

  for (const key of Object.keys(DEFAULT_CODE_PALETTE[mode]) as Array<keyof N0ctDefaultCodePalette>) {
    const value = codePalette[key] ?? DEFAULT_CODE_PALETTE[mode][key];
    set(vars, 'code-syntax-' + key, normalizeHex(value, 'theme.colors.' + mode + '.codePalette.' + key));
  }

  set(vars, 'code-diff-added-bg', codeOverrides.diffAdded?.background ?? vars['--n0ct-success-bg']!);
  set(vars, 'code-diff-added-text', codeOverrides.diffAdded?.text ?? codeOverrides.diffAdded?.foreground ?? vars['--n0ct-success-text']!);
  set(vars, 'code-diff-added-border', codeOverrides.diffAdded?.border ?? vars['--n0ct-success']!);
  set(vars, 'code-diff-removed-bg', codeOverrides.diffRemoved?.background ?? vars['--n0ct-danger-bg']!);
  set(vars, 'code-diff-removed-text', codeOverrides.diffRemoved?.text ?? codeOverrides.diffRemoved?.foreground ?? vars['--n0ct-danger-text']!);
  set(vars, 'code-diff-removed-border', codeOverrides.diffRemoved?.border ?? vars['--n0ct-danger']!);

  const tabs = codeOverrides.tabs ?? {};
  set(vars, 'code-tabs-bg', tabs.background ?? elevated);
  set(vars, 'code-tabs-active-bg', tabs.activeBackground ?? surface);
  set(vars, 'code-tabs-text', tabs.foreground ?? vars['--n0ct-text-muted']!);
  set(vars, 'code-tabs-active-text', tabs.activeForeground ?? vars['--n0ct-text-primary']!);
  set(vars, 'code-tabs-border', tabs.border ?? vars['--n0ct-border']!);

  resolveEffects(vars, input?.effects, mode, primary, secondary, accent, highlight);
  set(vars, 'nav-glass', mixColor(navigation, base, 0.12));
  set(vars, 'file-selected-bg', highlight);
  set(vars, 'file-selected-text', highlightText);

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

  for (const [name, value] of Object.entries({ ...vars })) {
    if (!name.startsWith('--n0ct-') || name.startsWith('--n0ct-dark-') || name.startsWith('--n0ct-light-')) continue;
    const suffix = name.slice('--n0ct-'.length);
    vars['--n0ct-' + mode + '-' + suffix] = namespaceValue(value, mode);
  }

  return { variables: vars };
}

export function resolveN0ctThemeColors(input?: N0ctThemeColors): N0ctResolvedTheme {
  return {
    dark: resolveMode('dark', input?.dark),
    light: resolveMode('light', input?.light),
  };
}

export function generateN0ctThemeCss(input?: N0ctThemeColors): string {
  const resolved = resolveN0ctThemeColors(input);
  const declarations = (variables: Record<string, string>) => Object.entries(variables)
    .map(([name, value]) => name + ': ' + value + ';')
    .join('\n  ');
  const active = (variables: Record<string, string>) => Object.fromEntries(
    Object.entries(variables).filter(([name]) => !/^--n0ct-(?:dark|light)-/.test(name)),
  );
  const root = {
    ...Object.fromEntries(Object.entries(resolved.dark.variables).filter(([name]) => name.startsWith('--n0ct-dark-'))),
    ...Object.fromEntries(Object.entries(resolved.light.variables).filter(([name]) => name.startsWith('--n0ct-light-'))),
    ...active(resolved.dark.variables),
  };
  return [
    ':root { color-scheme: dark;\n  ' + declarations(root) + '\n}',
    ':root[data-theme="dark"] { color-scheme: dark;\n  ' + declarations(active(resolved.dark.variables)) + '\n}',
    ':root[data-theme="light"] { color-scheme: light;\n  ' + declarations(active(resolved.light.variables)) + '\n}',
  ].join('\n\n') + '\n';
}

export function validateN0ctThemeColors(input?: N0ctThemeColors): string[] {
  const warnings: string[] = [];
  for (const mode of ['dark', 'light'] as const) {
    const variables = resolveMode(mode, input?.[mode]).variables;
    const ratio = getN0ctContrastRatio(variables['--n0ct-text-primary']!, variables['--n0ct-base']!);
    if (ratio < 4.5) {
      warnings.push('N0ctane theme.colors.' + mode + '.palette.text has a contrast ratio of ' + ratio.toFixed(2) + ':1 against its page background; 4.5:1 is recommended for body text.');
    }
    if (getN0ctContrastRatio(variables['--n0ct-highlight-text']!, variables['--n0ct-highlight']!) < 4.5) {
      warnings.push('N0ctane theme.colors.' + mode + '.palette.highlightText may not have sufficient contrast against palette.highlight.');
    }
    if (getN0ctContrastRatio(variables['--n0ct-code-foreground']!, variables['--n0ct-code-background']!) < 4.5) {
      warnings.push('N0ctane theme.colors.' + mode + '.codePalette.foreground may not have sufficient contrast against codePalette.background.');
    }
    for (const key of Object.keys(DEFAULT_CODE_PALETTE[mode]) as Array<keyof N0ctDefaultCodePalette>) {
      if (getN0ctContrastRatio(variables['--n0ct-code-syntax-' + key]!, variables['--n0ct-code-background']!) < 4.5) {
        warnings.push('N0ctane theme.colors.' + mode + '.codePalette.' + key + ' may not have sufficient contrast against codePalette.background.');
      }
    }
  }
  return warnings;
}


export interface N0ctResolvedNamedTheme {
  label: string;
  colors: N0ctThemeColors;
}

export interface N0ctResolvedThemeConfig {
  defaultTheme: string;
  themes: Record<string, N0ctResolvedNamedTheme>;
}

function titleCaseThemeId(id: string): string {
  return id.split(/[-_]+/).filter(Boolean).map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1),
  ).join(' ');
}

/**
 * Normalize the public named-theme configuration.
 * The legacy `theme.colors` shape continues to configure the built-in
 * `n0ctane` theme when no explicit `themes.n0ctane` entry is provided.
 */
export function resolveN0ctThemeConfig(input?: N0ctThemeConfig): N0ctResolvedThemeConfig {
  const source = input?.themes ?? {};
  const themes: Record<string, N0ctResolvedNamedTheme> = {};

  for (const [id, definition] of Object.entries(source)) {
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
      throw new Error('N0ctane theme.themes key "' + id + '" must start with a lowercase letter and contain only lowercase letters, numbers, hyphens, and underscores.');
    }
    const label = definition.label?.trim() || titleCaseThemeId(id);
    themes[id] = {
      label,
      colors: definition.colors ?? (id === 'n0ctane' ? input?.colors ?? {} : {}),
    };
  }

  if (!themes.n0ctane) {
    themes.n0ctane = {
      label: 'N0ctane',
      colors: input?.colors ?? {},
    };
  }

  const defaultTheme = input?.defaultTheme ?? 'n0ctane';
  if (!themes[defaultTheme]) {
    throw new Error(
      'N0ctane theme.defaultTheme "' + defaultTheme +
      '" does not match a key in theme.themes.',
    );
  }

  return { defaultTheme, themes };
}

/**
 * Generate palette CSS for all named themes. Site colors use
 * data-n0ct-theme="<id>" while light/dark appearance remains in data-theme.
 * This keeps palette selection independent from the two-state appearance toggle.
 */
export function generateN0ctThemeSetCss(input?: N0ctThemeConfig): string {
  const themeSet = resolveN0ctThemeConfig(input);
  const declarations = (variables: Record<string, string>) => Object.entries(variables)
    .map(([name, value]) => name + ': ' + value + ';')
    .join('\n  ');
  const active = (variables: Record<string, string>) => Object.fromEntries(
    Object.entries(variables).filter(([name]) => !/^--n0ct-(?:dark|light)-/.test(name)),
  );
  const qualified = (dark: Record<string, string>, light: Record<string, string>) => ({
    ...Object.fromEntries(Object.entries(dark).filter(([name]) => name.startsWith('--n0ct-dark-'))),
    ...Object.fromEntries(Object.entries(light).filter(([name]) => name.startsWith('--n0ct-light-'))),
  });
  const blocks: string[] = [];

  for (const [id, definition] of Object.entries(themeSet.themes)) {
    const resolved = resolveN0ctThemeColors(definition.colors);
    const dark = resolved.dark.variables;
    const light = resolved.light.variables;
    const themeScope = ':root[data-n0ct-theme="' + id + '"]';

    blocks.push(
      themeScope + ' { color-scheme: dark;\n  ' +
      declarations({ ...qualified(dark, light), ...active(dark) }) + '\n}',
      themeScope + '[data-theme="dark"] { color-scheme: dark;\n  ' +
      declarations(active(dark)) + '\n}',
      themeScope + '[data-theme="light"] { color-scheme: light;\n  ' +
      declarations(active(light)) + '\n}',
    );
  }

  const fallback = resolveN0ctThemeColors(themeSet.themes[themeSet.defaultTheme]!.colors);
  blocks.unshift(
    ':root { color-scheme: dark;\n  ' +
    declarations({
      ...qualified(fallback.dark.variables, fallback.light.variables),
      ...active(fallback.dark.variables),
    }) + '\n}',
  );

  return blocks.join('\n\n') + '\n';
}
