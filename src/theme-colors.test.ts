import { describe, expect, it } from 'vitest';
import { generateN0ctThemeCss, resolveN0ctThemeColors, validateN0ctThemeColors } from './theme-colors.js';
import { createN0ctaneCodeThemes } from './code-themes.js';

describe('semantic theme palettes', () => {
  it('preserves the original four-color N0ctane palette in both modes', () => {
    const theme = resolveN0ctThemeColors();
    expect(theme.dark.variables['--n0ct-primary-500']).toBe('#F25CFF');
    expect(theme.dark.variables['--n0ct-secondary-500']).toBe('#8C42FF');
    expect(theme.light.variables['--n0ct-primary-500']).toBe('#C92FCF');
    expect(theme.light.variables['--n0ct-secondary-500']).toBe('#7540CE');
    expect(theme.dark.variables['--n0ct-accent-500']).toBe('#00E5FF');
    expect(theme.dark.variables['--n0ct-highlight']).toBe('#2A85FF');
    expect(theme.light.variables['--n0ct-accent-500']).toBe('#00AFC2');
    expect(theme.light.variables['--n0ct-highlight']).toBe('#286DCE');
  });

  it('derives semantic role variables from four core palette colors', () => {
    const theme = resolveN0ctThemeColors({
      dark: { palette: { primary: '#112233', accent: '#445566', surface: '#101010', text: '#F0F0F0' } },
    });
    const vars = theme.dark.variables;
    expect(vars['--n0ct-primary-500']).toBe('#112233');
    expect(vars['--n0ct-accent-500']).toBe('#445566');
    expect(vars['--n0ct-surface']).toBe('#101010');
    expect(vars['--n0ct-text-primary']).toBe('#F0F0F0');
    expect(vars['--n0ct-secondary-500']).toBe('#2B3C4D');
    expect(vars['--n0ct-highlight']).toBe('#1B1F23');
    expect(vars['--n0ct-base']).toBe('#0D0E11');
    expect(vars['--n0ct-highlight-text']).toBe('#FFFFFF');
    expect(vars['--n0ct-success-bg']).toContain('color-mix');
    expect(vars['--n0ct-border-focus']).toBe('#445566');
  });

  it('supports independent semantic and role overrides in each mode', () => {
    const theme = resolveN0ctThemeColors({
      dark: {
        semantic: { success: { foreground: '#12AB78', background: '#102A22' } },
        overrides: {
          text: { primary: '#FAFAFA', muted: '#A0A0A0' },
          code: { diffAdded: { background: '#15382D', text: '#C7FFE9' } },
        },
      },
      light: { overrides: { surfaces: { base: '#FDFBFF' }, borders: { focus: '#123456' } } },
    });
    expect(theme.dark.variables['--n0ct-success']).toBe('#12AB78');
    expect(theme.dark.variables['--n0ct-success-bg']).toBe('#102A22');
    expect(theme.dark.variables['--n0ct-text-primary']).toBe('#FAFAFA');
    expect(theme.dark.variables['--n0ct-code-diff-added-bg']).toBe('#15382D');
    expect(theme.dark.variables['--n0ct-code-diff-added-text']).toBe('#C7FFE9');
    expect(theme.light.variables['--n0ct-base']).toBe('#FDFBFF');
    expect(theme.light.variables['--n0ct-border-focus']).toBe('#123456');
  });

  it('rejects invalid hex colors with the offending configuration path', () => {
    expect(() => resolveN0ctThemeColors({
      dark: { palette: { primary: 'purple' } },
    })).toThrow(/theme\.colors\.dark\.palette\.primary/);
  });

  it('generates separate dark and light root selectors', () => {
    const css = generateN0ctThemeCss();
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css).toContain(':root[data-theme="light"]');
    expect(css).toContain('--sl-color-bg-sidebar');
  });

  it('builds literal Expressive Code colors from the active palette', () => {
    const [dark, light] = createN0ctaneCodeThemes({
      dark: {
        palette: { primary: '#112233', accent: '#445566', surface: '#101010', text: '#F0F0F0' },
        overrides: {
          code: {
            background: '#090A0B',
            foreground: '#EFEFEF',
            cursor: '#ABCDEF',
            selectionBackground: '#123456',
            lineHighlight: '#111213',
            lineNumber: '#777777',
            lineNumberActive: '#EEEEEE',
          },
        },
      },
      light: { palette: { primary: '#123456', accent: '#654321', surface: '#FFFFFF', text: '#121212' } },
    });
    expect(dark.colors['editor.background']).toBe('#090A0B');
    expect(dark.colors['editor.foreground']).toBe('#EFEFEF');
    expect(dark.colors['editorCursor.foreground']).toBe('#ABCDEF');
    expect(dark.colors['editor.selectionBackground']).toBe('#123456');
    expect(dark.colors['editor.lineHighlightBackground']).toBe('#111213');
    expect(dark.colors['editorLineNumber.foreground']).toBe('#777777');
    expect(dark.colors['editorLineNumber.activeForeground']).toBe('#EEEEEE');
    expect(dark.colors['terminal.ansiGreen']).toBe('#43C995');
    expect(light.colors['editor.background']).toBe('#FFFFFF');
    expect(light.colors['editor.foreground']).toBe('#121212');
    expect(String(dark.colors['editor.background'])).not.toContain('var(');
  });

  it('warns when the configured text contrast is below WCAG AA guidance', () => {
    const warnings = validateN0ctThemeColors({
      dark: { palette: { background: '#FFFFFF', text: '#EEEEEE', highlight: '#FFFFFF', highlightText: '#EEEEEE' } },
    });
    expect(warnings.length).toBeGreaterThan(0);
  });
});
