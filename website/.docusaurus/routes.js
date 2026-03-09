import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/es/search',
    component: ComponentCreator('/docs/es/search', '319'),
    exact: true,
  },
  {
    path: '/docs/es/search',
    component: ComponentCreator('/docs/es/search', 'b9a'),
    exact: true,
  },
  {
    path: '/docs/es/docs',
    component: ComponentCreator('/docs/es/docs', '89f'),
    routes: [
      {
        path: '/docs/es/docs/current',
        component: ComponentCreator('/docs/es/docs/current', 'd12'),
        routes: [
          {
            path: '/docs/es/docs/current/tags',
            component: ComponentCreator('/docs/es/docs/current/tags', 'afe'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/api',
            component: ComponentCreator('/docs/es/docs/current/tags/api', '57b'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/authentication',
            component: ComponentCreator('/docs/es/docs/current/tags/authentication', '7f6'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/automation',
            component: ComponentCreator('/docs/es/docs/current/tags/automation', '511'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/best-practices',
            component: ComponentCreator('/docs/es/docs/current/tags/best-practices', '76d'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/bots',
            component: ComponentCreator('/docs/es/docs/current/tags/bots', 'acf'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/channels',
            component: ComponentCreator('/docs/es/docs/current/tags/channels', '70e'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/compliance',
            component: ComponentCreator('/docs/es/docs/current/tags/compliance', '2b0'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/contributing',
            component: ComponentCreator('/docs/es/docs/current/tags/contributing', '5e3'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/cryptography',
            component: ComponentCreator('/docs/es/docs/current/tags/cryptography', '7eb'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/deployment',
            component: ComponentCreator('/docs/es/docs/current/tags/deployment', '0c4'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/development',
            component: ComponentCreator('/docs/es/docs/current/tags/development', '6c6'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/drive',
            component: ComponentCreator('/docs/es/docs/current/tags/drive', '4f7'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/features',
            component: ComponentCreator('/docs/es/docs/current/tags/features', 'daf'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/files',
            component: ComponentCreator('/docs/es/docs/current/tags/files', '193'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/gateway',
            component: ComponentCreator('/docs/es/docs/current/tags/gateway', '528'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/graphql',
            component: ComponentCreator('/docs/es/docs/current/tags/graphql', 'af0'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/infrastructure',
            component: ComponentCreator('/docs/es/docs/current/tags/infrastructure', '53a'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/kubernetes',
            component: ComponentCreator('/docs/es/docs/current/tags/kubernetes', 'aee'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/mesh',
            component: ComponentCreator('/docs/es/docs/current/tags/mesh', '1a1'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/messages',
            component: ComponentCreator('/docs/es/docs/current/tags/messages', '667'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/mutations',
            component: ComponentCreator('/docs/es/docs/current/tags/mutations', '891'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/networking',
            component: ComponentCreator('/docs/es/docs/current/tags/networking', '541'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/pqc',
            component: ComponentCreator('/docs/es/docs/current/tags/pqc', 'b4a'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/production',
            component: ComponentCreator('/docs/es/docs/current/tags/production', '696'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/queries',
            component: ComponentCreator('/docs/es/docs/current/tags/queries', '2d3'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/real-time',
            component: ComponentCreator('/docs/es/docs/current/tags/real-time', 'b83'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/rest',
            component: ComponentCreator('/docs/es/docs/current/tags/rest', 'fbe'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/security',
            component: ComponentCreator('/docs/es/docs/current/tags/security', 'ab8'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/setup',
            component: ComponentCreator('/docs/es/docs/current/tags/setup', 'd0e'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/spaces',
            component: ComponentCreator('/docs/es/docs/current/tags/spaces', '1ed'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/standards',
            component: ComponentCreator('/docs/es/docs/current/tags/standards', '2e3'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/storage',
            component: ComponentCreator('/docs/es/docs/current/tags/storage', '484'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/subscriptions',
            component: ComponentCreator('/docs/es/docs/current/tags/subscriptions', '4f6'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/terraform',
            component: ComponentCreator('/docs/es/docs/current/tags/terraform', 'ecd'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/testing',
            component: ComponentCreator('/docs/es/docs/current/tags/testing', 'c13'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/users',
            component: ComponentCreator('/docs/es/docs/current/tags/users', 'aaa'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current/tags/websocket',
            component: ComponentCreator('/docs/es/docs/current/tags/websocket', '7fe'),
            exact: true,
          },
          {
            path: '/docs/es/docs/current',
            component: ComponentCreator('/docs/es/docs/current', '43c'),
            routes: [
              {
                path: '/docs/es/docs/current/',
                component: ComponentCreator('/docs/es/docs/current/', '471'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/api/',
                component: ComponentCreator('/docs/es/docs/current/api/', 'e29'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/graphql/mutations',
                component: ComponentCreator('/docs/es/docs/current/api/graphql/mutations', '79d'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/graphql/queries',
                component: ComponentCreator('/docs/es/docs/current/api/graphql/queries', 'e3e'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/graphql/subscriptions',
                component: ComponentCreator(
                  '/docs/es/docs/current/api/graphql/subscriptions',
                  '478'
                ),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/rest/authentication',
                component: ComponentCreator('/docs/es/docs/current/api/rest/authentication', 'a99'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/rest/channels',
                component: ComponentCreator('/docs/es/docs/current/api/rest/channels', 'd4a'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/rest/files',
                component: ComponentCreator('/docs/es/docs/current/api/rest/files', 'ad0'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/rest/messages',
                component: ComponentCreator('/docs/es/docs/current/api/rest/messages', '989'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/rest/users',
                component: ComponentCreator('/docs/es/docs/current/api/rest/users', '071'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/websocket/connection',
                component: ComponentCreator(
                  '/docs/es/docs/current/api/websocket/connection',
                  '554'
                ),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/websocket/events',
                component: ComponentCreator('/docs/es/docs/current/api/websocket/events', '9ab'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/api/websocket/gateway',
                component: ComponentCreator('/docs/es/docs/current/api/websocket/gateway', '5fc'),
                exact: true,
                sidebar: 'apiSidebar',
              },
              {
                path: '/docs/es/docs/current/architecture/cryptography',
                component: ComponentCreator(
                  '/docs/es/docs/current/architecture/cryptography',
                  'e85'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/architecture/network',
                component: ComponentCreator('/docs/es/docs/current/architecture/network', '5fd'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/architecture/overview',
                component: ComponentCreator('/docs/es/docs/current/architecture/overview', 'e8e'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/architecture/zero-trust',
                component: ComponentCreator('/docs/es/docs/current/architecture/zero-trust', 'a36'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/deployment/docker',
                component: ComponentCreator('/docs/es/docs/current/deployment/docker', 'd1e'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/deployment/kubernetes',
                component: ComponentCreator('/docs/es/docs/current/deployment/kubernetes', '01a'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/deployment/production',
                component: ComponentCreator('/docs/es/docs/current/deployment/production', '6e2'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/deployment/terraform',
                component: ComponentCreator('/docs/es/docs/current/deployment/terraform', 'ba8'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/development/coding-standards',
                component: ComponentCreator(
                  '/docs/es/docs/current/development/coding-standards',
                  'c9a'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/development/contributing',
                component: ComponentCreator(
                  '/docs/es/docs/current/development/contributing',
                  '548'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/development/roadmap-interactive',
                component: ComponentCreator(
                  '/docs/es/docs/current/development/roadmap-interactive',
                  'cb8'
                ),
                exact: true,
              },
              {
                path: '/docs/es/docs/current/development/setup',
                component: ComponentCreator('/docs/es/docs/current/development/setup', '66c'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/development/testing',
                component: ComponentCreator('/docs/es/docs/current/development/testing', '3d1'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/faq',
                component: ComponentCreator('/docs/es/docs/current/faq', '167'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/features/bots',
                component: ComponentCreator('/docs/es/docs/current/features/bots', 'c0b'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/features/channels',
                component: ComponentCreator('/docs/es/docs/current/features/channels', 'd94'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/features/drive',
                component: ComponentCreator('/docs/es/docs/current/features/drive', 'e01'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/features/mesh',
                component: ComponentCreator('/docs/es/docs/current/features/mesh', '58a'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/features/spaces',
                component: ComponentCreator('/docs/es/docs/current/features/spaces', 'fd6'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/getting-started/installation',
                component: ComponentCreator(
                  '/docs/es/docs/current/getting-started/installation',
                  '108'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/getting-started/quick-start',
                component: ComponentCreator(
                  '/docs/es/docs/current/getting-started/quick-start',
                  'ea7'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/getting-started/requirements',
                component: ComponentCreator(
                  '/docs/es/docs/current/getting-started/requirements',
                  '22f'
                ),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/roadmap',
                component: ComponentCreator('/docs/es/docs/current/roadmap', 'b8f'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/security/authentication',
                component: ComponentCreator('/docs/es/docs/current/security/authentication', 'b4f'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/security/best-practices',
                component: ComponentCreator('/docs/es/docs/current/security/best-practices', 'e1b'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/security/compliance',
                component: ComponentCreator('/docs/es/docs/current/security/compliance', 'e9c'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/security/overview',
                component: ComponentCreator('/docs/es/docs/current/security/overview', '311'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/security/pqc',
                component: ComponentCreator('/docs/es/docs/current/security/pqc', '26c'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
              {
                path: '/docs/es/docs/current/troubleshooting',
                component: ComponentCreator('/docs/es/docs/current/troubleshooting', '661'),
                exact: true,
                sidebar: 'tutorialSidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
