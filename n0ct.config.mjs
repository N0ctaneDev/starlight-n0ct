// @ts-check
/**
 * N0ctane's editor-checked theme configuration.
 * @satisfies {import('./src/types.js').N0ctConfig}
 */
const config = {
  title: '[lucide:terminal] N0ctane',
  description: 'A modern documentation theme for Astro Starlight.',
  sidebar: {
    topicDisplay: 'collapsible',
    topics: [
      { label: 'Start here', id: 'start', icon: 'lucide:rocket', link: '/getting-started/', items: ['getting-started', 'contributing', 'changelog'] },
      { label: 'Guides', id: 'guides', icon: 'lucide:book-open', link: '/guides' },
      { label: 'Components', id: 'components', icon: 'lucide:blocks', link: '/components' },
      { label: 'Reference', id: 'reference', icon: 'lucide:library', link: '/reference' },
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
    colors: {
      dark: {
        palette: { primary: '#7650C8', accent: '#3478D4', surface: '#151525', text: '#E9EAF5' },
      },
      light: {
        palette: { primary: '#286DCE', accent: '#7540CE', surface: '#FFFFFF', text: '#191629' },
      },
    },
  },
};
export default config;
