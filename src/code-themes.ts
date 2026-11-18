export function createN0ctaneCodeThemes() {
  const colors = {
    'editor.background': 'var(--n0ct-code-background)',
    'editor.foreground': 'var(--n0ct-code-foreground)',
    'editorCursor.foreground': 'var(--n0ct-code-cursor)',
    'editor.selectionBackground': 'var(--n0ct-code-selection-background)',
    'editor.lineHighlightBackground': 'var(--n0ct-code-line-highlight)',
    'editorLineNumber.foreground': 'var(--n0ct-code-line-number)',
    'editorLineNumber.activeForeground': 'var(--n0ct-code-line-number-active)',
    'editorIndentGuide.background': 'var(--n0ct-border-subtle)',
    'editorIndentGuide.activeBackground': 'var(--n0ct-border-strong)',
    'terminal.background': 'var(--n0ct-code-background)',
    'terminal.foreground': 'var(--n0ct-code-foreground)',
    'terminal.ansiBlack': 'var(--n0ct-base-void)',
    'terminal.ansiRed': 'var(--n0ct-danger)',
    'terminal.ansiGreen': 'var(--n0ct-success)',
    'terminal.ansiYellow': 'var(--n0ct-warning)',
    'terminal.ansiBlue': 'var(--n0ct-accent-500)',
    'terminal.ansiMagenta': 'var(--n0ct-primary-500)',
    'terminal.ansiCyan': 'var(--n0ct-info)',
    'terminal.ansiWhite': 'var(--n0ct-text-primary)',
  };
  const tokenColors = [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--n0ct-text-muted)', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: 'var(--n0ct-primary-400)' } },
    { scope: ['string', 'string.quoted', 'markup.inline.raw'], settings: { foreground: 'var(--n0ct-success-text)' } },
    { scope: ['constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: 'var(--n0ct-warning-text)' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: 'var(--n0ct-accent-400)' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: 'var(--n0ct-secondary-400)' } },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: 'var(--n0ct-code-foreground)' } },
    { scope: ['entity.name.tag', 'entity.name.section'], settings: { foreground: 'var(--n0ct-accent-400)' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: 'var(--n0ct-primary-300)' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: 'var(--n0ct-text-secondary)' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: 'var(--n0ct-text-inverse)', background: 'var(--n0ct-danger)' } },
  ];
  return [
    { name: 'N0ctane Night', type: 'dark', colors, tokenColors },
    { name: 'N0ctane Day', type: 'light', colors, tokenColors },
  ] as const;
}
