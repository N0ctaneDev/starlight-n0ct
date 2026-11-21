import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(packageRoot, 'bin', 'n0ct.mjs');
const tempRoot = await mkdtemp(join(packageRoot, '.n0ct-template-smoke-'));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' ' + args.join(' ') + ' failed with exit code ' + result.status);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function scaffold(name, template, extraArgs = []) {
  const directory = join(tempRoot, name);
  run(process.execPath, [
    cli, 'init', directory, '--yes', '--no-install', '--template', template, ...extraArgs,
  ], packageRoot);

  const configPath = join(directory, 'n0ct.config.mjs');
  const config = await readFile(configPath, 'utf8');
  assert.match(config, /(^|\n)\s*title:/);
  assert.doesNotMatch(config, /"title"\s*:/);
  assert.match(config, /defaultTheme:\s*["']n0ctane["']/);
  assert.match(config, /dracula:\s*\{/);
  assert.match(config, /\/favicons\/n0ctane\.svg/);
  assert.match(config, /icon:\s*['\"]lucide:book-open['\"]/);
  assert.match(config, /footer:\s*\{[\s\S]*?Built with Starlight-N0ct/);
  assert.doesNotMatch(config, /dropdownIcon/);
  assert.equal((await exists(join(directory, 'public', 'favicons', 'n0ctane.svg'))), true);
  assert.equal((await exists(join(directory, 'public', 'favicons', 'dracula.svg'))), true);
  assert.equal((await exists(join(directory, 'public', 'logos', 'n0ctane-dark.svg'))), true);
  run(process.execPath, ['--check', configPath], packageRoot);
  return directory;
}

async function attachLocalPackage(projectDirectory) {
  const path = join(projectDirectory, 'package.json');
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  pkg.dependencies['@n0ctanedev/starlight-n0ct'] = 'file:' + relative(projectDirectory, packageRoot);
  await writeFile(path, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

async function installAndBuild(projectDirectory) {
  await attachLocalPackage(projectDirectory);
  run('npm', ['install', '--no-audit', '--no-fund'], projectDirectory);
  run('npm', ['run', 'build'], projectDirectory);
}

try {
  for (const templateName of ['starter', 'blog']) {
    const templateConfig = await readFile(join(packageRoot, 'templates', templateName, 'n0ct.config.mjs'), 'utf8');
    assert.match(templateConfig, /footer:\s*\{/);
    assert.match(templateConfig, /Built with Starlight-N0ct/);
    assert.match(templateConfig, /icon:\s*['"]lucide:book-open['"]/);
    assert.doesNotMatch(templateConfig, /dropdownIcon/);
  }

  const starter = await scaffold('starter', 'starter');
  const blog = await scaffold('blog', 'blog', ['--blog-path', 'journal/releases']);
  const reverseOrder = await scaffold('reverse-order', 'starter');

  const blogConfig = await readFile(join(blog, 'n0ct.config.mjs'), 'utf8');
  assert.match(blogConfig, /prefix:\s*["']journal\/releases["']/);
  assert.match(blogConfig, /label:\s*['"]Blog['"],\s*link:\s*['"]\/journal\/releases\/['"]/);
  assert.match(blogConfig, /topicOptions:\s*\{\s*exclude:/);
  assert.equal(await exists(join(blog, 'src/content/docs/journal/releases/first-post.mdx')), true);
  assert.equal(await exists(join(blog, 'src/content/docs/blog')), false);
  const blogGuide = await readFile(join(blog, 'src/content/docs/getting-started.mdx'), 'utf8');
  assert.match(blogGuide, /src\/content\/docs\/journal\/releases\//);
  const blogReadme = await readFile(join(blog, 'README.md'), 'utf8');
  assert.match(blogReadme, /src\/content\/docs\/journal\/releases\//);
  const blogPost = await readFile(join(blog, 'src/content/docs/journal/releases/first-post.mdx'), 'utf8');
  assert.match(blogPost, /sidebar:\n\s+hidden: true/);

  // Exercise feature installation against a freshly generated docs-only project.
  const { addFeature } = await import(new URL('../bin/add-feature.mjs', import.meta.url));
  await addFeature({ feature: 'blog', directory: starter, blogPath: 'newsroom', install: false });
  await addFeature({ feature: 'versioning', directory: starter, versionSlug: '1.0.0', install: false });
  await addFeature({ feature: 'linksValidator', directory: starter, install: false });

  const upgradedConfig = await readFile(join(starter, 'n0ct.config.mjs'), 'utf8');
  assert.match(upgradedConfig, /prefix:\s*"newsroom"/);
  assert.match(upgradedConfig, /newsroom\/\*\*/);
  assert.match(upgradedConfig, /linksValidator:/);
  assert.ok(upgradedConfig.includes("path.includes(prefixPath + '/')"));
  assert.equal(await exists(join(starter, 'src/content/docs/newsroom/first-post.mdx')), true);
  const upgradedSchema = await readFile(join(starter, 'src/content.config.ts'), 'utf8');
  assert.match(upgradedSchema, /blogSchema/);
  assert.match(upgradedSchema, /docsVersionsLoader/);

  // Verify the reverse feature order: versioning first, then Blog.
  await addFeature({ feature: 'versioning', directory: reverseOrder, versionSlug: '2.0.0', install: false });
  await addFeature({ feature: 'linksValidator', directory: reverseOrder, install: false });
  await addFeature({ feature: 'blog', directory: reverseOrder, blogPath: 'journal', install: false });
  const reverseConfig = await readFile(join(reverseOrder, 'n0ct.config.mjs'), 'utf8');
  assert.ok(reverseConfig.includes('journal/**'));
  assert.ok(reverseConfig.includes('linksValidator: {'));
  assert.ok(reverseConfig.includes('isBlog'));

  await installAndBuild(starter);
  await installAndBuild(blog);

  console.log('Template smoke tests passed: starter, custom Blog path, post-init Blog/versioning/link validation, npm install, and Astro builds.');
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
