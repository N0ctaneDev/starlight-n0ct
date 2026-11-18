import { describe, expect, it } from 'vitest';
import { normalizeN0ctConfig, topicToSidebar } from './config.js';
import { n0ctane } from './index.js';

describe('N0ctane configuration expansion', () => {
  it('keeps the native Starlight header and installs code-block enhancements by default', () => {
    const config = n0ctane({ title: 'Docs', integrations: { blog: false } });
    expect(config.plugins?.some((plugin) => plugin.name === 'starlight-codeblocks')).toBe(true);
  });

  it('allows an advanced Starlight header override to take precedence', () => {
    const config = n0ctane({
      title: 'Docs',
      integrations: { blog: false },
      starlight: { components: { Header: './src/components/MyHeader.astro' } },
    });
    expect(config.components?.Header).toBe('./src/components/MyHeader.astro');
  });

  it('omits code-block enhancements only when Expressive Code is explicitly disabled', () => {
    const config = n0ctane({
      title: 'Docs',
      integrations: { blog: false },
      starlight: { expressiveCode: false },
    });
    expect(config.expressiveCode).toBe(false);
    expect(config.plugins?.some((plugin) => plugin.name === 'starlight-codeblocks')).toBe(false);
  });

  it('validates navbar dimensions, placements, and link destinations', () => {
    expect(() => normalizeN0ctConfig({
      title: 'Docs',
      navbar: { height: '0' },
    })).toThrow(/navbar.height/);
    expect(() => normalizeN0ctConfig({
      title: 'Docs',
      navbar: { placements: { search: 'middle' as never } },
    })).toThrow(/navbar.placements/);
    expect(() => normalizeN0ctConfig({
      title: 'Docs',
      navbar: { links: [{ label: 'Unsafe', href: 'javascript:alert(1)' }] },
    })).toThrow(/URL scheme/);
    expect(() => normalizeN0ctConfig({
      title: 'Docs',
      navbar: { links: [{ label: 'Empty' }] },
    })).toThrow(/needs an href or dropdown items/);
  });

  it('accepts valid navbar links and dropdown entries', () => {
    expect(() => normalizeN0ctConfig({
      title: 'Docs',
      navbar: {
        height: '3.5rem',
        placements: { brand: 'left', search: 'center', menuToggle: 'right' },
        links: [
          { label: 'Guides', href: '/guides/', position: 'left' },
          { label: 'Community', items: [{ label: 'GitHub', href: 'https://github.com/example', external: true }] },
        ],
      },
    })).not.toThrow();
  });

  it('leaves the Starlight default sidebar untouched when topics are omitted', () => {
    expect(normalizeN0ctConfig({ title: 'Docs' }).sidebar).toBeUndefined();
  });

  it('rejects a native advanced sidebar when list/dropdown mode delegates sidebar ownership upstream', () => {
    expect(() => n0ctane({
      title: 'Docs',
      sidebar: { topicDisplay: 'list', topics: ['guides'] },
      starlight: { sidebar: [] },
    })).toThrow(/delegates sidebar routing to starlight-sidebar-topics/);
  });

  it('supports collapsible, list, and dropdown root topic presentations', () => {
    expect(normalizeN0ctConfig({ title: 'Docs' }).sidebarTopicDisplay).toBe('collapsible');
    expect(normalizeN0ctConfig({ title: 'Docs', sidebar: { topicDisplay: 'list', topics: ['guides'] } }).sidebarTopicDisplay).toBe('list');
    expect(normalizeN0ctConfig({ title: 'Docs', sidebar: { topicDisplay: 'dropdown', topics: ['guides'] } }).sidebarTopicDisplay).toBe('dropdown');
    expect(() => normalizeN0ctConfig({ title: 'Docs', sidebar: { topicDisplay: 'tabs' as never } })).toThrow(/topicDisplay/);
  });

  it('rejects a custom Sidebar override in plugin-backed modes', () => {
    expect(() => n0ctane({
      title: 'Docs',
      sidebar: { topicDisplay: 'dropdown', topics: ['guides'] },
      starlight: { components: { Sidebar: './src/components/MySidebar.astro' } },
    })).toThrow(/starlight\.components\.Sidebar replaces the topic selector/);
  });

  it('leaves Starlight Sidebar untouched in collapsible mode and delegates list mode to Sidebar Topics', () => {
    const collapsible = n0ctane({
      title: 'Docs',
      sidebar: { topicDisplay: 'collapsible', topics: ['guides'] },
      integrations: { blog: false },
    });
    const list = n0ctane({
      title: 'Docs',
      sidebar: { topicDisplay: 'list', topics: ['guides'] },
      integrations: { blog: false },
    });

    expect(collapsible.components?.Sidebar).toBeUndefined();
    const dropdown = n0ctane({
      title: 'Docs',
      sidebar: { topicDisplay: 'dropdown', topics: ['guides'] },
      integrations: { blog: false },
    });

    expect(list.components?.Sidebar).toBeUndefined();
    expect(dropdown.components?.Sidebar).toContain('Sidebar.astro');
  });

  it('turns string topics into title-cased autogenerate groups', () => {
    const result = normalizeN0ctConfig({ title: 'Docs', sidebar: { topics: ['reference', 'api-guides'] } });
    const sidebar = result.sidebar ?? [];
    expect(sidebar[0]).toMatchObject({ label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] });
    const second = sidebar[1];
    const secondLabel = typeof second === 'object' && second !== null && 'label' in second ? second.label : undefined;
    expect(secondLabel).toBe('Api Guides');
  });

  it('infers the autogenerate directory from an object link', () => {
    expect(topicToSidebar({ label: 'Guides', link: '/guides' })).toMatchObject({
      label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }],
    });
  });

  it('converts standalone internal topic links to Starlight slug links', () => {
    expect(topicToSidebar({ label: 'Getting started', link: '/getting-started/', autogenerate: false })).toEqual({
      label: 'Getting started', slug: 'getting-started',
    });
  });

  it('supports icon shorthand and manual children', () => {
    expect(topicToSidebar({ label: 'Guides', icon: 'lucide:book-open', items: [{ label: 'Start', link: '/start' }] })).toMatchObject({
      label: '[lucide:book-open] Guides', items: [{ label: 'Start', link: '/start' }],
    });
  });

  it('supports an explicit autogenerate directory object', () => {
    expect(topicToSidebar({ label: 'Manuals', autogenerate: { directory: 'docs/manuals' } })).toMatchObject({
      label: 'Manuals', items: [{ autogenerate: { directory: 'docs/manuals' } }],
    });
  });

  it('allows explicit autogeneration with provided items', () => {
    const generated = topicToSidebar({ label: 'Guides', link: '/guides', items: [{ label: 'Intro', link: '/guides/' }], autogenerate: true });
    expect(typeof generated === 'object' && generated !== null && 'items' in generated ? generated.items : []).toHaveLength(2);
  });

  it('does not infer content directories from external links', () => {
    expect(topicToSidebar({ label: 'Community', link: 'https://example.com' })).toMatchObject({
      label: 'Community', link: 'https://example.com',
    });
  });

  it('rejects empty labels and unsafe topic paths', () => {
    expect(() => topicToSidebar({ label: '  ', link: '/x', autogenerate: false })).toThrow(/labels must not be empty/);
    expect(() => topicToSidebar({ label: 'Unsafe', link: 'file:///etc/passwd', autogenerate: false })).toThrow(/URL scheme/);
    expect(() => topicToSidebar('')).toThrow(/non-empty path/);
    expect(() => topicToSidebar('../secrets')).toThrow(/dot segments/);
  });

  it('requires a directory when autogeneration is enabled', () => {
    expect(() => topicToSidebar({ label: 'Unresolved', autogenerate: true })).toThrow(/has no directory/);
  });

  it('leaves validation of versioning options to starlight-versions', () => {
    expect(normalizeN0ctConfig({ title: 'Docs', versioning: false })).toMatchObject({ title: 'Docs' });
  });
});
