import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/lib/data-context';
import { FilterProvider } from '@/lib/filter-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppLayout } from '@/components/AppLayout';
import { themeScript } from './theme-script';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kyodo Business Intelligence',
  description: 'Kyodo Lab - Business Intelligence Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <DataProvider>
            <FilterProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </FilterProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
