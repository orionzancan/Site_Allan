import type { Metadata, Viewport } from 'next';
import { Oswald, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { getSettings } from '@/lib/db/repository';
import { darkenHex } from '@/lib/format';
import './globals.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-oswald'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair'
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta'
});

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

  return (
    <html
      lang="pt-BR"
      className={`${oswald.variable} ${playfair.variable} ${jakarta.variable}`}
      style={
        {
          '--brand-primary': primary,
          '--brand-primary-dark': primaryDark
        } as React.CSSProperties
      }
    >
      <body className="font-sans antialiased selection:bg-brand selection:text-white">
        {children}
      </body>
    </html>
  );
}
