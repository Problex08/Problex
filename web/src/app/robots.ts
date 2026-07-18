import type { MetadataRoute } from 'next';

const BASE_URL = 'https://problex.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/results',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
