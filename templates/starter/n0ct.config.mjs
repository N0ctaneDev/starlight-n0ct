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
      dark: { palette: { primary: '#7650C8', accent: '#3478D4', surface: '#151525', text: '#E9EAF5' } },
      light: { palette: { primary: '#286DCE', accent: '#7540CE', surface: '#FFFFFF', text: '#191629' } },
    },
  },
};

export default config;
