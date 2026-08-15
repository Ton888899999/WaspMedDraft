import type {Metadata} from 'next';
import {Analytics} from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WaspMed Draft — AI Co-pilot для радиологов (МРТ/КТ)',
  description: 'Интеллектуальный ассистент врача-рентгенолога для анализа МРТ/КТ снимков и автоматической генерации протоколов.',
  openGraph: {
    title: 'WaspMed Draft — AI Co-pilot для радиологов',
    description: 'Интеллектуальный ассистент врача-рентгенолога для анализа МРТ/КТ снимков',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#0B0F17] text-[#E5E7EB] antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
