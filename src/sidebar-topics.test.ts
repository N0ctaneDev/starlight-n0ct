import { beforeEach, describe, expect, it, vi } from 'vitest';

const { topicFactory } = vi.hoisted(() => ({
  topicFactory: vi.fn(() => ({ name: 'starlight-sidebar-topics' })),
}));

vi.mock('starlight-sidebar-topics', () => ({
  default: topicFactory,
}));

import { createN0ctSidebarTopics } from './sidebar-topics.js';

describe('N0ctane Sidebar Topics integration', () => {
  beforeEach(() => topicFactory.mockClear());

  it('does not activate the upstream plugin for native collapsible navigation', () => {
    expect(createN0ctSidebarTopics({ topicDisplay: 'collapsible', topics: ['guides'] })).toEqual([]);
    expect(topicFactory).not.toHaveBeenCalled();
  });

  it.each(['list', 'dropdown'] as const)('activates Sidebar Topics in %s mode', (topicDisplay) => {
    const plugins = createN0ctSidebarTopics({
      topicDisplay,
      topics: [{ label: 'Guides', id: 'guides', link: '/guides/', directory: 'guides' }],
    }, { blog: false });

    expect(plugins).toHaveLength(1);
    expect(topicFactory).toHaveBeenCalledOnce();
    expect(topicFactory).toHaveBeenCalledWith(
      [expect.objectContaining({ label: 'Guides', id: 'guides', link: '/guides/' })],
      {},
    );
  });

  it('preserves user route options and excludes the configured Blog prefix', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'list',
      topics: [{ label: 'Reference', id: 'reference', link: '/reference/', directory: 'reference' }],
      extra: [{ label: 'External', link: 'https://example.com' }],
      topicOptions: {
        exclude: ['/search', '/api/**'],
        topics: { reference: ['/generated-api/**'] },
      },
    }, { blog: { prefix: 'news' } });

    expect(topicFactory).toHaveBeenCalledWith(
      [expect.objectContaining({
        label: 'Reference',
        items: expect.arrayContaining([
          { autogenerate: { directory: 'reference' } },
          { label: 'External', link: 'https://example.com' },
        ]),
      })],
      {
        exclude: ['/news', '/news/**/*', '/search', '/api/**'],
        topics: { reference: ['/generated-api/**'] },
      },
    );
  });

  it('normalizes relative topic root links before passing them to the plugin', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'dropdown',
      topics: [{ label: 'Guides', link: 'guides/' }],
    }, { blog: false });

    expect(topicFactory).toHaveBeenCalledWith(
      [expect.objectContaining({ label: 'Guides', link: '/guides/' })],
      {},
    );
  });

  it('uses the default Blog prefix when Blog is enabled without explicit options', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'dropdown',
      topics: [{ label: 'Guides', link: '/guides/' }],
    }, {});

    expect(topicFactory).toHaveBeenCalledWith(
      expect.any(Array),
      { exclude: ['/blog', '/blog/**/*'] },
    );
  });

  it('requires root topics in plugin-backed modes', () => {
    expect(() => createN0ctSidebarTopics({ topicDisplay: 'list', topics: [] }, { blog: false }))
      .toThrow(/sidebar\.topics is empty/);
  });
});
