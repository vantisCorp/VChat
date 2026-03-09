// @ts-check
const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'V-COMM Documentation',
  tagline: 'Next-Generation Secure Communication Platform',
  favicon: 'img/favicon.ico',

  url: 'https://vcomm.app',
  baseUrl: '/docs/',

  organizationName: 'vantisCorp',
  projectName: 'VChat',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pl', 'de', 'zh', 'es'],
    localeConfigs: {
      en: {
        label: 'English',
      },
      pl: {
        label: 'Polski',
      },
      de: {
        label: 'Deutsch',
      },
      zh: {
        label: '中文',
      },
      es: {
        label: 'Español',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/vantisCorp/VChat/tree/main/website/',
          versions: {
            current: {
              label: 'v1.0.0-alpha',
              path: 'current',
            },
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/vantisCorp/VChat/tree/main/website/blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/vcomm-social-card.jpg',
      navbar: {
        title: 'V-COMM',
        logo: {
          alt: 'V-COMM Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'API',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/vantisCorp/VChat',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Installation Guide',
                to: '/docs/category/getting-started',
              },
              {
                label: 'API Reference',
                to: '/docs/category/api',
              },
              {
                label: 'Security',
                to: '/docs/category/security',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/vcomm',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/vcomm_app',
              },
              {
                label: 'Contributing',
                to: '/docs/contributing',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/vantisCorp/VChat',
              },
              {
                label: 'Bug Bounty',
                href: 'https://github.com/vantisCorp/VChat/security',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} VantisCorp. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['rust', 'bash', 'json', 'yaml', 'toml'],
      },
      mermaid: {
        theme: { light: 'default', dark: 'dark' },
      },
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'vcomm',
        contextualSearch: true,
      },
    }),

  plugins: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en', 'de', 'zh', 'es'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
      },
    ],
    // PWA Plugin for offline support
    [
      '@docusaurus/plugin-pwa',
      {
        debug: process.env.NODE_ENV === 'development',
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/img/favicon.ico',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json',
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: '#1a1a2e',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: '#1a1a2e',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: '/img/logo192.png',
          },
          {
            tagName: 'link',
            rel: 'mask-icon',
            href: '/img/logo.svg',
            color: '#1a1a2e',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileImage',
            content: '/img/logo192.png',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileColor',
            content: '#1a1a2e',
          },
        ],
      },
    ],
    // Sitemap plugin is already included in preset-classic
    // Client redirects
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/docs/current/getting-started/installation',
            from: '/docs/install',
          },
          {
            to: '/docs/current/security/overview',
            from: '/docs/security',
          },
        ],
      },
    ],
  ],
};

module.exports = config;
