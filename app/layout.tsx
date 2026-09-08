import type { Metadata } from 'next';
import './globals.css';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Hiroshige — Birds, Flowers, Seasons',
    template: '%s — Hiroshige Exhibition',
  },
  description:
    '歌川广重：花鸟与四时。Explore 114 nature prints through the changing seasons.',
  keywords: ['Utagawa Hiroshige', '歌川广重', 'ukiyo-e', '浮世绘', 'birds and flowers', '花鸟画', 'chū-tanzaku'],
  openGraph: {
    type: 'website',
    title: 'Hiroshige — Birds, Flowers, Seasons',
    description: 'A bilingual digital exhibition of 114 chū-tanzaku nature prints across four seasons.',
    images: [{ url: '/artworks/103-warbler-on-plum-branch-2.jpg', alt: 'Warbler on Plum Branch by Utagawa Hiroshige' }],
  },
  twitter: { card: 'summary_large_image' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Hiroshige — Birds, Flowers, Seasons',
            alternateName: '歌川广重：花鸟与四时',
            description: 'A bilingual digital exhibition of 114 chū-tanzaku nature prints.',
            about: { '@type': 'Person', name: 'Utagawa Hiroshige', alternateName: '歌川广重' },
            numberOfItems: 114,
            inLanguage: ['en', 'zh'],
          }).replace(/</g, '\\u003c') }}
        />
      </body>
    </html>
  );
}
