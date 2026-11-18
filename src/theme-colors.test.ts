import { describe, expect, it } from 'vitest';
import { generateN0ctThemeCss, resolveN0ctThemeColors, validateN0ctThemeColors } from './theme-colors.js';

describe('semantic theme palettes', () => {
  it('provides purple-dark and blue-light defaults', () => {
    const theme = resolveN0ctThemeColors();
    expect(theme.dark.variables['--n0ct-primary-500']).toBe('#8C42FF');
    expect(theme.light.variables['--n0ct-primary-500']).toBe('#286DCE');
    expect(theme.dark.variables['--n0ct-accent-500']).toBe('#2A85FF');
    expect(theme.light.variables['--n0ct-accent-500']).toBe('#7540CE');
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

  it('warns when the configured text contrast is below WCAG AA guidance', () => {
    const warnings = validateN0ctThemeColors({
      dark: { palette: { background: '#FFFFFF', text: '#EEEEEE', highlight: '#FFFFFF', highlightText: '#EEEEEE' } },
    });
    expect(warnings.length).toBeGreaterThan(0);
  });
});
