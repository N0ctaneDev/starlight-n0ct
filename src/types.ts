import type { StarlightIcon, StarlightUserConfig } from '@astrojs/starlight/types';

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
  /** Optional Starlight built-in icon used consistently by every sidebar topic presentation. */
  icon?: StarlightIcon;
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

export type N0ctThemeSemantic = 'success' | 'warning' | 'danger' | 'info';

export interface N0ctThemePalette {
  /** Main brand color. The defaults preserve the original N0ctane primary hue in each mode. */
  primary?: string;
  /** Interactive color for focus, active controls and hover states. */
  accent?: string;
  /** Main card and panel surface color. */
  surface?: string;
  /** Main readable foreground color. */
  text?: string;
  /** Optional secondary brand color. Derived from primary and accent when omitted. */
  secondary?: string;
  /** Optional highlighted surface color. */
  highlight?: string;
  /** Optional text color on highlighted surfaces. */
  highlightText?: string;
  /** Optional page background. Derived from surface when omitted. */
  background?: string;
}

export interface N0ctThemeSemanticColors {
  foreground?: string;
  background?: string;
  border?: string;
  text?: string;
}

export interface N0ctThemeCodeOverrides {
  background?: string;
  foreground?: string;
  cursor?: string;
  selectionBackground?: string;
  lineHighlight?: string;
  lineNumber?: string;
  lineNumberActive?: string;
  diffAdded?: Partial<N0ctThemeSemanticColors>;
  diffRemoved?: Partial<N0ctThemeSemanticColors>;
  tabs?: {
    background?: string;
    activeBackground?: string;
    foreground?: string;
    activeForeground?: string;
    border?: string;
  };
}

export interface N0ctThemeOverrides {
  brand?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    highlight?: string;
    highlightText?: string;
  };
  surfaces?: {
    void?: string;
    base?: string;
    surface?: string;
    elevated?: string;
    sunken?: string;
    overlay?: string;
    navigation?: string;
    sidebar?: string;
    code?: string;
  };
  text?: {
    primary?: string;
    secondary?: string;
    muted?: string;
    subtle?: string;
    inverse?: string;
    accent?: string;
    highlight?: string;
    onAccent?: string;
  };
  borders?: {
    subtle?: string;
    default?: string;
    strong?: string;
    focus?: string;
  };
  interactive?: {
    hover?: string;
    active?: string;
    selected?: string;
  };
  highlight?: {
    background?: string;
    text?: string;
    border?: string;
    selectionBackground?: string;
    selectionText?: string;
  };
  code?: N0ctThemeCodeOverrides;
}

/** Independent syntax colors for Expressive Code in each appearance mode. */
export interface N0ctThemeCodePalette {
  /** Code canvas and base source foreground. */
  background?: string;
  foreground?: string;
  comment?: string;
  keyword?: string;
  string?: string;
  number?: string;
  function?: string;
  type?: string;
  variable?: string;
  tag?: string;
  attribute?: string;
  punctuation?: string;
  invalid?: string;
}

export interface N0ctThemeEffects {
  /** CSS gradient treatments used across the interface. Values accept CSS gradients or color values. */
  gradients?: {
    brand?: string;
    brandSoft?: string;
    monochrome?: string;
    accent?: string;
    canvas?: string;
    shimmer?: string;
    callout?: string;
    card?: string;
    cardHover?: string;
    steps?: string;
    fileTree?: string;
    sidebar?: string;
    sidebarActive?: string;
    versionSelect?: string;
    scrollbar?: string;
    scrollbarHover?: string;
    divider?: string;
  };
  /** CSS box-shadow values used by shared components and overlays. */
  shadows?: {
    soft?: string;
    float?: string;
    callout?: string;
    card?: string;
    cardHover?: string;
    control?: string;
    popover?: string;
    sidebar?: string;
    sidebarActive?: string;
    scrollbar?: string;
    scrollbarHover?: string;
    focus?: string;
    tab?: string;
    wordmark?: string;
    step?: string;
  };
}

export interface N0ctThemeMode {
  /** Four core colors plus up to four optional refinement colors. */
  palette?: N0ctThemePalette;
  /** CSS gradient for branded text and divider lines, configured independently per appearance mode. */
  brandGradient?: string;
  /** Optional per-mode syntax palette, separate from the documentation UI palette. */
  codePalette?: N0ctThemeCodePalette;
  /** Semantic colors are independently configurable in each mode. */
  semantic?: Partial<Record<N0ctThemeSemantic, N0ctThemeSemanticColors>>;
  /** Optional role overrides. Unset roles are derived from the palette. */
  overrides?: N0ctThemeOverrides;
  /** Optional per-mode gradients and shadows used by shared UI components. */
  effects?: N0ctThemeEffects;
}

export interface N0ctThemeColors {
  dark?: N0ctThemeMode;
  light?: N0ctThemeMode;
}

/** A named color theme. Both modes are independently derived from the main palette fields. */
export interface N0ctThemeDefinition {
  /** Optional favicon path relative to the consumer project's public/ directory. Falls back to the global favicon. */
  favicon?: string;
  /** Optional appearance-specific logo paths relative to public/. Falls back to Starlight's configured logo. */
  logo?: {
    /** Logo shown while the named theme is in dark mode. */
    dark?: string;
    /** Logo shown while the named theme is in light mode. */
    light?: string;
  };
  /** Label shown in the theme picker. Defaults to a title-cased theme ID. */
  label?: string;
  /** Dark and light values for this theme. */
  colors?: N0ctThemeColors;
}

export interface N0ctThemeConfig {
  /** Theme ID selected when a visitor has no saved preference. Defaults to `n0ctane`. */
  defaultTheme?: string;
  /** Named palettes available in the theme picker, keyed by a stable lowercase ID. */
  themes?: Record<string, N0ctThemeDefinition>;
  /**
   * Backwards-compatible colors for the built-in `n0ctane` theme.
   * New projects should define colors inside `themes`.
   */
  colors?: N0ctThemeColors;
  /** Main content width, e.g. `58rem` or `900px`. */
  contentWidth?: string;
  /** Sidebar width, e.g. `18rem` or `280px`. */
  sidebarWidth?: string;
  /** Decorative background glow strength. */
  glow?: 'subtle' | 'balanced' | 'strong';
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
  /** Global favicon path relative to the consumer project's public/ directory. Named themes may override it. */
  favicon?: string;
  /** Required documentation site title, passed to Starlight. */
  title: string;
  /** Optional description used by Starlight metadata and search previews. */
  description?: string;
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
  /** Named light/dark palettes with individually overridable semantic roles. */
  theme?: N0ctThemeConfig;
  /** Advanced native Starlight settings. These are merged after N0ctane defaults. */
  starlight?: Partial<StarlightUserConfig>;
}

export interface N0ctaneOptions extends N0ctConfig {}
