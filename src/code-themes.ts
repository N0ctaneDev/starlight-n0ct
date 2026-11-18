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
    primary: '#8C42FF', secondary: '#6653BD', accent: '#2A85FF',
    surface: '#131626', background: '#0B0D17', text: '#E6EAF8',
    muted: '#7B88B8', success: '#43C995', warning: '#E8B95B',
    danger: '#EC7189', info: '#6DB9EA',
  },
  light: {
    primary: '#286DCE', secondary: '#4B79C8', accent: '#7540CE',
    surface: '#FFFFFF', background: '#F8F7FC', text: '#191629',
    muted: '#716B89', success: '#087F5B', warning: '#956000',
    danger: '#C12D4B', info: '#2867B1',
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
  const primary = overrides.brand?.primary ?? p.primary ?? defaultsForMode.primary;
  const accent = overrides.brand?.accent ?? p.accent ?? defaultsForMode.accent;
  const surface = overrides.code?.background ?? overrides.surfaces?.code ?? overrides.surfaces?.surface ?? p.surface ?? defaultsForMode.surface;
  const background = overrides.surfaces?.base ?? p.background ?? mixHex(surface, dark ? '#070812' : '#F8F7FC', dark ? .28 : .04);
  const text = overrides.code?.foreground ?? overrides.text?.primary ?? p.text ?? defaultsForMode.text;
  return {
    primary,
    secondary: overrides.brand?.secondary ?? p.secondary ?? mixHex(primary, accent, .5),
    accent,
    surface,
    background,
    text,
    muted: overrides.text?.muted ?? mixHex(text, background, dark ? .29 : .30),
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
  const selection = code.selectionBackground ?? mixHex(colors.accent, codeBackground, dark ? .48 : .82);
  const lineHighlight = code.lineHighlight ?? mixHex(colors.accent, codeBackground, dark ? .88 : .94);
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
