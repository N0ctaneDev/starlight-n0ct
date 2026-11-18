import type { N0ctThemeColors } from './types.js';
import { resolveN0ctThemeColors } from './theme-colors.js';

type Mode = 'dark' | 'light';

function createTheme(mode: Mode, variables: Record<string, string>) {
  const get = (name: string) => variables['--n0ct-' + name]!;
  const codeBackground = get('code-background');
  const codeForeground = get('code-foreground');

  const colors = {
    'editor.background': codeBackground,
    'editor.foreground': codeForeground,
    'editorCursor.foreground': get('code-cursor'),
    'editor.selectionBackground': get('code-selection-background'),
    'editor.lineHighlightBackground': get('code-line-highlight'),
    'editorLineNumber.foreground': get('code-line-number'),
    'editorLineNumber.activeForeground': get('code-line-number-active'),
    'editorIndentGuide.background': get('code-syntax-comment'),
    'editorIndentGuide.activeBackground': get('code-syntax-punctuation'),
    'terminal.background': codeBackground,
    'terminal.foreground': codeForeground,
    'terminal.ansiBlack': get('base'),
    'terminal.ansiRed': get('danger'),
    'terminal.ansiGreen': get('success'),
    'terminal.ansiYellow': get('warning'),
    'terminal.ansiBlue': get('accent-500'),
    'terminal.ansiMagenta': get('primary-500'),
    'terminal.ansiCyan': get('info'),
    'terminal.ansiWhite': codeForeground,
  };

  const tokenColors = [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: get('code-syntax-comment'), fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: get('code-syntax-keyword') } },
    { scope: ['string', 'string.quoted', 'markup.inline.raw'], settings: { foreground: get('code-syntax-string') } },
    { scope: ['constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: get('code-syntax-number') } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: get('code-syntax-function') } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: get('code-syntax-type') } },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: get('code-syntax-variable') } },
    { scope: ['entity.name.tag', 'entity.name.section'], settings: { foreground: get('code-syntax-tag') } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: get('code-syntax-attribute') } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: get('code-syntax-punctuation') } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#FFFFFF', background: get('danger') } },
  ];

  return {
    name: mode === 'dark' ? 'N0ctane Night' : 'N0ctane Day',
    type: mode,
    colors,
    tokenColors,
  };
}

export function createN0ctaneCodeThemes(input?: N0ctThemeColors) {
  const resolved = resolveN0ctThemeColors(input);
  return [
    createTheme('dark', resolved.dark.variables),
    createTheme('light', resolved.light.variables),
  ] as const;
}
