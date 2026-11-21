import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pagePath = join(root, 'docs', 'dist', 'showcase', 'index.html');
const html = await readFile(pagePath, 'utf8');
const groups = (html.match(/class="scb-tabs"/g) ?? []).length;

if (groups === 0 || !html.includes('data-scb-control="tabs"') || !html.includes('data-scb-code-tabs=')) {
  throw new Error(
    'The built Showcase page does not contain a processed :::code-tabs group. ' +
    'Check that the active Markdown processor has the starlight-codeblocks directive plugin.',
  );
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

const outputFiles = await listFiles(join(root, 'docs', 'dist'));
const tabsModule = outputFiles.find((path) => /(?:^|[\\/])scb-code-tabs\.[\w-]+\.js$/.test(path));

if (!tabsModule) {
  throw new Error(
    'The code-tabs client module was not emitted into the demo build. ' +
    'Check that starlight-codeblocks has its codeTabs feature enabled.',
  );
}

// Verify the actual HTML output selects the matching topic sidebar on each
// topic landing page and preserves the Blog link injected by starlight-blog.
const topicSidebarChecks = [
  {
    page: 'components/index.html',
    required: ['/components/', '/components/callout/', '/components/kbd/', '/blog/'],
    forbidden: ['/guides/configuration/', '/reference/config-api/'],
  },
  {
    page: 'guides/index.html',
    required: ['/guides/', '/guides/configuration/', '/blog/'],
    forbidden: ['/components/callout/', '/reference/config-api/'],
  },
  {
    page: 'showcase/index.html',
    required: ['/showcase/', '/blog/'],
    forbidden: ['/components/callout/', '/reference/config-api/'],
  },
  {
    page: 'reference/index.html',
    required: ['/reference/', '/reference/config-api/', '/blog/'],
    forbidden: ['/guides/configuration/', '/components/callout/'],
  },
];

for (const check of topicSidebarChecks) {
  const pageHtml = await readFile(join(root, 'docs', 'dist', check.page), 'utf8');
  const nav = pageHtml.match(/<nav aria-label="Main navigation">([\\s\\S]*?)<\\/nav>/);

  if (!nav) {
    throw new Error(`[sidebar-topics] ${check.page} is missing its main navigation.`);
  }

  const hrefs = [...nav[1].matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const hasPath = (suffix) => hrefs.some((href) => href.endsWith(suffix));

  for (const path of check.required) {
    if (!hasPath(path)) {
      throw new Error(`[sidebar-topics] ${check.page} is missing expected sidebar link "${path}".`);
    }
  }

  for (const path of check.forbidden) {
    if (hasPath(path)) {
      throw new Error(`[sidebar-topics] ${check.page} incorrectly contains sidebar link "${path}".`);
    }
  }
}

console.log('[sidebar-topics] Verified topic-specific sidebars and preserved Blog links on all demo topic roots.');
