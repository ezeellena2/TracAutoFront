import { HelmetProvider } from 'react-helmet-async';
import { AppProviders } from '@/app/providers';
import { AlquilerRouter } from './routes';

export function AlquilerApp() {
  return (
    <HelmetProvider>
      <AppProviders>
        <AlquilerRouter />
      </AppProviders>
    </HelmetProvider>
  );
}

export default AlquilerApp;
