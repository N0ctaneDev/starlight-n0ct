import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageData = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const integrationNames = ['basePath', 'announcement', 'kbd', 'llmsTxt', 'scrollToTop', 'llmActions', 'sidebarSwipe', 'linksValidator', 'imageZoom'];

function skipString(text, start) {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') i += 1;
    else if (text[i] === quote) return i + 1;
  }
  throw new Error('Unterminated string in n0ct.config.mjs.');
}

function findEnd(text, start, limit, opening) {
  const closing = opening === '{' ? '}' : opening === '[' ? ']' : ')';
  let depth = 0;
  for (let i = start; i < limit; i += 1) {
    const c = text[i];
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) i = skipString(text, i) - 1;
    else if (c === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i + 2);
      if (i < 0) return limit;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated comment in n0ct.config.mjs.');
      i = end + 1;
    } else if (c === opening) depth += 1;
    else if (c === closing && --depth === 0) return i;
  }
  return -1;
}

function skipTrivia(text, start) {
  let i = start;
  while (i < text.length) {
    if (/\s/.test(text[i])) i += 1;
    else if (text[i] === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i + 2);
      if (i < 0) return text.length;
    } else if (text[i] === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated comment in n0ct.config.mjs.');
      i = end + 2;
    } else break;
  }
  return i;
}

function expressionEnd(text, start, limit) {
  const stack = [];
  for (let i = start; i < limit; i += 1) {
    const c = text[i];
    if (c === "'" || c === '"' || c.charCodeAt(0) === 96) i = skipString(text, i) - 1;
    else if (c === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i + 2);
      if (i < 0 || i >= limit) return limit;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated comment in n0ct.config.mjs.');
      i = end + 1;
    } else if (c === '{' || c === '[' || c === '(') stack.push(c);
    else if (c === '}' || c === ']' || c === ')') {
      if (!stack.length) return i;
      stack.pop();
    } else if (c === ',' && !stack.length) return i;
  }
  return limit;
}

