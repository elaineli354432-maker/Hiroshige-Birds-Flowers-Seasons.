import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Hiroshige — Birds, Flowers, Seasons',
  description:
    '歌川广重：花鸟与四时。Explore 114 nature prints through the changing seasons.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
