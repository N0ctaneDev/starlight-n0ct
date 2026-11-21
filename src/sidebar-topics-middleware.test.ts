import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveTopicMiddleware } = vi.hoisted(() => ({
  resolveTopicMiddleware: vi.fn(async (_context: any) => {}),
}));

vi.mock('starlight-sidebar-topics/middleware', () => ({
  onRequest: resolveTopicMiddleware,
}));

import { onRequest } from './sidebar-topics-middleware.js';

const link = (label: string) => ({
  type: 'link',
  label,
  href: '/' + label.toLowerCase() + '/',
  isCurrent: false,
  attrs: {},
});

const group = (label: string, entries: ReturnType<typeof link>[]) => ({
  type: 'group',
  label,
  entries,
  collapsed: false,
});

describe('Sidebar Topics route middleware adapter', () => {
  beforeEach(() => resolveTopicMiddleware.mockReset());

  it('removes integration entries from positional topic lookup and restores them afterwards', async () => {
    const blogLink = { ...link('Blog'), attrs: { class: 'sl-blog-mobile-link' } };
    const startPage = link('Getting started');
    const guideOverview = link('Guides overview');
    const guideConfig = link('Configuration');
    const startTopic = group('0', [startPage]);
    const guidesTopic = group('1', [guideOverview, guideConfig]);

    let sidebarSeenByResolver: unknown;
    resolveTopicMiddleware.mockImplementation(async (context: any) => {
      const route = context.locals.starlightRoute;
      sidebarSeenByResolver = route.sidebar;
      // Mimic the upstream plugin resolving group topic #1 by array position.
      route.sidebar = route.sidebar[1].entries;
    });

    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: true,
          sidebar: [blogLink, startTopic, guidesTopic],
        },
      },
    };

    await onRequest(context);

    expect(sidebarSeenByResolver).toEqual([startTopic, guidesTopic]);
    expect(context.locals.starlightRoute.sidebar).toEqual([
      blogLink,
      guideOverview,
      guideConfig,
    ]);
  });

  it('leaves an excluded route sidebar unchanged when it has no numeric topic groups', async () => {
    const blogSidebar = [
      link('All posts'),
      group('Recent posts', [link('First post')]),
      group('Tags', [link('Release')]),
    ];
    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: true,
          sidebar: blogSidebar,
        },
      },
    };

    await onRequest(context);

    expect(context.locals.starlightRoute.sidebar).toEqual(blogSidebar);
    expect(resolveTopicMiddleware).toHaveBeenCalledOnce();
  });

  it('does not normalize route data on pages without a sidebar', async () => {
    const sidebar = [group('0', [link('Overview')])];
    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: false,
          sidebar,
        },
      },
    };

    await onRequest(context);

    expect(context.locals.starlightRoute.sidebar).toEqual(sidebar);
    expect(resolveTopicMiddleware).toHaveBeenCalledOnce();
  });
});
