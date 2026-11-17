import { describe, expect, it, vi } from 'vitest';
import {
  createRemarkCodeFilenamesIntegration,
  remarkCodeFilenames,
} from './remark-code-filenames.js';

describe('remark code filename integration', () => {
  it('prepends the filename transformer and preserves existing remark plugins', () => {
    const existingPlugin = () => () => {};
    const updateConfig = vi.fn();
    const integration = createRemarkCodeFilenamesIntegration();

    integration.hooks['astro:config:setup']?.({
      config: {
        markdown: {
          remarkPlugins: [existingPlugin],
        },
      },
      updateConfig,
    } as never);

    expect(updateConfig).toHaveBeenCalledWith({
      markdown: {
        remarkPlugins: [remarkCodeFilenames, existingPlugin],
      },
    });
  });

  it('does not register the filename transformer twice', () => {
    const updateConfig = vi.fn();
    const integration = createRemarkCodeFilenamesIntegration();

    integration.hooks['astro:config:setup']?.({
      config: {
        markdown: {
          remarkPlugins: [remarkCodeFilenames],
        },
      },
      updateConfig,
    } as never);

    expect(updateConfig).not.toHaveBeenCalled();
  });
});
