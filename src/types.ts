import type { StarlightUserConfig } from '@astrojs/starlight/types';

export type N0ctBadge = string | {
  text: string;
  variant?: 'note' | 'tip' | 'caution' | 'danger' | 'success' | 'default';
  class?: string;
};

/** Native Starlight sidebar entries accepted in manual `items` and `sidebar.extra`. */
export type N0ctNativeSidebarItem =
  | string
  | {
      label: string;
      link: string;
      attrs?: Record<string, string | number | boolean | undefined>;
      badge?: Exclude<N0ctBadge, string>;
      translations?: Record<string, string>;
    }
  | {
      slug: string;
      label?: string;
      attrs?: Record<string, string | number | boolean | undefined>;
      badge?: Exclude<N0ctBadge, string>;
      translations?: Record<string, string>;
    }
  | {
      label: string;
      items: N0ctNativeSidebarItem[];
      collapsed?: boolean;
      badge?: Exclude<N0ctBadge, string>;
      translations?: Record<string, string>;
    }
  | {
      autogenerate: {
        directory: string;
        collapsed?: boolean;
        attrs?: Record<string, string | number | boolean | undefined>;
      };
    };

export type N0ctPluginOptions = false | Record<string, unknown>;

/** Options accepted by the upstream `starlight-versions` plugin. */
export interface N0ctVersioningConfig {
  /** Options for the current (unarchived) documentation version. */
  current?: {
    /** How links to this version are redirected. Defaults to `same-page`. */
    redirect?: 'root' | 'same-page';
    /** Label shown for the current version. Defaults to `Latest`. */
    label?: string;
  };
  /** Source-file glob patterns to exclude from versioning. */
  exclude?: string[];
  /** Archived documentation versions. At least one version is required. */
  versions: Array<{
    /** URL segment used to identify this version. */
    slug: string;
    /** Optional label shown in the version selector. */
    label?: string;
    /** How links to this version are redirected. Defaults to `same-page`. */
    redirect?: 'root' | 'same-page';
  }>;
}

/** Options forwarded to starlight-sidebar-topics when using list/dropdown mode. */
export interface N0ctSidebarTopicsPluginOptions {
  /** Routes handled by other plugins (for example, a generated blog) that should keep their own sidebar. */
  exclude?: string[];
  /** Associate generated or otherwise unlisted route patterns with a configured topic ID. */
  topics?: Record<string, string[]>;
}

export type N0ctSidebarTopic = string | {
  label: string;
  /** Optional local/Iconify icon used by the collapsible sidebar presentation. */
  icon?: string;
  /** Optional built-in Starlight icon used by the topic dropdown presentation. */
  dropdownIcon?: string;
  /** Stable identifier for pages associated with this topic by other plugins. */
  id?: string;
  /** Internal page slug or external URL. For generated groups this also identifies the directory. */
  link?: string;
  /** Extra HTML attributes for a standalone topic link. */
  attrs?: Record<string, string | number | boolean | undefined>;
  /** Translated labels for a standalone topic link. */
  translations?: Record<string, string>;
  /** Content collection directory used by autogeneration. Defaults to the link path. */
  directory?: string;
  /** Generate children automatically. Defaults to true when `items` is omitted. */
  autogenerate?: boolean | { directory?: string };
  /** Native Starlight sidebar entries. */
  items?: N0ctNativeSidebarItem[];
  collapsed?: boolean;
  badge?: N0ctBadge;
};

export interface N0ctExpandedSidebarGroup {
  label: string;
  collapsed?: boolean;
  badge?: Exclude<N0ctBadge, string>;
  items: N0ctNativeSidebarItem[];
}

export type N0ctNormalizedSidebarItem = N0ctExpandedSidebarGroup | N0ctNativeSidebarItem;

export type N0ctNavPosition = 'left' | 'center' | 'right';
export type N0ctNavControl = 'brand' | 'search' | 'social' | 'versions' | 'theme' | 'language' | 'menuToggle';

export interface N0ctNavbarLink {
  label: string;
  href?: string;
  external?: boolean;
  position?: N0ctNavPosition;
  items?: Array<{ label: string; href: string; external?: boolean }>;
}

export interface N0ctNavbarConfig {
  /** Header height, for example `3.5rem` or `56px`. */
  height?: string;
  /** Place native header controls in the left, centre, or right group. */
  placements?: Partial<Record<N0ctNavControl, N0ctNavPosition>>;
  /** Custom top-level links and dropdowns. Root-relative paths respect Astro's base. */
  links?: N0ctNavbarLink[];
  showBrand?: boolean;
  showSearch?: boolean;
  showTheme?: boolean;
  showSocial?: boolean;
  showVersions?: boolean;
  showLanguage?: boolean;
  showMenuToggle?: boolean;
}

