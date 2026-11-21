#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { addFeature } from './add-feature.mjs';
import { addFeature } from './add-feature.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templatesRoot = join(packageRoot, 'templates');
const themePackage = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8'),
);

const usage = () => {
  console.log(`
N0ctane project installer

Usage:
  npx @n0ctanedev/starlight-n0ct init [directory] [options]
  npx @n0ctanedev/starlight-n0ct add <feature> [project-directory] [options]

Features:
  blog, versioning, basePath, announcement, kbd, llmsTxt,
  scrollToTop, llmActions, sidebarSwipe, linksValidator, imageZoom

Options:
  --yes, -y              Use recommended defaults without prompts
  --no-install           Scaffold files without installing dependencies
  --pm <manager>         Package manager: npm, pnpm, yarn, or bun
  --template <name>      Template: starter or blog (default: starter)
  --blog-path <path>     Blog URL prefix/content directory (default: blog)
  --version <slug>       Initial archived version slug
  --help, -h             Show this help

Examples:
  npx @n0ctanedev/starlight-n0ct init my-docs
  npx @n0ctanedev/starlight-n0ct init my-publication --template blog
  npx @n0ctanedev/starlight-n0ct add blog
  npx @n0ctanedev/starlight-n0ct add versioning ./my-docs --version 1.0.0
`);
};

function parseArgs(argv) {
  const firstIsOption = Boolean(argv[0]?.startsWith('-'));
  const result = {
    command: firstIsOption ? 'help' : (argv[0] ?? 'help'),
    directory: undefined,
    yes: false,
    install: true,
    packageManager: undefined,
    template: undefined,
    blogPath: undefined,
    versionSlug: undefined,
    feature: undefined,
  };

  for (let index = firstIsOption ? 0 : 1; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      result.command = 'help';
    } else if (argument === '--yes' || argument === '-y') {
      result.yes = true;
    } else if (argument === '--no-install') {
      result.install = false;
    } else if (argument === '--template') {
      result.template = argv[index + 1];
      index += 1;
    } else if (argument.startsWith('--template=')) {
      result.template = argument.slice('--template='.length);
    } else if (argument === '--blog-path' || argument === '--path') {
      result.blogPath = argv[index + 1];
      index += 1;
    } else if (argument.startsWith('--blog-path=')) {
      result.blogPath = argument.slice('--blog-path='.length);
    } else if (argument === '--version') {
      result.versionSlug = argv[index + 1];
      index += 1;
    } else if (argument.startsWith('--version=')) {
      result.versionSlug = argument.slice('--version='.length);
    } else if (argument === '--pm' || argument === '--package-manager') {
      result.packageManager = argv[index + 1];
      index += 1;
    } else if (argument.startsWith('--pm=')) {
      result.packageManager = argument.slice('--pm='.length);
    } else if (argument.startsWith('--package-manager=')) {
      result.packageManager = argument.slice('--package-manager='.length);
    } else if (!argument.startsWith('-')) {
      if (result.command === 'add' && !result.feature) result.feature = argument;
      else if (!result.directory) result.directory = argument;
    }
  }

  return result;
}

