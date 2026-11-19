import { describe, expect, it } from 'vitest';
import { resolveBasePathHref } from './resolve-base-path.js';

describe('resolveBasePathHref', () => {
  it('keeps root-relative links unchanged when Astro base is /', () => {
    expect(resolveBasePathHref('/guides/', '/')).toBe('/guides/');
  });

  it('prefixes root-relative links with Astro base', () => {
    expect(resolveBasePathHref('/guides/', '/docs/')).toBe('/docs/guides/');
  });

  it('does not duplicate a base that is already present', () => {
    expect(resolveBasePathHref('/docs/guides/', '/docs/')).toBe('/docs/guides/');
    expect(resolveBasePathHref('/docs', '/docs/')).toBe('/docs');
  });

  it('does not rewrite external, protocol-relative, or fragment links', () => {
    expect(resolveBasePathHref('https://example.com/page', '/docs/')).toBe('https://example.com/page');
    expect(resolveBasePathHref('//cdn.example.com/page', '/docs/')).toBe('//cdn.example.com/page');
    expect(resolveBasePathHref('#section', '/docs/')).toBe('#section');
    expect(resolveBasePathHref('mailto:hello@example.com', '/docs/')).toBe('mailto:hello@example.com');
  });

  it('preserves query strings and fragments after the path', () => {
    expect(resolveBasePathHref('/search?q=astro#results', '/docs/')).toBe('/docs/search?q=astro#results');
  });
});
