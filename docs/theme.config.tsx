import { DocsThemeConfig } from 'nextra-theme-docs';

const SEO = {
  title: 'QuranJS / API',
  titleSuffix: ' - QuranJS / API',
  description:
    'QuranJS / Api: A library for fetching quran data from the Quran.com API on both Node.js and the browser.',
  image: 'https://github.com/quran/api-js/raw/master/media/repo-header.png',
  twitter: '@ahmedriad_',
  github: 'quran/api-js',
  color: '#5120DB',
  domain: 'www.quranjs.com',
};

const logo = (
  <>
    <span className="mr-2 font-extrabold inline">QuranJS</span>
    <span className="text-gray-600 font-normal inline">API</span>
  </>
);

const theme: DocsThemeConfig = {
  primaryHue: 270,
  project: {
    link: `https://github.com/${SEO.github}`,
  },
  docsRepositoryBase: `https://github.com/${SEO.github}/blob/master/docs/pages`,
  useNextSeoProps() {
    return {
      titleTemplate: `%s${SEO.titleSuffix}`,
    };
  },
  logo,
  head: (
    <>
      <meta name="msapplication-TileColor" content={SEO.color} />
      <meta name="theme-color" content={SEO.color} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="description" content={SEO.description} />
      <meta name="og:description" content={SEO.description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={SEO.image} />
      <meta name="twitter:site:domain" content={SEO.domain} />
      <meta name="twitter:url" content={`https://${SEO.domain}`} />
      <meta name="og:title" content={SEO.title} />
      <meta name="og:image" content={SEO.image} />
      <meta name="apple-mobile-web-app-title" content={SEO.title} />

      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/android-chrome-192x192.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
    </>
  ),
  sidebar: {
    titleComponent: ({ title, type }) => {
      if (type === 'separator')
        return <span className="cursor-default">{title}</span>;

      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 0,
  },
  navigation: {
    next: true,
    prev: true,
  },
  editLink: {
    text: 'Edit this page on GitHub',
  },
  footer: {
    text: () => <>MIT {new Date().getFullYear()} © QuranJS.</>,
  },
};

export default theme;
