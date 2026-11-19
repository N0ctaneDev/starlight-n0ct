// @ts-check

/**
 * N0ctane Starlight configuration.
 * Run `npx @n0ctanedev/starlight-n0ct init` to scaffold a configured project.
 * @satisfies {import('@n0ctanedev/starlight-n0ct').N0ctConfig}
 */
const config = {
  favicon: '/favicon.svg',
  title: 'My Publication',
  description: 'A blog and documentation publication powered by Starlight-N0ct.',

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
    llmActions: {},
    sidebarSwipe: {},
    linksValidator: {},
    blog: {
      navigation: 'header-start',
      metrics: { readingTime: true, words: 'rounded' },
      authors: {
        team: {
          name: 'Your publication',
          title: 'Editorial team',
          url: 'https://example.com/about',
        },
      },
    },
    imageZoom: {},
  },

  starlight: {
    logo: {
      dark: './src/assets/n0ctane-dark.svg',
      light: './src/assets/n0ctane-light.svg',
      alt: 'N0ctane logo',
    },
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
      dark: {
        palette: { primary: '#F25CFF', secondary: '#8C42FF', accent: '#00E5FF', surface: '#131626', text: '#E6EAF8', highlight: '#2A85FF', highlightText: '#080A15', background: '#0B0D17' },
        codePalette: { background: '#0D1020', foreground: '#E6EAF8', keyword: '#FF8DD6', string: '#9FE6B8' },
      },
      light: {
        palette: { primary: '#B72DBF', secondary: '#7540CE', accent: '#00AFC2', surface: '#FFFFFF', text: '#211D32', highlight: '#286DCE', highlightText: '#FFFFFF', background: '#F6F5FB' },
        codePalette: { background: '#F3F1F8', foreground: '#29253D', keyword: '#92247E', string: '#08764D' },
      },
    },
  },
};

export default config;
