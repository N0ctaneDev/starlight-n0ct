#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templateRoot = join(packageRoot, 'templates', 'starter');
const themePackage = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8'),
);

const usage = () => {
  console.log(`
N0ctane project installer

Usage:
  npx @n0ctanedev/starlight-n0ct init [directory] [options]

Options:
  --yes, -y              Use recommended defaults without prompts
  --no-install           Scaffold files but do not install dependencies
  --pm <manager>         Package manager: npm, pnpm, yarn, or bun
  --help, -h             Show this help

Examples:
  npx @n0ctanedev/starlight-n0ct init my-docs
  npx @n0ctanedev/starlight-n0ct init ./website --pm pnpm
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
  };

  for (let index = firstIsOption ? 0 : 1; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      result.command = 'help';
    } else if (argument === '--yes' || argument === '-y') {
      result.yes = true;
    } else if (argument === '--no-install') {
      result.install = false;
    } else if (argument === '--pm' || argument === '--package-manager') {
      result.packageManager = argv[index + 1];
      index += 1;
    } else if (argument.startsWith('--pm=')) {
      result.packageManager = argument.slice('--pm='.length);
    } else if (argument.startsWith('--package-manager=')) {
      result.packageManager = argument.slice('--package-manager='.length);
    } else if (!argument.startsWith('-') && !result.directory) {
      result.directory = argument;
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

async function promptForAnswers(defaults, enabledByDefault, yes) {
  if (yes || !process.stdin.isTTY || !process.stdout.isTTY) {
    return { ...defaults, enabledIntegrations: enabledByDefault };
  }

  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = async (question, fallback) => {
    const answer = (await terminal.question(`${question} [${fallback}]: `)).trim();
    return answer || fallback;
  };

  try {
    console.log('\nN0ctane project setup');
    console.log('Press Enter to accept the suggested value.\n');

    const title = await ask('Documentation title', defaults.title);
    const description = await ask('Description', defaults.description);
    const siteUrl = await ask('Public site URL', defaults.siteUrl);
    const basePath = await ask('Base path (use / for a domain root)', defaults.basePath);
    const topicDisplay = await ask(
      'Sidebar topics: collapsible, list, or dropdown',
      defaults.topicDisplay,
    );

    const choices = [
      ['announcement', 'Announcement banner'],
      ['kbd', 'Keyboard shortcut helper'],
      ['llmsTxt', 'LLMs.txt generator'],
      ['scrollToTop', 'Scroll to top'],
      ['llmActions', 'LLM actions'],
      ['sidebarSwipe', 'Mobile sidebar swipe'],
      ['linksValidator', 'Internal link validation'],
      ['blog', 'Blog'],
      ['imageZoom', 'Image zoom'],
    ];

    console.log('\nOptional integrations included in the theme:');
    choices.forEach(([key, label], index) => {
      const checked = enabledByDefault.includes(key) ? ' *' : '';
      console.log(`  ${index + 1}. ${label}${checked}`);
    });
    console.log('Enter numbers separated by commas; Enter keeps the recommended defaults.');
    console.log('Enter "none" to disable every optional integration.');

    const defaultsText = choices
      .map(([key], index) => enabledByDefault.includes(key) ? String(index + 1) : null)
      .filter(Boolean)
      .join(',');

    const selection = await ask('Enable integrations', defaultsText);
    let enabledIntegrations = enabledByDefault;

    if (/^none$/i.test(selection.trim())) {
      enabledIntegrations = [];
    } else if (selection !== defaultsText) {
      const indices = selection
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((number) => Number.isInteger(number) && number >= 1 && number <= choices.length);

      enabledIntegrations = [...new Set(indices)].map((number) => choices[number - 1][0]);
    }

    const enableVersioning = /^y(?:es)?$/i.test(
      await ask('Enable archived documentation versioning? (creates a snapshot on first dev/build)', 'no'),
    );

    let versioning = false;
    if (enableVersioning) {
      const slug = (await ask('Initial archived version slug (for example 1.0)', '1.0')).trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(slug) || slug === '.' || slug === '..') {
        throw new Error('Version slug must use letters, numbers, dots, underscores, or hyphens and cannot contain slashes.');
      }
      const versionLabel = (await ask('Archived version label', `v${slug}`)).trim();
      const currentLabel = (await ask('Current version label', 'Latest')).trim();
      if (!versionLabel || !currentLabel) {
        throw new Error('Version labels cannot be empty.');
      }
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
      enabledIntegrations,
      versioning,
    };
  } finally {
    terminal.close();
  }
}

function createN0ctConfig(answers) {
  const enabled = new Set(answers.enabledIntegrations);
  const integrations = {
    basePath: answers.basePath === '/' ? false : {},
    announcement: enabled.has('announcement') ? {} : false,
    kbd: enabled.has('kbd') ? {} : false,
    llmsTxt: enabled.has('llmsTxt') ? {} : false,
    scrollToTop: enabled.has('scrollToTop') ? {} : false,
    llmActions: enabled.has('llmActions') ? {} : false,
    sidebarSwipe: enabled.has('sidebarSwipe') ? {} : false,
    linksValidator: enabled.has('linksValidator') ? {} : false,
    blog: enabled.has('blog') ? {} : false,
    imageZoom: enabled.has('imageZoom') ? {} : false,
  };

  const config = {
    title: answers.title,
    description: answers.description,
    sidebar: {
      topicDisplay: answers.topicDisplay,
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
    versioning: answers.versioning || false,
    icons: {
      iconDir: './src/icons',
      include: { lucide: ['*'] },
    },
    theme: {
      glow: 'balanced',
      contentWidth: '55rem',
      sidebarWidth: '17rem',
    },
  };

  return `// @ts-check\n\n/**\n * Generated by the N0ctane project installer.\n * @satisfies {import('@n0ctanedev/starlight-n0ct').N0ctConfig}\n */\nconst config = ${JSON.stringify(config, null, 2)};\n\nexport default config;\n`;
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
    'blog',
  ];

  const answers = await promptForAnswers(
    defaults,
    recommendedIntegrations,
    options.yes,
  );

  answers.siteUrl = normalizeSiteUrl(answers.siteUrl);
  answers.basePath = normalizeBasePath(answers.basePath);
  answers.topicDisplay = answers.topicDisplay.trim().toLowerCase();

  if (!['collapsible', 'list', 'dropdown'].includes(answers.topicDisplay)) {
    throw new Error('Sidebar topic display must be "collapsible", "list", or "dropdown".');
  }

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

  await cp(templateRoot, target, { recursive: true });
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
    homeContent.replace('Your docs, **your way**.', `${answers.title}, **your way**.`),
    'utf8',
  );

  console.log(`\nCreated ${answers.title} in ${target}`);
  console.log(`Site URL: ${answers.siteUrl}`);
  console.log(`Base path: ${answers.basePath}`);
  console.log(`Sidebar topics: ${answers.topicDisplay}`);
  console.log('Lucide icons: explicitly added to project dependencies.');
  console.log('Starter pages, blog examples, component showcase, content schemas, and GitHub Pages workflow are ready.');
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
