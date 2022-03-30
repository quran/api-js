const SEO = {
  title: 'QuranJS / API',
  titleSuffix: ' - QuranJS / API',
  description:
    'QuranJS / Api: A library for fetching quran data from the Quran.com API on both Node.js and the browser.',
  image: 'https://github.com/quranjs/api/raw/master/media/repo-header.png',
  twitter: '@ahmedriad_',
  github: 'quranjs/api',
  color: '#5120DB',
  domain: 'quranjs.vercel.app',
}

const theme = {
  github: `https://github.com/${SEO.github}`,
  docsRepositoryBase: `https://github.com/${SEO.github}/blob/master/docs`,
  titleSuffix: SEO.titleSuffix,
  logo: (
    <>
      <span className="mr-2 font-extrabold hidden md:inline">QuranJS</span>
      <span className="text-gray-600 font-normal hidden md:inline">API</span>
    </>
  ),
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
  search: true,
  prevLinks: true,
  nextLinks: true,
  footer: true,
  footerEditLink: 'Edit this page on GitHub',
  footerText: <>MIT {new Date().getFullYear()} © QuranJS.</>,
}

export default theme
