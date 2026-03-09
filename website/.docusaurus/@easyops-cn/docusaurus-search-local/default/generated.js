import lunr from '/workspace/node_modules/.pnpm/lunr@2.3.9/node_modules/lunr/lunr.js';
require('/workspace/node_modules/.pnpm/lunr-languages@1.14.0/node_modules/lunr-languages/lunr.stemmer.support.js')(
  lunr
);
require('/workspace/node_modules/.pnpm/lunr-languages@1.14.0/node_modules/lunr-languages/lunr.de.js')(
  lunr
);
require('/workspace/node_modules/.pnpm/lunr-languages@1.14.0/node_modules/lunr-languages/lunr.es.js')(
  lunr
);
require('/workspace/node_modules/.pnpm/@easyops-cn+docusaurus-search-local@0.44.6_@docusaurus+theme-common@3.9.2_@mdx-js+react@3.1.1_kjh7k2fhtulzo7vco63nrdkf4u/node_modules/@easyops-cn/docusaurus-search-local/dist/client/shared/lunrLanguageZh.js').lunrLanguageZh(
  lunr
);
require('/workspace/node_modules/.pnpm/lunr-languages@1.14.0/node_modules/lunr-languages/lunr.multi.js')(
  lunr
);
export const language = ['en', 'de', 'zh', 'es'];
export const removeDefaultStopWordFilter = false;
export const removeDefaultStemmer = false;
export { default as Mark } from '/workspace/node_modules/.pnpm/mark.js@8.11.1/node_modules/mark.js/dist/mark.js';
export const searchIndexUrl = 'search-index{dir}.json?_=02351fd2';
export const searchResultLimits = 8;
export const searchResultContextMaxLength = 50;
export const explicitSearchResultPath = true;
export const searchBarShortcut = true;
export const searchBarShortcutHint = true;
export const searchBarPosition = 'right';
export const docsPluginIdForPreferredVersion = undefined;
export const indexDocs = true;
export const searchContextByPaths = null;
export const hideSearchBarWithNoSearchContext = false;
export const useAllContextsWithNoSearchContext = false;