function rootObject(text) {
  const match = /(?:const|let|var)\s+config\s*=\s*\{/.exec(text);
  if (!match) throw new Error('Expected a plain "const config = { ... }" in n0ct.config.mjs. Custom JavaScript configs must be updated manually.');
  return text.indexOf('{', match.index);
}

function getProperty(text, start, key) {
  if (start < 0 || text[start] !== '{') return undefined;
  const end = findEnd(text, start, text.length, '{');
  if (end < 0) throw new Error('Could not parse the config object.');
  let i = start + 1;
  while (i < end) {
    i = skipTrivia(text, i);
    if (i >= end || text[i] === ',') { i += 1; continue; }
    let name;
    let after;
    if (text[i] === "'" || text[i] === '"') {
      after = skipString(text, i);
      name = text.slice(i + 1, after - 1);
    } else {
      const m = /^[A-Za-z_$][\w$]*/.exec(text.slice(i));
      if (!m) { i = expressionEnd(text, i, end) + 1; continue; }
      name = m[0];
      after = i + name.length;
    }
    const colon = skipTrivia(text, after);
    if (text[colon] !== ':') { i = expressionEnd(text, i, end) + 1; continue; }
    const valueStart = skipTrivia(text, colon + 1);
    const valueEnd = expressionEnd(text, valueStart, end);
    if (name === key) return { start: valueStart, end: valueEnd };
    i = valueEnd + (text[valueEnd] === ',' ? 1 : 0);
  }
  return undefined;
}

function insertProperty(text, objectStart, key, rawValue) {
  const found = getProperty(text, objectStart, key);
  if (found) return text.slice(0, found.start) + rawValue + text.slice(found.end);
  const end = findEnd(text, objectStart, text.length, '{');
  const lineStart = text.lastIndexOf('\n', objectStart) + 1;
  const indent = (/^[ \t]*/.exec(text.slice(lineStart, objectStart)) || [''])[0];
  const interior = text.slice(objectStart + 1, end);
  const comma = interior.trim() && !interior.trimEnd().endsWith(',') ? ',' : '';
  return text.slice(0, end) + comma + '\n' + indent + '  ' + key + ': ' + rawValue + '\n' + indent + text.slice(end);
}

function setPath(text, keys, rawValue) {
  for (let level = 0; level < keys.length; level += 1) {
    let objectStart = rootObject(text);
    for (const key of keys.slice(0, level)) {
      const parent = getProperty(text, objectStart, key);
      if (!parent || text[parent.start] !== '{') throw new Error('Cannot safely edit config path ' + keys.slice(0, level + 1).join('.') + '.');
      objectStart = parent.start;
    }
    const found = getProperty(text, objectStart, keys[level]);
    if (level === keys.length - 1) return insertProperty(text, objectStart, keys[level], rawValue);
    if (!found) text = insertProperty(text, objectStart, keys[level], '{}');
    else if (text[found.start] !== '{') throw new Error('Expected an object at ' + keys.slice(0, level + 1).join('.') + '.');
  }
  return text;
}

function ensureExclude(text, path, patterns) {
  let objectStart = rootObject(text);
  for (const key of path) {
    let part = getProperty(text, objectStart, key);
    if (!part) {
      text = insertProperty(text, objectStart, key, '{}');
      part = getProperty(text, objectStart, key);
    }
    if (!part || text[part.start] !== '{') throw new Error(path.join('.') + ' must be an object to configure exclusions.');
    objectStart = part.start;
  }
  const found = getProperty(text, objectStart, 'exclude');
  if (!found) return insertProperty(text, objectStart, 'exclude', JSON.stringify(patterns));
  const raw = text.slice(found.start, found.end).trim();
  if (!raw.startsWith('[') || !raw.endsWith(']')) throw new Error(path.join('.') + '.exclude is not a literal array. Add these patterns manually: ' + patterns.join(', '));
  const values = [...raw.matchAll(/(['"])(.*?)\1/g)].map((m) => m[2]);
  const missing = patterns.filter((p) => !values.includes(p));
  if (!missing.length) return text;
  const prefix = raw.slice(0, -1).trimEnd();
  const comma = prefix.endsWith('[') || prefix.endsWith(',') ? '' : ',';
  const next = prefix + comma + ' ' + missing.map((p) => JSON.stringify(p)).join(', ') + ']';
  return text.slice(0, found.start) + next + text.slice(found.end);
}

function addBlogLinkValidatorExclusion(text, prefix) {
  const integrations = getProperty(text, rootObject(text), 'integrations');
  if (!integrations || text[integrations.start] !== '{') return text;
  const validator = getProperty(text, integrations.start, 'linksValidator');
  if (!validator || text.slice(validator.start, validator.end).trim() === 'false' || text[validator.start] !== '{') return text;
  if (getProperty(text, validator.start, 'exclude')) return text;
  const path = JSON.stringify(prefix);
  const callback = "({ link }) => { const path = link.split(/[?#]/, 1)[0].replace(/\\/+$/, ''); const prefix = " + path + "; return path === prefix || path === '/' + prefix || path.startsWith(prefix + '/') || path.includes('/' + prefix + '/'); }";
  return setPath(text, ['integrations', 'linksValidator', 'exclude'], callback);
}

function addImport(text, statement, moduleName) {
  if (text.includes("from '" + moduleName + "'") || text.includes('from "' + moduleName + '"')) return text;
  const matches = [...text.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"];?/gm)];
  if (!matches.length) return statement + '\n' + text;
  const last = matches.at(-1);
  const position = last.index + last[0].length;
  return text.slice(0, position) + '\n' + statement + text.slice(position);
}

async function updateContentConfig(directory, options) {
  const candidates = ['src/content.config.ts', 'src/content.config.js', 'src/content.config.mjs'];
  let path = candidates.map((name) => join(directory, name)).find(existsSync);
  if (!path) {
    path = join(directory, 'src/content.config.ts');
    await mkdir(dirname(path), { recursive: true });
    const lines = [
      "import { defineCollection } from 'astro:content';",
      "import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';",
      "import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';",
      ...(options.blog ? ["import { blogSchema } from 'starlight-blog/schema';"] : []),
      "import { topicSchema } from 'starlight-sidebar-topics/schema';",
      ...(options.versioning ? ["import { docsVersionsLoader } from 'starlight-versions/loader';"] : []),
      '',
      'export const collections = {',
      '  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: (context) => ' + (options.blog ? 'blogSchema(context).merge(topicSchema)' : 'topicSchema') + ' }) }),',
      '  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),',
      ...(options.versioning ? ['  versions: defineCollection({ loader: docsVersionsLoader() }),'] : []),
      '};',
      '',
    ];
    await writeFile(path, lines.join('\n'), 'utf8');
    return;
  }

  let text = await readFile(path, 'utf8');
  if (options.blog) text = addImport(text, "import { blogSchema } from 'starlight-blog/schema';", 'starlight-blog/schema');
  text = addImport(text, "import { topicSchema } from 'starlight-sidebar-topics/schema';", 'starlight-sidebar-topics/schema');
  if (options.versioning) text = addImport(text, "import { docsVersionsLoader } from 'starlight-versions/loader';", 'starlight-versions/loader');

  if (options.blog && !text.includes('blogSchema(')) {
    if (text.includes('docsSchema()')) text = text.replace('docsSchema()', 'docsSchema({ extend: (context) => blogSchema(context).merge(topicSchema) })');
    else if (text.includes('extend: () => topicSchema')) text = text.replace('extend: () => topicSchema', 'extend: (context) => blogSchema(context).merge(topicSchema)');
    else throw new Error('Custom docs schema detected. Add blogSchema(context).merge(topicSchema) to docsSchema({ extend }) manually, then rerun n0ct add blog.');
  } else if (!text.includes('topicSchema') && text.includes('docsSchema()')) {
    text = text.replace('docsSchema()', 'docsSchema({ extend: () => topicSchema })');
  }

  if (options.versioning && !text.includes('docsVersionsLoader()')) {
    const match = /export\s+const\s+collections\s*=\s*\{/.exec(text);
    if (!match) throw new Error('Could not locate export const collections. Add a versions collection with docsVersionsLoader() manually.');
    text = insertProperty(text, text.indexOf('{', match.index), 'versions', 'defineCollection({ loader: docsVersionsLoader() })');
  }
  await writeFile(path, text, 'utf8');
}

function detectPackageManager(directory) {
  for (const [file, manager] of [['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun'], ['package-lock.json', 'npm']]) {
    if (existsSync(join(directory, file))) return manager;
  }
  return 'npm';
}

async function install(manager, directory) {
  const args = { npm: ['install'], pnpm: ['install'], yarn: ['install'], bun: ['install'] }[manager];
  if (!args) throw new Error('Unsupported package manager ' + manager + '.');
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(manager, args, { cwd: directory, stdio: 'inherit', shell: process.platform === 'win32' });
    child.once('error', (error) => rejectPromise(new Error('Could not start ' + manager + ': ' + error.message)));
    child.once('exit', (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(manager + ' install exited with code ' + (code ?? 'unknown') + '.')));
  });
}

async function ask(question, fallback) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return fallback;
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await terminal.question(question + ' [' + fallback + ']: ')).trim();
    return answer || fallback;
  } finally {
    terminal.close();
  }
}

function validateBlogPath(input) {
  const value = String(input || '').trim().replace(/^\/+|\/+$/g, '');
  if (!value || value.split('/').some((part) => !part || part === '.' || part === '..') || /[\\:#?%\s\u0000-\u001f]/.test(value)) {
    throw new Error('Blog path must be a relative path such as blog or updates/blog.');
  }
  return value;
}

export async function addFeature(options) {
  const feature = String(options.feature || '').trim();
  const directory = resolve(options.directory || '.');
  const configPath = join(directory, 'n0ct.config.mjs');
  const packagePath = join(directory, 'package.json');
  if (!existsSync(configPath) || !existsSync(packagePath)) {
    throw new Error('Run n0ct add inside an initialized N0ctane project with n0ct.config.mjs and package.json.');
  }
  if (feature !== 'blog' && feature !== 'versioning' && !integrationNames.includes(feature)) {
    throw new Error('Unknown feature ' + feature + '. Supported: blog, versioning, ' + integrationNames.join(', ') + '.');
  }

  const manager = options.packageManager || detectPackageManager(directory);
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  let config = await readFile(configPath, 'utf8');

  if (feature === 'blog') {
    let prefix = validateBlogPath(options.blogPath || await ask('Blog path (URL prefix and content directory)', 'blog'));
    let integrations = getProperty(config, rootObject(config), 'integrations');
    if (!integrations || config[integrations.start] !== '{') {
      config = setPath(config, ['integrations'], '{}');
      integrations = getProperty(config, rootObject(config), 'integrations');
    }
    const blog = getProperty(config, integrations.start, 'blog');
    if (blog && config[blog.start] === '{') {
      const currentPrefix = getProperty(config, blog.start, 'prefix');
      if (currentPrefix) prefix = validateBlogPath(config.slice(currentPrefix.start, currentPrefix.end).trim().replace(/^['"]|['"]$/g, ''));
    }
    if (!blog || config.slice(blog.start, blog.end).trim() === 'false') {
      const blogOptions = {
        prefix,
        navigation: 'header-start',
        metrics: { readingTime: true, words: 'rounded' },
        authors: { team: { name: pkg.name || 'Your publication', title: 'Editorial team' } },
      };
      const raw = JSON.stringify(blogOptions, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:');
      config = setPath(config, ['integrations', 'blog'], raw);
    } else if (config[blog.start] === '{' && !getProperty(config, blog.start, 'prefix')) {
      config = setPath(config, ['integrations', 'blog', 'prefix'], JSON.stringify(prefix));
    }

    config = ensureExclude(config, ['sidebar', 'topicOptions'], ['/' + prefix, '/' + prefix + '/**/*']);
    config = addBlogLinkValidatorExclusion(config, prefix);
    const activeVersioning = getProperty(config, rootObject(config), 'versioning');
    if (activeVersioning && config.slice(activeVersioning.start, activeVersioning.end).trim() !== 'false') {
      config = ensureExclude(config, ['versioning'], [prefix + '/**']);
    }
    await updateContentConfig(directory, { blog: true });
    const post = join(directory, 'src/content/docs', prefix, 'first-post.mdx');
    if (!existsSync(post)) {
      await mkdir(dirname(post), { recursive: true });
      await writeFile(post, [
        '---',
        'title: Welcome to the blog',
        'description: Your first publication post.',
        'date: ' + new Date().toISOString().slice(0, 10),
        'sidebar:',
        '  hidden: true',
        '---',
        '',
        'Write your first post here.',
        '',
      ].join('\n'), 'utf8');
    }
    pkg.dependencies ||= {};
    pkg.dependencies['starlight-blog'] ||= packageData.dependencies['starlight-blog'];
    pkg.dependencies['starlight-sidebar-topics'] ||= packageData.dependencies['starlight-sidebar-topics'];
  } else if (feature === 'versioning') {
    const slug = String(options.versionSlug || await ask('Initial archived version slug', '0.1.0')).trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) || slug === '.' || slug === '..') throw new Error('Invalid version slug.');
    const current = getProperty(config, rootObject(config), 'versioning');
    if (!current || config.slice(current.start, current.end).trim() === 'false') {
      const versioning = {
        versions: [{ slug, label: 'v' + slug, redirect: 'same-page' }],
        current: { label: 'Latest', redirect: 'same-page' },
        exclude: [],
      };
      const raw = JSON.stringify(versioning, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:');
      config = setPath(config, ['versioning'], raw);
    }
    const integrations = getProperty(config, rootObject(config), 'integrations');
    const blog = integrations && getProperty(config, integrations.start, 'blog');
    if (blog && config[blog.start] === '{') {
      const prefixValue = getProperty(config, blog.start, 'prefix');
      const prefix = prefixValue ? config.slice(prefixValue.start, prefixValue.end).trim().replace(/^['"]|['"]$/g, '') : 'blog';
      config = ensureExclude(config, ['versioning'], [prefix + '/**']);
    }
    await updateContentConfig(directory, { versioning: true });
    pkg.dependencies ||= {};
    pkg.dependencies['starlight-versions'] ||= packageData.dependencies['starlight-versions'];
  } else {
    let integrations = getProperty(config, rootObject(config), 'integrations');
    if (!integrations || config[integrations.start] !== '{') {
      config = setPath(config, ['integrations'], '{}');
      integrations = getProperty(config, rootObject(config), 'integrations');
    }
    const existing = getProperty(config, integrations.start, feature);
    if (!existing || config.slice(existing.start, existing.end).trim() === 'false') {
      config = setPath(config, ['integrations', feature], '{}');
    }
    if (feature === 'linksValidator') {
      const refreshedIntegrations = getProperty(config, rootObject(config), 'integrations');
      const blog = refreshedIntegrations && getProperty(config, refreshedIntegrations.start, 'blog');
      if (blog && config[blog.start] === '{') {
        const prefix = getProperty(config, blog.start, 'prefix');
        const blogPath = prefix ? config.slice(prefix.start, prefix.end).trim().replace(/^['"]|['"]$/g, '') : 'blog';
        config = addBlogLinkValidatorExclusion(config, blogPath);
      }
    }
  }

  await writeFile(configPath, config, 'utf8');
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  if (options.install === false) {
    console.log('Enabled ' + feature + '. Run ' + manager + ' install to update dependencies.');
    return;
  }
  console.log('Installing project dependencies with ' + manager + '...');
  await install(manager, directory);
  console.log('Enabled ' + feature + '. Run your dev server or build to verify the feature.');
}
