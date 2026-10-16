import type { Metadata, Viewport } from 'next';
import { Onest } from 'next/font/google';
import { WaspmedLanding } from './WaspmedLanding';
import { TITLES } from './content';
import './waspmed.css';

const onest = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest' });

const description =
  'WaspMed — единая система для частной клиники: регистратура, врачи, лаборатория, диагностика, стационар, финансы, персонал.';

export const metadata: Metadata = {
  title: TITLES.ru,
  description,
  openGraph: { title: TITLES.ru, description, type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function WaspmedPage() {
  return <WaspmedLanding className={onest.variable} />;
}
