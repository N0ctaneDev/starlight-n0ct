
import { access, cp, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');

async function findPackageRoot(entryUrl, expectedName) {
  if (!entryUrl.startsWith('file:')) {
    throw new Error(`[copy-assets] Cannot resolve ${expectedName} to a local package file: ${entryUrl}`);
  }

  let directory = dirname(fileURLToPath(entryUrl));
  const filesystemRoot = parse(directory).root;

  while (directory !== filesystemRoot) {
    try {
      const packageJson = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (packageJson.name === expectedName) return directory;
    } catch (error) {
      if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
    directory = dirname(directory);
  }

  throw new Error(`[copy-assets] Could not find the package root for ${expectedName} (resolved to ${entryUrl}).`);
}

async function resolvePackageRoot(packageName) {
  return findPackageRoot(import.meta.resolve(packageName), packageName);
}

try {
  await access(join(dist, 'index.js'));
} catch {
  throw new Error('[copy-assets] dist/index.js is missing. The tsup build must complete successfully before plugin assets can be copied.');
}

await mkdir(dist, { recursive: true });

// ------------------------------------------------------------
// Theme components and styles
// ------------------------------------------------------------

for (const directory of ['components', 'styles']) {
  const source = join(root, 'src', directory);
  const destination = join(dist, directory);

  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
}

// ------------------------------------------------------------
// starlight-scroll-to-top
//
// Its bundled integration resolves this asset relative to
// dist/index.js, so the file must be beside that bundle.
// ------------------------------------------------------------

const scrollPackage = await resolvePackageRoot('starlight-scroll-to-top');
const scrollAsset = join(scrollPackage, 'libs', 'scroll-to-top.js');
const copiedScrollAsset = join(dist, 'scroll-to-top.js');

try {
  await access(scrollAsset);
} catch {
  throw new Error(`[copy-assets] starlight-scroll-to-top asset was not found: ${scrollAsset}`);
}

await cp(scrollAsset, copiedScrollAsset, { force: true });
await access(copiedScrollAsset);

// ------------------------------------------------------------
// starlight-llms-txt
//
// Its integration registers route files relative to its own
// import.meta.url. Since the integration is bundled into
// dist/index.js, its route files must be copied beside it.
//
// Copy runtime files recursively, preserving relative paths.
// Do not copy the package's root index file: that integration
// is already included in dist/index.js.
// ------------------------------------------------------------

const llmsPackage = await resolvePackageRoot('starlight-llms-txt');

const runtimeExtensions = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.scss',
  '.sass',
  '.txt',
  '.svg',
  '.html',
  '.wasm',
]);

const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  '__tests__',
  'tests',
  'test',
  'coverage',
]);

async function copyLlmsRuntimeFiles(relativeDirectory = '') {
  const sourceDirectory = join(llmsPackage, relativeDirectory);
  const entries = await readdir(sourceDirectory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;

      await copyLlmsRuntimeFiles(relativePath);
      continue;
    }

    if (!entry.isFile()) continue;

    // The plugin integration itself is already bundled.
    // Never overwrite the theme's dist/index.js.
    const isRootEntrypoint =
      relativeDirectory === '' &&
      /^index\.(?:[cm]?[jt]s)$/.test(entry.name);

    if (isRootEntrypoint) continue;

    // Declaration files are not runtime modules.
    if (/\.d\.(?:ts|mts|cts|tsx)$/.test(entry.name)) continue;

    // Package metadata and documentation are not runtime assets.
    if (
      entry.name === 'package.json' ||
      /^(README|CHANGELOG|LICENSE|NOTICE)(?:\.|$)/i.test(entry.name)
    ) {
      continue;
    }

    if (!runtimeExtensions.has(extname(entry.name))) continue;

    const source = join(sourceDirectory, entry.name);
    const destination = join(dist, relativePath);

    await mkdir(dirname(destination), { recursive: true });

    // Fail on collisions rather than silently replacing theme files.
    await cp(source, destination, {
      force: false,
      errorOnExist: true,
    });
  }
}

await copyLlmsRuntimeFiles();

// ------------------------------------------------------------
// Build-time checks
// ------------------------------------------------------------

const requiredLlmsRoutes = [
  'llms-custom.txt.ts',
  'llms-full.txt.ts',
  'llms-small.txt.ts',
  'llms.txt.ts',
];

for (const file of requiredLlmsRoutes) {
  await access(join(dist, file));
}

console.log('[copy-assets] Theme components/styles, scroll-to-top asset, and LLMs.txt runtime files copied.');
