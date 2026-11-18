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

console.log(
  `[code-tabs] Verified ${groups} rendered group(s) and client module ${relative(root, tabsModule)}.`,
);
