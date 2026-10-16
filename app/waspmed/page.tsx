import { permanentRedirect } from 'next/navigation';

/** The WaspMed landing was first published here; it is the home page now. */
export default function WaspmedRedirect() {
  permanentRedirect('/');
}
