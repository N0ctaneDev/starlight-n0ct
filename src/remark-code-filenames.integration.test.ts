import { describe, expect, it, vi } from 'vitest';
import {
  createRemarkCodeFilenamesIntegration,
  remarkCodeFilenames,
} from './remark-code-filenames.js';

type Processor = {
  name: string;
  options: {
    mdastPlugins?: unknown[];
    remarkPlugins?: unknown[];
  };
};

function runSetup(processor: Processor) {
  const logger = { warn: vi.fn() };
  const integration = createRemarkCodeFilenamesIntegration();

  integration.hooks['astro:config:setup']?.({
    config: { markdown: { processor } },
    logger,
  } as never);

  return logger;
}

describe('code filename Markdown integration', () => {
  it('registers a native mdast transformer on Astro 7 Sätteri', () => {
    const processor: Processor = {
      name: 'satteri',
      options: { mdastPlugins: [] },
    };

    const logger = runSetup(processor);

    expect(logger.warn).not.toHaveBeenCalled();
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
    expect(processor.options.remarkPlugins).toBeUndefined();
  });

  it('does not register the Sätteri transformer twice', () => {
    const processor: Processor = {
      name: 'satteri',
      options: { mdastPlugins: [] },
    };

    runSetup(processor);
    runSetup(processor);

    expect(processor.options.mdastPlugins).toHaveLength(1);
  });

  it('registers the Remark transformer only for an explicit Unified processor', () => {
    const existingPlugin = () => () => {};
    const processor: Processor = {
      name: 'unified',
      options: { remarkPlugins: [existingPlugin] },
    };

    const logger = runSetup(processor);

    expect(logger.warn).not.toHaveBeenCalled();
    expect(processor.options.remarkPlugins).toEqual([
      remarkCodeFilenames,
      existingPlugin,
    ]);
  });

  it('warns when a custom processor exposes neither supported plugin list', () => {
    const processor: Processor = {
      name: 'custom',
      options: {},
    };

    const logger = runSetup(processor);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not expose a Sätteri or Unified plugin list'),
    );
  });
});
