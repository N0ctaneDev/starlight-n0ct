// @ts-check

/**
 * N0ctane's editor-checked theme configuration.
 * @satisfies {import('./src/types.js').N0ctConfig}
 */
const config = {
  title: '[lucide:terminal] N0ctane',
  description: 'A spacious, neon documentation theme for Astro Starlight.',

  navbar: {
    height: '3.25rem',
    showBrand: true,
    showSearch: true,
    showTheme: true,
    showSocial: true,
    showVersions: true,
    showLanguage: false,
    showMenuToggle: true,
    placements: {
      brand: 'left',
      search: 'center',
      social: 'right',
      versions: 'right',
      theme: 'right',
      language: 'right',
      menuToggle: 'right',
    },
    links: [
      { label: 'Getting started', href: '/getting-started/', position: 'left' },
      { label: 'Components', href: '/components/', position: 'left' },
      {
        label: 'Community',
        position: 'right',
        items: [
          { label: 'GitHub', href: 'https://github.com/n0ctanedev/starlight-n0ct', external: true },
          { label: 'N0ctOS', href: 'https://n0ctanedev.github.io', external: true },
        ],
      },
    ],
  },

  sidebar: {
    // Use 'collapsible' (Starlight default), 'list' (topic list), or 'dropdown'.
    topicDisplay: 'dropdown',
    topics: [
      { label: 'Start here', id: 'start', icon: 'lucide:rocket', dropdownIcon: 'open-book', link: '/getting-started/', items:["getting-started","contributing","changelog"] },
      { label: 'Guides', id: 'guides', icon: 'lucide:book-open', dropdownIcon: 'open-book', link: '/guides' },
      { label: 'Components', id: 'components', icon: 'lucide:blocks', dropdownIcon: 'puzzle', link: '/components' },
      { label: 'Reference', id: 'reference', icon: 'lucide:library', dropdownIcon: 'information', link: '/reference' },
    ],
  },

  versioning: false,

  
  integrations: {
    basePath: {},
    announcement: false,
    kbd: false,
    llmsTxt: {},
    scrollToTop: { smoothScroll: true },
    llmActions: {},
    sidebarSwipe: {},
    linksValidator: false,
    blog: false,
    imageZoom: {},
  },

  icons: {
    iconDir: './src/icons',
    include: { lucide: ['*'] },
  },

  footer: {
    text: 'Built with N0ctOS · N0ctane Team',
    links: [
      { label: 'GitHub', link: 'https://github.com/n0ctanedev/starlight-n0ct', newTab: true },
      { label: 'N0ctOS', link: 'https://n0ctanedev.github.io', newTab: true },
    ],
    icons: [
      { icon: 'lucide:github', link: 'https://github.com/n0ctanedev/starlight-n0ct', label: 'GitHub', newTab: true },
    ],
  },

  theme: {
    glow: 'balanced',
    contentWidth: '55rem',
    sidebarWidth: '17rem',
  },
};

export default config;