function titleCase(value) {
  return value
    .replace(/[-_.]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function projectPackageName(directory) {
  const candidate = basename(directory).toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/-+/g, '-')
    .slice(0, 180);

  return candidate || 'n0ctane-docs';
}

function normalizeBasePath(value) {
  const raw = value.trim();
  if (!raw || raw === '/') return '/';

  if (/[:?#\\\s\u0000-\u001f]/.test(raw)) {
    throw new Error('Base path must be a path such as /docs, without spaces, query strings, or fragments.');
  }

  const normalized = `/${raw.replace(/^\/+|\/+$/g, '')}`;
  if (normalized.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error('Base path cannot contain . or .. path segments.');
  }

  return normalized;
}

function normalizeBlogPath(value) {
  const raw = String(value ?? 'blog').trim().replace(/^\/+|\/+$/g, '');
  if (!raw || raw.split('/').some((part) => !part || part === '.' || part === '..') || /[\\:#?%\s\u0000-\u001f]/.test(raw)) {
    throw new Error('Blog path must be a relative path such as blog or updates/blog, without spaces or URL characters.');
  }
  return raw;
}

function normalizeSiteUrl(value) {
  const raw = value.trim() || 'https://example.com';
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Enter a valid site URL, for example https://docs.example.com.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Site URL must use http or https.');
  }

  return parsed.origin;
}

function detectPackageManager(targetParent) {
  const userAgent = process.env.npm_config_user_agent ?? '';
  const fromAgent = /(?:^|\s)(pnpm|yarn|bun)\//.exec(userAgent)?.[1];
  if (fromAgent) return fromAgent;

  const lockFiles = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ];

  for (const directory of [...new Set([targetParent, process.cwd()])]) {
    for (const [file, manager] of lockFiles) {
      if (existsSync(join(directory, file))) return manager;
    }
  }

  return 'npm';
}

async function isDirectoryEmpty(path) {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch (error) {
    if (error?.code === 'ENOENT') return true;
    throw error;
  }
}


async function interactiveList({ title, choices, selected = [], multiple = false, fallback = selected[0] }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return multiple ? [...selected] : fallback;
  }

  emitKeypressEvents(process.stdin);
  const initialRaw = Boolean(process.stdin.isRaw);
  const picked = new Set(selected);
  let cursor = Math.max(0, choices.findIndex((choice) => choice.value === fallback));

  const render = () => {
    const lines = [
      '',
      title,
      multiple
        ? '  ↑/↓ move   Space toggle   Enter confirm   A select all   N clear'
        : '  ↑/↓ move   Enter select',
      '',
      ...choices.map((choice, index) => {
        const active = index === cursor;
        const checked = picked.has(choice.value);
        const marker = multiple ? (checked ? '[✓]' : '[ ]') : (active ? '›' : ' ');
        const pointer = active ? '\x1b[36m' : '\x1b[90m';
        const label = active ? '\x1b[1;37m' : '\x1b[37m';
        return '  ' + pointer + marker + '\x1b[0m ' + label + choice.label + '\x1b[0m  \x1b[90m— ' + choice.description + '\x1b[0m';
      }),
      '',
    ];
    process.stdout.write('\x1b[H\x1b[2J' + lines.join('\n'));
  };

  process.stdin.setRawMode(true);
  process.stdin.resume();
  render();

  return await new Promise((resolvePromise, rejectPromise) => {
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(initialRaw);
      process.stdout.write('\n');
    };

    const finish = (value) => {
      cleanup();
      resolvePromise(value);
    };

    const onKeypress = (_character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        rejectPromise(new Error('Setup cancelled.'));
        return;
      }
      if (key.name === 'up') cursor = (cursor - 1 + choices.length) % choices.length;
      else if (key.name === 'down') cursor = (cursor + 1) % choices.length;
      else if (multiple && key.name === 'space') {
        const value = choices[cursor]?.value;
        if (value && picked.has(value)) picked.delete(value);
        else if (value) picked.add(value);
      } else if (multiple && key.name === 'a') {
        choices.forEach((choice) => picked.add(choice.value));
      } else if (multiple && key.name === 'n') {
        picked.clear();
      } else if (key.name === 'return' || key.name === 'enter') {
        finish(multiple ? choices.map((choice) => choice.value).filter((value) => picked.has(value)) : choices[cursor]?.value);
        return;
      } else if (!multiple && key.name === 'escape') {
        finish(fallback);
        return;
      }
      render();
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function promptForAnswers(defaults, enabledByDefault, yes, requestedTemplate, requestedBlogPath) {
  if (yes || !process.stdin.isTTY || !process.stdout.isTTY) {
    return {
      ...defaults,
      template: requestedTemplate ?? 'starter',
      enabledIntegrations: requestedTemplate === 'blog'
        ? [...new Set([...enabledByDefault, 'blog'])]
        : enabledByDefault,
      blogPath: requestedTemplate === 'blog' ? (requestedBlogPath || 'blog') : undefined,
    };
  }

  let terminal = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (question, fallback) => {
    const answer = (await terminal.question(question + ' [' + fallback + ']: ')).trim();
    return answer || fallback;
  };
  const runList = async (options) => {
    terminal.close();
    const result = await interactiveList(options);
    terminal = createInterface({ input: process.stdin, output: process.stdout });
    return result;
  };

  try {
    console.log('\nN0ctane project setup');
    console.log('Press Enter to accept the suggested value.\n');

    const title = await ask('Documentation title', defaults.title);
    const description = await ask('Description', defaults.description);
    const siteUrl = await ask('Public site URL', defaults.siteUrl);
    const basePath = await ask('Base path (use / for a domain root)', defaults.basePath);
    const topicDisplay = await ask('Sidebar topics: collapsible, list, or dropdown', defaults.topicDisplay);

    const templateChoices = [
      { value: 'starter', label: 'Documentation starter', description: 'A focused docs site with guides, reference pages, and components.' },
      { value: 'blog', label: 'Blog + documentation', description: 'Docs plus a ready-to-publish blog, authors, tags, and sample posts.' },
    ];
    const template = requestedTemplate
      ? templateChoices.find((choice) => choice.value === requestedTemplate)?.value
      : await runList({
          title: 'Choose a project template',
          choices: templateChoices,
          selected: ['starter'],
          fallback: 'starter',
        });
    if (!template) throw new Error('Unknown template. Choose "starter" or "blog".');
    const choices = [
      { value: 'basePath', label: 'Base path rewriting', description: 'Prefix root-relative links with the deployment subpath when the site is not hosted at /.' },
      { value: 'announcement', label: 'Announcement banner', description: 'Display dismissible or scheduled notices at the top of the docs.' },
      { value: 'kbd', label: 'Keyboard shortcuts', description: 'Render keycaps and keyboard-aware shortcut labels.' },
      { value: 'llmsTxt', label: 'LLMs.txt generator', description: 'Generate Markdown indexes designed for AI crawlers and assistants.' },
      { value: 'scrollToTop', label: 'Scroll to top', description: 'Add a floating control for returning to the top of long pages.' },
      { value: 'llmActions', label: 'LLM page actions', description: 'Copy Markdown, view source, print to PDF, and open pages in AI tools.' },
      { value: 'sidebarSwipe', label: 'Mobile sidebar swipe', description: 'Open and close the navigation sidebar with touch gestures.' },
      { value: 'linksValidator', label: 'Link validator', description: 'Check local documentation links during production builds.' },
      { value: 'blog', label: 'Blog', description: 'Add posts, tags, author pages, RSS, and reading-time metadata.' },
      { value: 'imageZoom', label: 'Image zoom', description: 'Open documentation images in an accessible zoom viewer.' },
    ];
    const selectedPlugins = await runList({
      title: template === 'blog'
        ? 'Choose additional integrations (Blog is included; Space toggles)'
        : 'Choose optional integrations (Space toggles; Enter confirms)',
      choices: template === 'blog'
        ? choices.filter((choice) => choice.value !== 'blog')
        : choices,
      multiple: true,
      selected: basePath === '/' ? enabledByDefault : [...new Set([...enabledByDefault, 'basePath'])],
    });
    const enabledIntegrations = template === 'blog'
      ? [...new Set([...selectedPlugins, 'blog'])]
      : selectedPlugins;
    const blogPath = enabledIntegrations.includes('blog')
      ? (requestedBlogPath || await ask('Blog path (URL prefix and content directory)', 'blog'))
      : undefined;

    const enableVersioning = /^y(?:es)?$/i.test(
      await ask('Enable archived documentation versioning? (creates a snapshot on first dev/build)', 'no'),
    );

    let versioning = false;
    if (enableVersioning) {
      const slug = (await ask('Initial archived version slug (for example 0.2.0)', '0.2.0')).trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(slug) || slug === '.' || slug === '..') {
        throw new Error('Version slug must use letters, numbers, dots, underscores, or hyphens and cannot contain slashes.');
      }
      const versionLabel = (await ask('Archived version label', 'v' + slug)).trim();
      const currentLabel = (await ask('Current version label', 'Latest')).trim();
      if (!versionLabel || !currentLabel) throw new Error('Version labels cannot be empty.');
      versioning = {
        versions: [{ slug, label: versionLabel }],
        current: { label: currentLabel },
      };
    }

    return {
      title,
      description,
      siteUrl,
      basePath,
      topicDisplay,
      template,
      blogPath,
      enabledIntegrations,
      versioning,
    };
  } finally {
    terminal.close();
  }
}

function createN0ctConfig(answers) {
  const enabled = new Set(answers.enabledIntegrations);
  const blogPath = enabled.has('blog') ? answers.blogPath : 'blog';
  const integrations = {
    basePath: enabled.has('basePath') ? {} : false,
    announcement: enabled.has('announcement') ? {} : false,
    kbd: enabled.has('kbd') ? {} : false,
    llmsTxt: enabled.has('llmsTxt') ? {} : false,
    scrollToTop: enabled.has('scrollToTop') ? {} : false,
    llmActions: enabled.has('llmActions') ? {} : false,
    sidebarSwipe: enabled.has('sidebarSwipe') ? {} : false,
    linksValidator: enabled.has('linksValidator') ? {} : false,
    blog: enabled.has('blog')
      ? {
          prefix: blogPath,
          navigation: 'header-start',
          metrics: { readingTime: true, words: 'rounded' },
          authors: {
            team: {
              name: answers.title,
              title: 'Editorial team',
              url: answers.siteUrl,
            },
          },
        }
      : false,
    imageZoom: enabled.has('imageZoom') ? {} : false,
  };

  const n0ctaneColors = {
    dark: { palette: { primary: '#F25CFF', secondary: '#8C42FF', accent: '#00E5FF', surface: '#131626', text: '#E6EAF8', highlight: '#2A85FF', highlightText: '#080A15', background: '#0B0D17' } },
    light: { palette: { primary: '#B72DBF', secondary: '#7540CE', accent: '#00AFC2', surface: '#FFFFFF', text: '#211D32', highlight: '#286DCE', highlightText: '#FFFFFF', background: '#F6F5FB' } },
  };
  const draculaColors = {
    dark: { palette: { primary: '#BD93F9', secondary: '#FF79C6', accent: '#8BE9FD', surface: '#343746', text: '#F8F8F2', highlight: '#44475A', highlightText: '#F8F8F2', background: '#282A36' } },
    light: { palette: { primary: '#644AC9', secondary: '#A3144D', accent: '#036A96', surface: '#ECE9DF', text: '#1F1F1F', highlight: '#CFCFDE', highlightText: '#1F1F1F', background: '#FFFBEB' } },
  };

  const config = {
    title: answers.title,
    favicon: '/favicons/n0ctane.svg',
    description: answers.description,
    sidebar: {
      topicDisplay: answers.topicDisplay,
      ...(enabled.has('blog') ? {
        topicOptions: { exclude: ['/' + blogPath, '/' + blogPath + '/**/*'] },
      } : {}),
      topics: [
        {
          label: 'Guides',
          id: 'guides',
          icon: 'lucide:book-open',
          dropdownIcon: 'open-book',
          link: '/guides/',
          directory: 'guides',
        },
        {
          label: 'Reference',
          id: 'reference',
          icon: 'lucide:library',
          dropdownIcon: 'information',
          link: '/reference/',
          directory: 'reference',
        },
      ],
    },
    integrations,
    versioning: answers.versioning
      ? {
          ...answers.versioning,
          ...(enabled.has('blog') ? { exclude: [blogPath + '/**'] } : {}),
        }
      : false,
    starlight: {
      logo: {
        dark: './src/assets/n0ctane-dark.svg',
        light: './src/assets/n0ctane-light.svg',
        alt: 'N0ctane logo',
      },
    },
    icons: {
      iconDir: './src/icons',
      include: { lucide: ['*'] },
    },
    theme: {
      defaultTheme: 'n0ctane',
      themes: {
        n0ctane: {
          label: 'N0ctane',
          favicon: '/favicons/n0ctane.svg',
          logo: { dark: '/logos/n0ctane-dark.svg', light: '/logos/n0ctane-light.svg' },
          colors: n0ctaneColors,
        },
        dracula: {
          label: 'Dracula',
          favicon: '/favicons/dracula.svg',
          logo: { dark: '/logos/dracula-dark.svg', light: '/logos/dracula-light.svg' },
          colors: draculaColors,
        },
      },
      glow: 'balanced',
      contentWidth: '55rem',
      sidebarWidth: '17rem',
    },
  };

  let serialized = JSON.stringify(config, null, 2)
    .replace(/"([A-Za-z_$][\w$]*)":/g, '$1:');
  if (enabled.has('blog') && enabled.has('linksValidator')) {
    const prefix = JSON.stringify(blogPath);
    const validator = "linksValidator: {\n      exclude: ({ link }) => { const path = link.split(/[?#]/, 1)[0]; const prefix = " + prefix + "; const prefixPath = '/' + prefix; return path === prefix || path === prefixPath || path.startsWith(prefix + '/') || path.endsWith(prefixPath) || path.includes(prefixPath + '/'); },\n    },";
    serialized = serialized.replace('linksValidator: {},', validator);
  }

  return '// @ts-check\n\n/**\n * Generated by the N0ctane project installer.\n * @satisfies {import(\'@n0ctanedev/starlight-n0ct\').N0ctConfig}\n */\nconst config = ' +
    serialized + ';\n\nexport default config;\n';
}

function packageVersions() {
  const astroVersion = themePackage.devDependencies?.astro ?? '^7.4.12';
  const starlightVersion = themePackage.devDependencies?.['@astrojs/starlight'] ?? '^0.43.1';
  const viteVersion = themePackage.devDependencies?.vite ?? '^8.3.6';
  const blogVersion = themePackage.dependencies?.['starlight-blog'] ?? '^0.30.2';
  const topicsVersion = themePackage.dependencies?.['starlight-sidebar-topics'] ?? '^0.9.0';
  const versionsVersion = themePackage.dependencies?.['starlight-versions'] ?? '^0.10.2';
  const lucideVersion = themePackage.dependencies?.['@iconify-json/lucide']
    ?? themePackage.peerDependencies?.['@iconify-json/lucide']
    ?? '^1.2.155';

  return {
    astro: astroVersion,
    '@astrojs/starlight': starlightVersion,
    '@n0ctanedev/starlight-n0ct': `^${themePackage.version}`,
    '@iconify-json/lucide': lucideVersion,
    // The starter content schema imports blogSchema even when Blog is disabled.
    'starlight-blog': blogVersion,
    'starlight-sidebar-topics': topicsVersion,
    // The content config registers docsVersionsLoader so versioning can be enabled later.
    'starlight-versions': versionsVersion,
    vite: viteVersion,
  };
}

async function runPackageManager(manager, projectDirectory) {
  const commands = {
    npm: ['npm', ['install']],
    pnpm: ['pnpm', ['install']],
    yarn: ['yarn', ['install']],
    bun: ['bun', ['install']],
  };

  const command = commands[manager];
  if (!command) {
    throw new Error(`Unsupported package manager "${manager}". Use npm, pnpm, yarn, or bun.`);
  }

  console.log(`\nInstalling dependencies with ${manager}...`);

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command[0], command[1], {
      cwd: projectDirectory,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.once('error', (error) => {
      rejectPromise(new Error(`Could not start ${manager}: ${error.message}`));
    });

    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${manager} install exited with code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.command === 'help') {
    usage();
    return;
  }

  if (options.command === 'add') {
    await addFeature({
      feature: options.feature,
      directory: options.directory,
      packageManager: options.packageManager,
      blogPath: options.blogPath,
      versionSlug: options.versionSlug,
      install: options.install,
    });
    return;
  }

  if (options.command !== 'init') {
    usage();
    process.exitCode = 1;
    return;
  }

  const target = resolve(options.directory ?? 'my-n0ctane-docs');
  const targetParent = dirname(target);

  if (!(await isDirectoryEmpty(target))) {
    throw new Error(
      `Target directory is not empty: ${target}\nChoose an empty directory to avoid overwriting existing files.`,
    );
  }

  await mkdir(targetParent, { recursive: true });

  const defaults = {
    title: titleCase(basename(target)),
    description: 'Documentation powered by N0ctane and Astro Starlight.',
    siteUrl: 'https://example.com',
    basePath: '/',
    topicDisplay: 'dropdown',
  };

  const recommendedIntegrations = [
    'llmsTxt',
    'scrollToTop',
    'sidebarSwipe',
    'imageZoom',
  ];

  const answers = await promptForAnswers(defaults, recommendedIntegrations, options.yes, options.template, options.blogPath);

  answers.siteUrl = normalizeSiteUrl(answers.siteUrl);
  if (answers.enabledIntegrations.includes('blog')) answers.blogPath = normalizeBlogPath(answers.blogPath);
  answers.basePath = normalizeBasePath(answers.basePath);
  answers.topicDisplay = answers.topicDisplay.trim().toLowerCase();

  if (!['collapsible', 'list', 'dropdown'].includes(answers.topicDisplay)) {
    throw new Error('Sidebar topic display must be "collapsible", "list", or "dropdown".');
  }

  if (answers.enabledIntegrations.includes('blog') && !answers.blogPath) {
    throw new Error('A Blog path is required when the Blog integration is enabled.');
  }
  if (answers.template === 'blog' && !answers.enabledIntegrations.includes('blog')) answers.enabledIntegrations.push('blog');

  const manager = options.packageManager ?? detectPackageManager(targetParent);
  if (!['npm', 'pnpm', 'yarn', 'bun'].includes(manager)) {
    throw new Error(`Unsupported package manager "${manager}". Use npm, pnpm, yarn, or bun.`);
  }

  const packageName = projectPackageName(target);
  const projectPackage = {
    name: packageName,
    private: true,
    type: 'module',
    version: '0.1.0',
    scripts: {
      dev: 'astro dev --host',
      build: 'astro build',
      preview: 'astro preview --host',
    },
    engines: { node: '>=22.22.0' },
    allowScripts: { esbuild: true },
    dependencies: Object.fromEntries(
      Object.entries(packageVersions()).filter(([name]) => name !== 'vite'),
    ),
    devDependencies: { vite: packageVersions().vite },
  };

  const selectedTemplateRoot = join(templatesRoot, answers.template);
  if (!existsSync(selectedTemplateRoot)) throw new Error('Template "' + answers.template + '" does not exist.');
  await cp(selectedTemplateRoot, target, { recursive: true });
  if (answers.template === 'blog' && answers.blogPath !== 'blog') {
    const sourceBlog = join(target, 'src', 'content', 'docs', 'blog');
    const targetBlog = join(target, 'src', 'content', 'docs', ...answers.blogPath.split('/'));
    await mkdir(dirname(targetBlog), { recursive: true });
    await rename(sourceBlog, targetBlog);
  }
  await writeFile(
    join(target, 'package.json'),
    `${JSON.stringify(projectPackage, null, 2)}\n`,
    'utf8',
  );
  await writeFile(join(target, 'n0ct.config.mjs'), createN0ctConfig(answers), 'utf8');
  await writeFile(
    join(target, '.env'),
    `SITE_URL=${answers.siteUrl}\nBASE_PATH=${answers.basePath}\n`,
    'utf8',
  );

  // Keep the sample content aligned with the supplied project title.
  const homePage = join(target, 'src', 'content', 'docs', 'index.mdx');
  const homeContent = await readFile(homePage, 'utf8');
  await writeFile(
    homePage,
    homeContent
      .replace('"__N0CT_SITE_TITLE__"', JSON.stringify(answers.title))
      .replaceAll('/blog/', '/' + (answers.blogPath || 'blog') + '/')
      .replaceAll('src/content/docs/blog/', 'src/content/docs/' + (answers.blogPath || 'blog') + '/'),
    'utf8',
  );

  if (answers.enabledIntegrations.includes('blog')) {
    const postPath = join(target, 'src', 'content', 'docs', ...answers.blogPath.split('/'), 'first-post.mdx');
    if (!existsSync(postPath)) {
      await mkdir(dirname(postPath), { recursive: true });
      await writeFile(postPath, [
        '---',
        'title: Welcome to the publication',
        'description: Your first Blog post.',
        'date: ' + new Date().toISOString().slice(0, 10),
        'authors: [team]',
        'tags: [welcome]',
        'sidebar:',
        '  hidden: true',
        '---',
        '',
        'Write your first publication post here.',
        '',
      ].join('\\n'), 'utf8');
    }
  }

  console.log(`\nCreated ${answers.title} in ${target}`);
  console.log(`Site URL: ${answers.siteUrl}`);
  console.log(`Base path: ${answers.basePath}`);
  console.log(`Sidebar topics: ${answers.topicDisplay}`);
  console.log('Lucide icons: explicitly added to project dependencies.');
  console.log('Template: ' + answers.template);
  if (answers.enabledIntegrations.includes('blog')) {
    console.log('Blog path: /' + answers.blogPath + '/ (src/content/docs/' + answers.blogPath + '/)');
    const blogGuide = join(target, 'src', 'content', 'docs', 'getting-started.mdx');
    if (existsSync(blogGuide)) {
      const guide = await readFile(blogGuide, 'utf8');
      await writeFile(blogGuide, guide
        .replaceAll('src/content/docs/blog/', 'src/content/docs/' + answers.blogPath + '/')
        .replaceAll('/blog/', '/' + answers.blogPath + '/'), 'utf8');
    }
  }
  console.log('Starter pages, content schemas, favicon, and GitHub Pages workflow are ready.');
  console.log(`Versioning: ${answers.versioning ? 'enabled (an initial archive will be created on first dev/build)' : 'disabled'}.`);

  if (!options.install) {
    console.log(`\nDependencies not installed. Run "${manager} install" in ${target}.`);
    return;
  }

  await runPackageManager(manager, target);

  console.log('\nN0ctane docs project is ready.');
  console.log(`  cd "${target}"`);
  console.log(`  ${manager} run dev`);
  console.log('\nDeployment notes: see DEPLOY.md');
}

main().catch((error) => {
  console.error(`\n[n0ct] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
