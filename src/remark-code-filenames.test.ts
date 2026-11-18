import { describe, expect, it } from 'vitest';
import { normalizeCodeFenceMeta } from './remark-code-filenames.js';

describe('filename shorthand in code fences', () => {
  it('turns a bare filename into an Expressive Code title', () => {
    expect(normalizeCodeFenceMeta('n0ct.config.mjs'))
      .toBe('title="n0ct.config.mjs"');
  });

  it('supports paths and dotfiles', () => {
    expect(normalizeCodeFenceMeta('src/content.config.ts'))
      .toBe('title="src/content.config.ts"');
    expect(normalizeCodeFenceMeta('.env'))
      .toBe('title=".env"');
  });

  it('preserves remaining Expressive Code metadata', () => {
    expect(normalizeCodeFenceMeta('astro.config.mjs {2-4}'))
      .toBe('title="astro.config.mjs" {2-4}');
  });

  it('does not rewrite explicit titles or ordinary metadata', () => {
    expect(normalizeCodeFenceMeta('title="vite.config.ts"'))
      .toBe('title="vite.config.ts"');
    expect(normalizeCodeFenceMeta('wrap'))
      .toBe('wrap');
    expect(normalizeCodeFenceMeta('npm install'))
      .toBe('npm install');
  });

  it('returns undefined for empty metadata', () => {
    expect(normalizeCodeFenceMeta('  ')).toBeUndefined();
  });
});
