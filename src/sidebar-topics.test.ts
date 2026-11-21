import { beforeEach, describe, expect, it, vi } from 'vitest';

const { topicFactory } = vi.hoisted(() => ({
  topicFactory: vi.fn(() => ({
    name: 'starlight-sidebar-topics',
    hooks: {
      'config:setup': ({
        addRouteMiddleware,
      }: {
        addRouteMiddleware: (config: { entrypoint: string; order?: 'pre' | 'post' | 'default' }) => void;
      }) => addRouteMiddleware({
        entrypoint: 'starlight-sidebar-topics/middleware',
        order: 'pre',
      }),
    },
  })),
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
      topics: [{ label: 'Guides', id: 'guides', icon: 'open-book', link: '/guides/', directory: 'guides' }],
    }, { blog: false });

    expect(plugins).toHaveLength(1);
    expect(topicFactory).toHaveBeenCalledOnce();
    expect(topicFactory).toHaveBeenCalledWith(
      [expect.objectContaining({ label: 'Guides', id: 'guides', link: '/guides/', icon: 'open-book' })],
      { topics: { guides: ['/guides/index', '/*/guides/index'] } },
    );
  });

  it('runs topic routing after Starlight Versions selects a version sidebar', () => {
    const [plugin] = createN0ctSidebarTopics({
      topicDisplay: 'list',
      topics: [{ label: 'Guides', id: 'guides', link: '/guides/', directory: 'guides' }],
    }, { blog: false });
    const addRouteMiddleware = vi.fn();

    plugin?.hooks['config:setup']?.({
      addRouteMiddleware,
    } as never);

    expect(addRouteMiddleware).toHaveBeenCalledWith({
      entrypoint: 'starlight-sidebar-topics/middleware',
      order: 'post',
    });
  });

  it('preserves user route options and excludes the configured Blog prefix', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'list',
      topics: [{ label: 'Reference', id: 'reference', link: '/reference/', directory: 'reference' }],
      extra: [{ label: 'External', link: 'https://example.com' }],
      topicOptions: {
        exclude: ['/search', '/api/**'],
        topics: { reference: ['/generated-api/**', '/reference/index', '/*/reference/index'] },
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
        topics: { reference: ['/generated-api/**', '/reference/index', '/*/reference/index'] },
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
      { topics: { 'n0ct-topic-1': ['/guides/index', '/*/guides/index'] } },
    );
  });

  it('uses the default Blog prefix when Blog is enabled without explicit options', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'dropdown',
      topics: [{ label: 'Guides', link: '/guides/' }],
    }, {});

    expect(topicFactory).toHaveBeenCalledWith(
      expect.any(Array),
      { exclude: ['/blog', '/blog/**/*'], topics: { 'n0ct-topic-1': ['/guides/index', '/*/guides/index'] } },
    );
  });

  it('maps directory index routes to their topic so a fresh topic root selects the right sidebar', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'list',
      topics: [
        { label: 'Guides', link: '/guides/', directory: 'guides' },
        { label: 'Reference', link: '/reference/', directory: 'reference' },
      ],
    }, { blog: false });

    expect(topicFactory).toHaveBeenCalledWith(expect.any(Array), {
      topics: {
        'n0ct-topic-1': ['/guides/index', '/*/guides/index'],
        'n0ct-topic-2': ['/reference/index', '/*/reference/index'],
      },
    });
  });

  it('passes the single topic icon property to the list and dropdown plugin', () => {
    createN0ctSidebarTopics({
      topicDisplay: 'dropdown',
      topics: [{ label: 'Guides', id: 'guides', icon: 'open-book', link: '/guides/', directory: 'guides' }],
    }, { blog: false });

    expect(topicFactory).toHaveBeenCalledWith(
      [expect.objectContaining({ icon: 'open-book' })],
      expect.anything(),
    );
  });

  it('requires root topics in plugin-backed modes', () => {
    expect(() => createN0ctSidebarTopics({ topicDisplay: 'list', topics: [] }, { blog: false }))
      .toThrow(/sidebar\.topics is empty/);
  });
});
