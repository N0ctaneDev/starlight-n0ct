// @ts-check

/**
 * N0ctane Starlight configuration.
 * @satisfies {import('@n0ctanedev/starlight-n0ct').N0ctConfig}
 */
const config = {
  favicon: '/favicons/n0ctane.svg',
  title: 'My Publication',
  description: 'A blog and documentation publication powered by Starlight-N0ct.',
  versioning: false,
  sidebar: {
    topicDisplay: 'dropdown',
    topicOptions: { exclude: ['/blog', '/blog/**/*'] },
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
    linksValidator: {
      exclude: ({ link }) => {
        const path = link.split(/[?#]/, 1)[0].replace(/^\\/+/, '');
        return path === 'blog' || path.startsWith('blog/');
      },
    },
    blog: {
      prefix: 'blog',
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
    defaultTheme: 'n0ctane',
    themes: {
      n0ctane: {
        label: 'N0ctane',
        favicon: '/favicons/n0ctane.svg',
        logo: { dark: '/logos/n0ctane-dark.svg', light: '/logos/n0ctane-light.svg' },
        colors: {
          dark: {
            brandGradient: 'linear-gradient(115deg, #F25CFF 0%, #8C42FF 52%, #00E5FF 100%)',
            palette: { primary: '#F25CFF', secondary: '#8C42FF', accent: '#00E5FF', surface: '#131626', text: '#E6EAF8', highlight: '#2A85FF', highlightText: '#080A15', background: '#0B0D17' },
            codePalette: { background: '#0D1020', foreground: '#E6EAF8', comment: '#A3AED1', keyword: '#FF8DD6', string: '#9FE6B8' },
          },
          light: {
            brandGradient: 'linear-gradient(115deg, #B72DBF 0%, #7540CE 52%, #00AFC2 100%)',
            palette: { primary: '#B72DBF', secondary: '#7540CE', accent: '#00AFC2', surface: '#FFFFFF', text: '#211D32', highlight: '#286DCE', highlightText: '#FFFFFF', background: '#F6F5FB' },
            codePalette: { background: '#F3F1F8', foreground: '#29253D', comment: '#68627F', keyword: '#92247E', string: '#08764D' },
          },
        },
      },
      dracula: {
        label: 'Dracula',
        favicon: '/favicons/dracula.svg',
        logo: { dark: '/logos/dracula-dark.svg', light: '/logos/dracula-light.svg' },
        colors: {
          dark: {
            brandGradient: 'linear-gradient(115deg, #BD93F9 0%, #FF79C6 52%, #8BE9FD 100%)',
            palette: { primary: '#BD93F9', secondary: '#FF79C6', accent: '#8BE9FD', surface: '#343746', text: '#F8F8F2', highlight: '#44475A', highlightText: '#F8F8F2', background: '#282A36' },
            codePalette: { background: '#282A36', foreground: '#F8F8F2', comment: '#6272A4', keyword: '#FF79C6', string: '#F1FA8C' },
          },
          light: {
            brandGradient: 'linear-gradient(115deg, #644AC9 0%, #A3144D 52%, #036A96 100%)',
            palette: { primary: '#644AC9', secondary: '#A3144D', accent: '#036A96', surface: '#ECE9DF', text: '#1F1F1F', highlight: '#CFCFDE', highlightText: '#1F1F1F', background: '#FFFBEB' },
            codePalette: { background: '#FFFBEB', foreground: '#1F1F1F', comment: '#6C664B', keyword: '#A3144D', string: '#846E15' },
          },
        },
      },
    },
    glow: 'balanced',
    contentWidth: '55rem',
    sidebarWidth: '17rem',
  },
};

export default config;
