import { describe, expect, it } from 'vitest';
import { createN0ctaneCodeThemeSet } from './code-themes.js';
// @ts-ignore — the executable demo config is JavaScript and intentionally outside tsconfig's source include.
import demoConfig from '../n0ct.config.mjs';
import {
  generateN0ctThemeSetCss,
  resolveN0ctThemeConfig,
} from './theme-colors.js';

describe('named theme palettes', () => {
  const config = {
    defaultTheme: 'github',
    themes: {
      n0ctane: {
        label: 'N0ctane',
        colors: {
          dark: { palette: { primary: '#F25CFF', accent: '#00E5FF' } },
          light: { palette: { primary: '#B72DBF', accent: '#00AFC2' } },
        },
      },
      github: {
        label: 'GitHub',
        colors: {
          dark: { palette: { primary: '#4493F8', accent: '#3FB950' } },
          light: { palette: { primary: '#0969DA', accent: '#1A7F37' } },
        },
      },
    },
  } as const;

  it('resolves labels, palettes and the selected default theme', () => {
    const result = resolveN0ctThemeConfig(config);
    expect(result.defaultTheme).toBe('github');
    expect(result.themes.n0ctane?.label).toBe('N0ctane');
    expect(result.themes.github?.label).toBe('GitHub');
    expect(result.themes.github?.colors.dark?.palette?.primary).toBe('#4493F8');
  });

  it('registers every named palette in the demo config', () => {
    const result = resolveN0ctThemeConfig(demoConfig.theme);
    expect(Object.keys(result.themes)).toEqual([
      'n0ctane', 'github', 'catppuccin', 'rose-pine', 'dracula', 'nord', 'flexoki',
    ]);
    expect(result.themes.nord?.colors.dark?.palette?.primary).toBe('#88C0D0');
    expect(result.themes.flexoki?.colors.light?.palette?.primary).toBe('#BC5215');
  });

  it('keeps the legacy theme.colors API as the built-in N0ctane palette', () => {
    const result = resolveN0ctThemeConfig({
      colors: { dark: { palette: { primary: '#123456' } } },
    });
    expect(result.themes.n0ctane?.colors.dark?.palette?.primary).toBe('#123456');
  });

  it('rejects an unknown default theme and unsafe theme IDs', () => {
    expect(() => resolveN0ctThemeConfig({
      defaultTheme: 'missing',
      themes: { n0ctane: {} },
    })).toThrow(/does not match a key in theme.themes/);
    expect(() => resolveN0ctThemeConfig({
      themes: { 'GitHub Theme': {} },
    })).toThrow(/must start with a lowercase letter/);
  });

  it('generates separately scoped light and dark palette rules for every theme', () => {
    const css = generateN0ctThemeSetCss(config);
    expect(css).toContain(':root[data-n0ct-theme="n0ctane"]');
    expect(css).toContain(':root[data-n0ct-theme="n0ctane"][data-theme="dark"]');
    expect(css).toContain(':root[data-n0ct-theme="n0ctane"][data-theme="light"]');
    expect(css).toContain(':root[data-n0ct-theme="github"]');
    expect(css).toContain('--n0ct-primary-500: #4493F8');
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('creates a matching pair of Expressive Code themes per named palette', () => {
    const themes = createN0ctaneCodeThemeSet(config);
    expect(themes.map((theme) => theme.name)).toEqual([
      'n0ctane-dark',
      'n0ctane-light',
      'github-dark',
      'github-light',
    ]);
    expect(themes[2]?.colors['terminal.ansiBlue']).toBeTruthy();
  });
});
