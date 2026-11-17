import type { AstroIntegration } from 'astro';

type MdastNode = {
  type?: string;
  meta?: string | null;
  children?: MdastNode[];
};

/**
 * Convert the shorthand ` ```js n0ct.config.mjs ` metadata into the
 * Expressive Code `title="n0ct.config.mjs"` syntax.
 *
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
  return `title=${JSON.stringify(filename)}${remainder ? ` ${remainder}` : ''}`;
}

/** Remark plugin that adds Expressive Code titles for bare filename metadata. */
export function remarkCodeFilenames() {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (node.type === 'code' && node.meta) {
        node.meta = normalizeCodeFenceMeta(node.meta) ?? node.meta;
      }

      for (const child of node.children ?? []) visit(child);
    };

    visit(tree);
  };
}

/**
 * Register the filename-metadata transformer with Astro's Markdown pipeline.
 * Starlight's own `markdown` option intentionally only accepts Starlight
 * processing settings (headingLinks and processedDirs), so remark plugins
 * must be registered through an Astro integration instead.
 */
export function createRemarkCodeFilenamesIntegration(): AstroIntegration {
  return {
    name: 'starlight-n0ct-code-filenames',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const existingPlugins = config.markdown.remarkPlugins ?? [];

        if (existingPlugins.includes(remarkCodeFilenames)) return;

        updateConfig({
          markdown: {
            remarkPlugins: [remarkCodeFilenames, ...existingPlugins],
          },
        });
      },
    },
  };
}
