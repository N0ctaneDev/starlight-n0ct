import { describe, expect, it, vi } from 'vitest';

vi.mock('starlight-sidebar-topics/middleware', () => ({
  onRequest: vi.fn(),
}));

import { createSidebarTopicsMiddleware } from './sidebar-topics-middleware.js';

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
  it('removes integration entries from positional topic lookup and restores them afterwards', async () => {
    const blogLink = { ...link('Blog'), attrs: { class: 'sl-blog-mobile-link' } };
    const startPage = link('Getting started');
    const guideOverview = link('Guides overview');
    const guideConfig = link('Configuration');
    const startTopic = group('0', [startPage]);
    const guidesTopic = group('1', [guideOverview, guideConfig]);

    let sidebarSeenByResolver: unknown;
    const resolver = vi.fn(async (context: any) => {
      const route = context.locals.starlightRoute;
      sidebarSeenByResolver = route.sidebar;
      // Mimic the upstream plugin resolving group topic #1 by array position.
      route.sidebar = route.sidebar[1].entries;
    });
    const middleware = createSidebarTopicsMiddleware(resolver as never);
    const next = vi.fn(async () => {});

    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: true,
          sidebar: [blogLink, startTopic, guidesTopic],
        },
      },
    };

    await middleware(context, next);

    expect(sidebarSeenByResolver).toEqual([startTopic, guidesTopic]);
    expect(context.locals.starlightRoute.sidebar).toEqual([
      blogLink,
      guideOverview,
      guideConfig,
    ]);
    expect(resolver).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it('leaves an excluded route sidebar unchanged when it has no numeric topic groups', async () => {
    const blogSidebar = [
      link('All posts'),
      group('Recent posts', [link('First post')]),
      group('Tags', [link('Release')]),
    ];
    const resolver = vi.fn(async () => {});
    const middleware = createSidebarTopicsMiddleware(resolver as never);
    const next = vi.fn(async () => {});
    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: true,
          sidebar: blogSidebar,
        },
      },
    };

    await middleware(context, next);

    expect(context.locals.starlightRoute.sidebar).toEqual(blogSidebar);
    expect(resolver).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it('does not normalize route data on pages without a sidebar', async () => {
    const sidebar = [group('0', [link('Overview')])];
    const resolver = vi.fn(async () => {});
    const middleware = createSidebarTopicsMiddleware(resolver as never);
    const next = vi.fn(async () => {});
    const context: any = {
      locals: {
        starlightRoute: {
          hasSidebar: false,
          sidebar,
        },
      },
    };

    await middleware(context, next);

    expect(context.locals.starlightRoute.sidebar).toEqual(sidebar);
    expect(resolver).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });
});
