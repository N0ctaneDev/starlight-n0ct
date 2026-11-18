// @ts-check

/**
 * N0ctane Starlight configuration.
 * Run `npx n0ct init` to generate this file interactively.
 * @satisfies {import('@n0ctanedev/starlight-n0ct').N0ctConfig}
 */
const config = {
  title: 'My Documentation',
  description: 'Documentation powered by N0ctane and Astro Starlight.',

  // Set to a starlight-versions config object to archive and serve prior docs.
  versioning: false,

  sidebar: {
    // Choose: 'collapsible' (Starlight default), 'list', or 'dropdown'.
    topicDisplay: 'dropdown',
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

  integrations: {
    basePath: false,
    announcement: false,
    kbd: false,
    llmsTxt: {},
    scrollToTop: {},
    llmActions: false,
    sidebarSwipe: {},
    linksValidator: false,
    blog: {},
    imageZoom: {},
  },

  icons: {
    iconDir: './src/icons',
    include: { lucide: ['*'] },
  },

  theme: {
    glow: 'balanced',
    contentWidth: '55rem',
    sidebarWidth: '17rem',
    colors: {
      dark: { palette: { primary: '#F25CFF', secondary: '#8C42FF', accent: '#00E5FF', surface: '#131626', text: '#E6EAF8', highlight: '#2A85FF', highlightText: '#080A15', background: '#0B0D17' } },
      light: { palette: { primary: '#C92FCF', secondary: '#7540CE', accent: '#00AFC2', surface: '#FFFFFF', text: '#191629', highlight: '#286DCE', highlightText: '#FFFFFF', background: '#F8F7FC' } },
    },
  },
};

export default config;
