import type { N0ctThemeColors, N0ctThemeMode } from './types.js';

type Mode = 'dark' | 'light';
type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

const defaults: Record<Mode, Palette> = {
  dark: {
    primary: '#F25CFF', secondary: '#8C42FF', accent: '#00E5FF',
    surface: '#0D1020', background: '#0B0D17', text: '#E6EAF8',
    muted: '#7B88B8', success: '#06D6A0', warning: '#FFD166',
    danger: '#FF4D6D', info: '#FF9F1C',
  },
  light: {
    primary: '#C92FCF', secondary: '#7540CE', accent: '#00AFC2',
    surface: '#F3F1F8', background: '#F8F7FC', text: '#191629',
    muted: '#716B89', success: '#087F5B', warning: '#956000',
    danger: '#C12D4B', info: '#A85A00',
  },
};

function mixHex(first: string, second: string, amount: number): string {
  const parse = (hex: string) => {
    const value = hex.replace('#', '');
    const normalized = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
    if (!/^[\da-f]{6}$/i.test(normalized)) return [0, 0, 0];
    return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
  };
  const a = parse(first), b = parse(second);
  return '#' + a.map((channel, index) => Math.round(channel * (1 - amount) + b[index]! * amount).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function palette(mode: Mode, config?: N0ctThemeMode): Palette {
  const defaultsForMode = defaults[mode];
  const p = config?.palette ?? {};
  const semantic = config?.semantic ?? {};
  const overrides = config?.overrides ?? {};
  const dark = mode === 'dark';
  const pageSurfaceDefault = dark ? '#131626' : '#FFFFFF';
  const pageSurface = overrides.surfaces?.surface ?? p.surface ?? pageSurfaceDefault;
  const isDefaultPageSurface = pageSurface === pageSurfaceDefault;
  const codeSurface = overrides.code?.background ?? overrides.surfaces?.code
    ?? (isDefaultPageSurface ? defaultsForMode.surface : mixHex(pageSurface, dark ? '#000000' : '#111827', dark ? .28 : .04));
  const primary = overrides.brand?.primary ?? p.primary ?? defaultsForMode.primary;
  const accent = overrides.brand?.accent ?? p.accent ?? defaultsForMode.accent;
  const text = overrides.code?.foreground ?? overrides.text?.primary ?? p.text ?? defaultsForMode.text;
  const background = overrides.surfaces?.base ?? p.background ?? defaultsForMode.background;
  const customText = p.text !== undefined || overrides.text?.primary !== undefined;
  return {
    primary,
    secondary: overrides.brand?.secondary ?? p.secondary ?? (
      p.primary !== undefined || p.accent !== undefined
        ? mixHex(primary, accent, .5)
        : defaultsForMode.secondary
    ),
    accent,
    surface: codeSurface,
    background,
    text,
    muted: overrides.text?.muted ?? (customText ? mixHex(text, background, dark ? .29 : .30) : defaultsForMode.muted),
    success: semantic.success?.foreground ?? defaultsForMode.success,
    warning: semantic.warning?.foreground ?? defaultsForMode.warning,
    danger: semantic.danger?.foreground ?? defaultsForMode.danger,
    info: semantic.info?.foreground ?? defaultsForMode.info,
  };
}

function createTheme(mode: Mode, colors: Palette, config?: N0ctThemeMode) {
  const dark = mode === 'dark';
  const code = config?.overrides?.code ?? {};
  const codeBackground = colors.surface;
  const codeForeground = colors.text;
  const selection = code.selectionBackground ?? mixHex(colors.accent, codeBackground, dark ? .38 : .82);
  const lineHighlight = code.lineHighlight ?? mixHex(codeBackground, colors.accent, dark ? .12 : .06);
  const colorsMap = {
    'editor.background': code.background ?? codeBackground,
    'editor.foreground': code.foreground ?? codeForeground,
    'editorCursor.foreground': code.cursor ?? colors.accent,
    'editor.selectionBackground': selection,
    'editor.lineHighlightBackground': lineHighlight,
    'editorLineNumber.foreground': code.lineNumber ?? colors.muted,
    'editorLineNumber.activeForeground': code.lineNumberActive ?? codeForeground,
    'editorIndentGuide.background': mixHex(codeForeground, codeBackground, .88),
    'editorIndentGuide.activeBackground': mixHex(codeForeground, codeBackground, .72),
    'terminal.background': codeBackground,
    'terminal.foreground': codeForeground,
    'terminal.ansiBlack': colors.background,
    'terminal.ansiRed': colors.danger,
    'terminal.ansiGreen': colors.success,
    'terminal.ansiYellow': colors.warning,
    'terminal.ansiBlue': colors.accent,
    'terminal.ansiMagenta': colors.primary,
    'terminal.ansiCyan': colors.info,
    'terminal.ansiWhite': codeForeground,
  };
  const tokenColors = [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: colors.muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: colors.primary } },
    { scope: ['string', 'string.quoted', 'markup.inline.raw'], settings: { foreground: colors.success } },
    { scope: ['constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: colors.warning } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: colors.accent } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: colors.secondary } },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: codeForeground } },
    { scope: ['entity.name.tag', 'entity.name.section'], settings: { foreground: colors.accent } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: colors.primary } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: mixHex(codeForeground, codeBackground, .2) } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: dark ? '#FFFFFF' : '#FFFFFF', background: colors.danger } },
  ];
  return { name: dark ? 'N0ctane Night' : 'N0ctane Day', type: dark ? 'dark' : 'light', colors: colorsMap, tokenColors };
}

export function createN0ctaneCodeThemes(input?: N0ctThemeColors) {
  return [
    createTheme('dark', palette('dark', input?.dark), input?.dark),
    createTheme('light', palette('light', input?.light), input?.light),
  ] as const;
}