export interface N0ctNormalizedConfig {
  title: string;
  description?: string;
  sidebar?: N0ctNormalizedSidebarItem[];
  /** UI mode for the configured root-level topics. */
  sidebarTopicDisplay: 'collapsible' | 'list' | 'dropdown';
}

/**
 * Public, editor-facing schema for `n0ct.config.mjs`.
 * Keep this interface documented: its JSDoc comments power editor hovers.
 */
export interface N0ctConfig {
  /** Required documentation site title, passed to Starlight. */
  title: string;
  /** Optional description used by Starlight metadata and search previews. */
  description?: string;
  /** Full header layout and navigation controls. */
  navbar?: N0ctNavbarConfig;
  sidebar?: {
    /** Use Starlight's default collapsible sidebar, the upstream topic list, or its dropdown component. */
    topicDisplay?: 'collapsible' | 'list' | 'dropdown';
    topics?: N0ctSidebarTopic[];
    /** Options forwarded to starlight-sidebar-topics (list/dropdown modes only). */
    topicOptions?: N0ctSidebarTopicsPluginOptions;
    /** Append native Starlight sidebar entries after the shorthand topics. */
    extra?: N0ctNativeSidebarItem[];
  };
  /**
   * Native `starlight-versions` options. Set `false` or omit to disable.
   * Archived versions are generated from the current docs on first dev/build;
   * register `docsVersionsLoader()` in the content config as well.
   */
  versioning?: false | N0ctVersioningConfig;
  /** Built-in integrations. Set an entry to `false` to disable it, or `{}` to enable defaults. */
  integrations?: {
    /** Prefixes root-relative Markdown and frontmatter links with Astro's configured `base`. */
    basePath?: N0ctPluginOptions;
    /** Adds the Starlight announcement banner. */
    announcement?: N0ctPluginOptions;
    /** Adds keyboard-shortcut and keycap rendering support. */
    kbd?: N0ctPluginOptions;
    /** Generates LLM-friendly documentation routes. */
    llmsTxt?: N0ctPluginOptions;
    /** Adds the scroll-to-top control. Supports `smoothScroll` in the upstream plugin. */
    scrollToTop?: N0ctPluginOptions;
    /** Adds LLM-oriented page actions. */
    llmActions?: N0ctPluginOptions;
    /** Enables touch-swipe navigation for the Starlight sidebar. */
    sidebarSwipe?: N0ctPluginOptions;
    /** Checks links in documentation during the build. */
    linksValidator?: N0ctPluginOptions;
    /** Adds the Starlight Blog integration and routes. */
    blog?: N0ctPluginOptions;
    /** Enables image zoom for supported documentation images. */
    imageZoom?: N0ctPluginOptions;
  };
  /** Footer content rendered by the N0ctane footer component. */
  footer?: {
    /** Optional footer text. */
    text?: string;
    /** Text links displayed in the footer. */
    links?: Array<{ label: string; link: string; newTab?: boolean }>;
    /** Icon links displayed in the footer. Icon names use the `set:name` format. */
    icons?: Array<{ icon: string; link: string; newTab?: boolean; label?: string }>;
  };
  icons?: {
    /** Relative to the Astro project root. Defaults to `src/icons`. */
    iconDir?: string;
    /** Iconify collection names and allowlisted icon names. Lucide is included by default. */
    include?: Record<string, string[]>;
  };
  /** N0ctane-specific theme tokens and layout dimensions. */
  theme?: {
    /** Shared accent color, as a CSS hex color. */
    accent?: string;
    /** Dark-mode accent override, as a CSS hex color. */
    darkAccent?: string;
    /** Light-mode accent override, as a CSS hex color. */
    lightAccent?: string;
    /** Main content width, e.g. `58rem` or `900px`. */
    contentWidth?: string;
    /** Sidebar width, e.g. `18rem` or `280px`. */
    sidebarWidth?: string;
    /** Strength of the decorative background glow. */
    glow?: 'subtle' | 'balanced' | 'strong';
  };
  /** Advanced native Starlight settings. These are merged after N0ctane defaults. */
  starlight?: Partial<StarlightUserConfig>;
}

export interface N0ctaneOptions extends N0ctConfig {}
