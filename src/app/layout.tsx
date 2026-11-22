import type { Metadata, Viewport } from 'next';
import { getSettings } from '@/lib/db/repository';
import { darkenHex, hexToRgbChannels } from '@/lib/format';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b'
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.brand_name} — ${settings.slogan} | Materiais de Construção`,
    description: settings.hero_subtitle
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const primary = settings.primary_color || '#cf141b';
  const primaryDark = darkenHex(primary, 36);
  const primaryRgb = hexToRgbChannels(primary);
  const primaryDarkRgb = hexToRgbChannels(primaryDark);

  return (
    <html
      lang="pt-BR"
      style={
        {
          '--brand-primary': primary,
          '--brand-primary-dark': primaryDark,
          '--brand-primary-rgb': primaryRgb,
          '--brand-primary-dark-rgb': primaryDarkRgb
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Playfair+Display:ital,wght@0,600;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased selection:bg-brand selection:text-white">
        {children}
      </body>
    </html>
  );
}
