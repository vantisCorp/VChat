// @ts-check
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'V-COMM Documentation',
  tagline: 'Next-Generation Secure Communication Platform',
  favicon: 'img/favicon.ico',

  url: 'https://vcomm.app',
  baseUrl: '/docs/',

  organizationName: 'vantisCorp',
  projectName: 'VChat',

  onBrokenLinks: 'throw',
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
        language: ['en', 'pl', 'de', 'zh', 'es'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
      },
    ],
  ],
};

module.exports = config;