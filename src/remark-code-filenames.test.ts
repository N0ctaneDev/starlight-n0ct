import { describe, expect, it } from 'vitest';
import {
  createRemarkCodeFilenamesIntegration,
  normalizeCodeFenceMeta,
} from './remark-code-filenames.js';

type MarkdownProcessor = {
  name: string;
  options: {
    mdastPlugins?: unknown[];
    remarkPlugins?: unknown[];
  };
};

type ConfigSetupHook = (params: {
  config: { markdown: { processor: MarkdownProcessor } };
  logger: { warn(message: string): void };
}) => void;

function configure(processor: MarkdownProcessor) {
  const warnings: string[] = [];
  const integration = createRemarkCodeFilenamesIntegration();
  const hook = integration.hooks['astro:config:setup'] as unknown as ConfigSetupHook;
  hook({
    config: { markdown: { processor } },
    logger: { warn: (message) => warnings.push(message) },
  });
  return warnings;
}

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

  it('registers a native mdast plugin on Astro 7 Sätteri without using legacy remarkPlugins', () => {
    const processor: MarkdownProcessor = {
      name: 'satteri',
      options: { mdastPlugins: [] },
    };

    expect(configure(processor)).toEqual([]);
    expect(processor.options.mdastPlugins).toHaveLength(1);

    const plugin = processor.options.mdastPlugins?.[0] as {
      name: string;
      before(tree: { children?: Array<{ type?: string; meta?: string }> }): void;
    };
    expect(plugin.name).toBe('starlight-n0ct:code-filenames');

    const tree = {
      type: 'root',
      children: [{ type: 'code', meta: 'n0ct.config.mjs' }],
    };
    plugin.before(tree);
    expect(tree.children[0].meta).toBe('title="n0ct.config.mjs"');

    // Re-entering config setup must not append a duplicate plugin.
    configure(processor);
    expect(processor.options.mdastPlugins).toHaveLength(1);
    expect(processor.options.remarkPlugins).toBeUndefined();
  });

  it('registers the Remark plugin only when Unified is explicitly configured', () => {
    const processor: MarkdownProcessor = {
      name: 'unified',
      options: { remarkPlugins: [] },
    };

    expect(configure(processor)).toEqual([]);
    expect(processor.options.remarkPlugins).toHaveLength(1);

    const plugin = processor.options.remarkPlugins?.[0] as () => (
      tree: { children?: Array<{ type?: string; meta?: string }> }
    ) => void;
    const tree = {
      type: 'root',
      children: [{ type: 'code', meta: 'src/content.config.ts' }],
    };
    plugin()(tree);
    expect(tree.children[0].meta).toBe('title="src/content.config.ts"');
  });

  it('warns instead of silently mutating an unsupported Markdown processor', () => {
    const processor: MarkdownProcessor = { name: 'custom', options: {} };
    expect(configure(processor)).toEqual([
      expect.stringContaining('does not expose a Sätteri or Unified plugin list'),
    ]);
  });
});
