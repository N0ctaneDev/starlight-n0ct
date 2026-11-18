import type { AstroIntegration } from 'astro';

type MdastNode = {
  type?: string;
  meta?: string | null;
  children?: MdastNode[];
};

type MarkdownProcessor = {
  name?: string;
  options?: {
    mdastPlugins?: unknown[];
    remarkPlugins?: unknown[];
  };
};

const SÄTTERI_PLUGIN_NAME = 'starlight-n0ct:code-filenames';

/**
 * Convert shorthand filename metadata into Expressive Code title syntax.
 * Existing Expressive Code metadata (title=, wrap, line markers, etc.) is
 * preserved unchanged.
 */
export function normalizeCodeFenceMeta(meta: string | null | undefined): string | undefined {
  if (!meta?.trim()) return undefined;

  const trimmed = meta.trim();
  if (/\btitle\s*=/.test(trimmed) || trimmed.startsWith('{')) return trimmed;

  const match = /^("(?:[^"\\]|\\.)*"|'[^']+'|[^\s]+)/.exec(trimmed);
  if (!match) return trimmed;

  const rawFilename = match[1];
  const filename = rawFilename?.replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => (
    doubleQuoted ?? singleQuoted ?? rawFilename
  ));

  if (!filename) return trimmed;

  // Avoid interpreting regular Expressive Code flags as filenames.
  if (/^(?:wrap|collapse|showLineNumbers|startLineNumber|diff|ins|del|mark|ln)\b/i.test(filename)) {
    return trimmed;
  }

  const looksLikeFilename = filename.startsWith('.')
    || filename.includes('/')
    || /\.[a-z\d]{1,12}$/i.test(filename);

  if (!looksLikeFilename) return trimmed;

  const remainder = trimmed.slice(match[0].length).trim();
  return 'title=' + JSON.stringify(filename) + (remainder ? ' ' + remainder : '');
}

function transformCodeFilenames(tree: MdastNode) {
  const visit = (node: MdastNode) => {
    if (node.type === 'code' && node.meta) {
      node.meta = normalizeCodeFenceMeta(node.meta) ?? node.meta;
    }

    for (const child of node.children ?? []) visit(child);
  };

  visit(tree);
}

/** Remark plugin for sites that explicitly configure Astro's Unified processor. */
export function remarkCodeFilenames() {
  return (tree: MdastNode) => transformCodeFilenames(tree);
}

/**
 * Native Sätteri plugin for Astro 7's default Markdown processor.
 * Keeping this in mdastPlugins avoids activating Astro's deprecated
 * markdown.remarkPlugins compatibility path, which can replace Sätteri.
 */
export function mdastCodeFilenames() {
  return {
    name: SÄTTERI_PLUGIN_NAME,
    before(tree: MdastNode) {
      transformCodeFilenames(tree);
    },
  };
}

/**
 * Register filename metadata normalization on the active Markdown processor.
 * Sätteri is Astro 7's default and is also the processor Starlight configures
 * its own directive handlers on. Only explicitly configured Unified sites
 * should receive a Remark plugin.
 */
export function createRemarkCodeFilenamesIntegration(): AstroIntegration {
  return {
    name: 'starlight-n0ct-code-filenames',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const processor = config.markdown.processor as unknown as MarkdownProcessor | undefined;
        const options = processor?.options;

        if (processor?.name === 'satteri' && options) {
          const plugins = options.mdastPlugins ?? (options.mdastPlugins = []);
          if (!plugins.some((plugin) => (
            typeof plugin === 'object'
            && plugin !== null
            && 'name' in plugin
            && plugin.name === SÄTTERI_PLUGIN_NAME
          ))) {
            plugins.push(mdastCodeFilenames());
          }
          return;
        }

        if (processor?.name === 'unified' && options) {
          const plugins = options.remarkPlugins ?? (options.remarkPlugins = []);
          if (!plugins.includes(remarkCodeFilenames)) plugins.unshift(remarkCodeFilenames);
          return;
        }

        logger.warn(
          'The configured Markdown processor ("' + (processor?.name ?? 'unknown') +
          '") does not expose a Sätteri or Unified plugin list. N0ctane filename shorthand will not be normalized.',
        );
      },
    },
  };
}
