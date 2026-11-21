import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const repositoryRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const installerPath = join(repositoryRoot, 'bin', 'n0ct.mjs');

describe('project installer', () => {
  let workingDirectory = '';

  beforeEach(async () => {
    workingDirectory = await mkdtemp(join(tmpdir(), 'starlight-n0ct-installer-'));
  });

  afterEach(async () => {
    await rm(workingDirectory, { recursive: true, force: true });
  });

  async function scaffold(template: 'starter' | 'blog') {
    const target = join(workingDirectory, template);
    const result = spawnSync(
      process.execPath,
      [installerPath, 'init', target, '--yes', '--no-install', '--template', template],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.error).toBeUndefined();

    const configUrl = pathToFileURL(join(target, 'n0ct.config.mjs'));
    const configModule = await import(configUrl.href + '?template=' + template);
    const project = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    const homepage = await readFile(join(target, 'src/content/docs/index.mdx'), 'utf8');

    return { target, config: configModule.default, project, homepage, output: result.stdout };
  }

  it('scaffolds a documentation-only starter with Blog disabled', async () => {
    const result = await scaffold('starter');

    expect(result.config.title).toBe('Starter');
    expect(result.config.favicon).toBe('/favicons/n0ctane.svg');
    expect(result.config.theme.defaultTheme).toBe('n0ctane');
    expect(result.config.theme.themes.n0ctane.label).toBe('N0ctane');
    expect(result.config.theme.themes.dracula.label).toBe('Dracula');
    expect(result.config.theme.themes.dracula.favicon).toBe('/favicons/dracula.svg');
    expect(result.config.integrations.blog).toBe(false);
    expect(result.project.dependencies['@n0ctanedev/starlight-n0ct']).toBe('^1.0.0');
    expect(result.homepage).toContain('Starter');
    expect(result.output).toContain('Template: starter');

    await expect(readdir(join(result.target, 'src/content/docs/guides'))).resolves.toContain('configuration.mdx');
    await expect(readdir(join(result.target, 'src/content/docs/blog'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('scaffolds the Blog + Documentation template with a working team author', async () => {
    const result = await scaffold('blog');
    const blog = result.config.integrations.blog;

    expect(result.config.favicon).toBe('/favicons/n0ctane.svg');
    expect(result.config.theme.themes.n0ctane.label).toBe('N0ctane');
    expect(result.config.theme.themes.dracula.label).toBe('Dracula');
    expect(result.config.sidebar.topicOptions.exclude).toContain('/blog');
    expect(typeof blog).toBe('object');
    expect(blog.navigation).toBe('header-start');
    expect(blog.metrics).toEqual({ readingTime: true, words: 'rounded' });
    expect(blog.authors.team.name).toBe('Blog');
    expect(blog.authors.team.url).toBe('https://example.com');
    expect(result.project.dependencies['starlight-blog']).toBeTruthy();
    expect(result.homepage).toContain('Blog');

    const samplePost = await readFile(join(result.target, 'src/content/docs/blog/first-post.mdx'), 'utf8');
    expect(samplePost).toContain('authors: [team]');
    expect(samplePost).toContain('Welcome to the publication');
    expect(result.output).toContain('Template: blog');
  });
});
